#!/usr/bin/env node
/**
 * Loop Detector Hook (PostToolUse)
 * Detects 3 types of loops:
 *   1. Consecutive repeats — same tool+params N times in a row
 *   2. Ping-pong — alternating A↔B pattern (e.g., Edit→Bash→Edit→Bash)
 *   3. Context exhaustion — too many tool calls in a session (proxy for context window)
 *
 * Also accumulates session stats for session-memory hook consumption.
 *
 * State files in $TEMP:
 *   claude-loop-detector.json  — loop detection hashes (resets after 10min)
 *   claude-session-stats.json  — accumulated session data (tools, files, errors)
 *
 * Inspired by openclaw/src/agents/tool-loop-detection.ts
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// --- Configuration ---
const HISTORY_SIZE = 20;           // Sliding window (increased from 10 for ping-pong detection)
const REPEAT_THRESHOLD = 3;        // Consecutive repeats: warning
const CRITICAL_THRESHOLD = 5;      // Consecutive repeats: critical
const PINGPONG_THRESHOLD = 6;      // Alternating pairs: warning (6 = 3 full A→B cycles)
const PINGPONG_CRITICAL = 10;      // Alternating pairs: critical
const CONTEXT_WARN_CALLS = 60;     // Total calls proxy for context getting large (lowered from 80)
const CONTEXT_CRITICAL_CALLS = 90;  // Total calls proxy for context critically large (lowered from 120)

const TEMP = process.env.TEMP || "/tmp";
const STATE_FILE = path.join(TEMP, "claude-loop-detector.json");
const STATS_FILE = path.join(TEMP, "claude-session-stats.json");

function readStdin() {
  try {
    return fs.readFileSync(0, "utf8");
  } catch {
    return "{}";
  }
}

// --- State management ---

function loadState() {
  try {
    const data = fs.readFileSync(STATE_FILE, "utf8");
    const state = JSON.parse(data);
    if (Date.now() - (state.lastUpdate || 0) > 600000) {
      return { history: [], lastUpdate: Date.now() };
    }
    return state;
  } catch {
    return { history: [], lastUpdate: Date.now() };
  }
}

function saveState(state) {
  state.lastUpdate = Date.now();
  fs.writeFileSync(STATE_FILE, JSON.stringify(state));
}

function loadStats() {
  try {
    const data = fs.readFileSync(STATS_FILE, "utf8");
    const stats = JSON.parse(data);
    if (Date.now() - (stats.startedAt || 0) > 7200000) {
      return newStats();
    }
    return stats;
  } catch {
    return newStats();
  }
}

function newStats() {
  return {
    startedAt: Date.now(),
    totalCalls: 0,
    toolCounts: {},
    filesModified: [],
    filesRead: [],
    errors: 0,
    errorDetails: [],    // [{tool, message, ts}] — max 10
    bashCommands: [],    // executed commands — max 20
    commitMessages: [],  // git commit messages — max 5
    contextWarned: false,
  };
}

function saveStats(stats) {
  fs.writeFileSync(STATS_FILE, JSON.stringify(stats));
}

// --- Parameter normalization ---
// Reduces false negatives: editing line 42 then line 43 of the same file is the same pattern.

function normalizeParams(toolName, params) {
  if (!params || typeof params !== 'object') return params;

  const normalized = {};

  // Normalize file paths to forward-slash canonical form
  if (params.file_path) {
    normalized.file_path = params.file_path.replace(/\\/g, '/');
  }

  // Quantize line numbers by ±5 (nearby edits = same pattern)
  if (params.offset !== undefined) {
    normalized.offset_q = Math.floor(params.offset / 5) * 5;
  }

  // For Edit: hash old_string content, not the exact text (length-based grouping)
  if (toolName === 'Edit') {
    normalized.file_path = (params.file_path || '').replace(/\\/g, '/');
    normalized.old_len = params.old_string ? Math.floor(params.old_string.length / 50) * 50 : 0;
    normalized.new_len = params.new_string ? Math.floor(params.new_string.length / 50) * 50 : 0;
    return normalized;
  }

  // For Bash: extract command pattern (strip arguments that vary)
  if (toolName === 'Bash') {
    const cmd = params.command || '';
    // Keep the command verb and first argument, normalize the rest
    normalized.cmd_pattern = cmd.split(/\s+/).slice(0, 3).join(' ');
    return normalized;
  }

  // For Read: just the file path
  if (toolName === 'Read') {
    normalized.file_path = (params.file_path || '').replace(/\\/g, '/');
    return normalized;
  }

  // Default: use tool name + first 200 chars of stringified params
  return { tool: toolName, sig: JSON.stringify(params).slice(0, 200) };
}

// --- Hashing ---

function hashCall(toolName, params) {
  const normalized = normalizeParams(toolName, params);
  const key = JSON.stringify({ tool: toolName, params: normalized });
  return crypto.createHash("sha256").update(key).digest("hex").slice(0, 16);
}

// --- Detection: Consecutive Repeats ---

function countConsecutiveRepeats(history, currentHash) {
  let count = 1;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i] === currentHash) count++;
    else break;
  }
  return count;
}

// --- Detection: Ping-Pong (A↔B alternation) ---

function detectPingPong(history, currentHash) {
  // Need at least 2 items in history + current to detect alternation
  if (history.length < 2) return { count: 0 };

  const lastHash = history[history.length - 1];

  // Current must differ from last (that's the "alternating" part)
  if (currentHash === lastHash) return { count: 0 };

  // Check: does current match second-to-last? (A→B→A pattern)
  const secondToLast = history[history.length - 2];
  if (currentHash !== secondToLast) return { count: 0 };

  // Count the alternating tail length
  const hashA = currentHash;
  const hashB = lastHash;
  let alternatingCount = 1; // current counts as 1

  for (let i = history.length - 1; i >= 0; i--) {
    const distFromEnd = history.length - 1 - i;
    const expected = distFromEnd % 2 === 0 ? hashB : hashA;
    if (history[i] === expected) {
      alternatingCount++;
    } else {
      break;
    }
  }

  return { count: alternatingCount, hashA, hashB };
}

// --- Detection: Multi-cycle loops (A→B→C→A→B→C...) ---
// Detects repeating patterns of length 3-5 using sliding window.

function detectMultiCycle(history, currentHash) {
  const full = [...history, currentHash];
  if (full.length < 6) return { count: 0, patternLen: 0 };

  // Try pattern lengths 3, 4, 5
  for (let patternLen = 3; patternLen <= 5; patternLen++) {
    if (full.length < patternLen * 2) continue;

    const pattern = full.slice(-patternLen);
    let repeats = 1;

    // Walk backwards checking if the pattern repeats
    for (let offset = patternLen * 2; offset <= full.length; offset += patternLen) {
      const segment = full.slice(-offset, -offset + patternLen);
      if (segment.length !== patternLen) break;
      const matches = segment.every((h, i) => h === pattern[i]);
      if (matches) repeats++;
      else break;
    }

    if (repeats >= 2) {
      return { count: repeats, patternLen };
    }
  }

  return { count: 0, patternLen: 0 };
}

// --- File path extraction ---

function extractFilePath(toolName, toolInput) {
  if (toolInput.file_path) return toolInput.file_path;
  if (toolInput.path) return toolInput.path;
  if (toolName === "Bash" && toolInput.command) {
    const m = toolInput.command.match(/(?:git add|git commit|cp|mv)\s+["']?([^\s"']+)/);
    if (m) return m[1];
  }
  return null;
}

function addUnique(arr, value, max) {
  if (value && !arr.includes(value) && arr.length < (max || 50)) {
    arr.push(value);
  }
}

// --- Main ---

try {
  const input = JSON.parse(readStdin());
  const toolName = input.tool_name || "";
  const toolInput = input.tool_input || {};
  const toolOutput = input.tool_output || "";

  // === Session stats accumulation (ALL tools) ===
  const stats = loadStats();
  stats.totalCalls++;
  stats.toolCounts[toolName] = (stats.toolCounts[toolName] || 0) + 1;

  const filePath = extractFilePath(toolName, toolInput);
  if (filePath) {
    if (["Write", "Edit", "NotebookEdit"].includes(toolName)) {
      addUnique(stats.filesModified, filePath);
    } else if (["Read"].includes(toolName)) {
      addUnique(stats.filesRead, filePath, 30);
    }
  }

  // Track errors from tool output — capture details for learning
  const outputStr = typeof toolOutput === "string" ? toolOutput : JSON.stringify(toolOutput || "");
  if (outputStr.includes("Error") || outputStr.includes("error:") || outputStr.includes("FAILED")) {
    stats.errors++;
    if (stats.errorDetails.length < 10) {
      const errorLines = outputStr.split("\n").filter(function(l) {
        return /error|fail|exception|cannot|not found|denied|refused/i.test(l);
      }).slice(0, 2).join(" | ");
      if (errorLines) {
        stats.errorDetails.push({
          tool: toolName,
          message: errorLines.slice(0, 200),
          ts: Date.now()
        });
      }
    }
  }

  // Capture bash commands and git commits for knowledge
  if (toolName === "Bash" && toolInput) {
    const cmd = (typeof toolInput === "string" ? toolInput : toolInput.command || "").slice(0, 150);
    if (cmd && stats.bashCommands.length < 20) {
      stats.bashCommands.push(cmd);
    }
    if (cmd.includes("git commit") && !outputStr.includes("Error")) {
      const msgMatch = outputStr.match(/\[[\w/.-]+ [a-f0-9]+\] (.+)/);
      if (msgMatch && stats.commitMessages.length < 5) {
        stats.commitMessages.push(msgMatch[1]);
      }
    }
  }


  // === Context exhaustion warning (all tools count) ===
  if (stats.totalCalls === CONTEXT_CRITICAL_CALLS) {
    const msg = `[CONTEXT CRITICAL] ${stats.totalCalls} tool calls this session. Context window likely near limit. Use /compact NOW to free space.`;
    console.log(JSON.stringify({
      hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext: msg }
    }));
  } else if (stats.totalCalls === CONTEXT_WARN_CALLS && !stats.contextWarned) {
    const msg = `[CONTEXT WARNING] ${stats.totalCalls} tool calls this session. Consider using /compact to prevent context overflow.`;
    console.log(JSON.stringify({
      hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext: msg }
    }));
    stats.contextWarned = true;
  }

  saveStats(stats);

  // === Loop detection ===
  // Include Read in detection: Read→Edit→Read→Edit is a common loop pattern.
  // Skip only purely informational tools that never indicate a loop.
  const SKIP_LOOP_DETECTION = ["TaskList", "TaskGet", "TaskCreate", "TaskUpdate", "ToolSearch"];
  if (SKIP_LOOP_DETECTION.includes(toolName)) {
    process.exit(0);
  }

  const callHash = hashCall(toolName, toolInput);
  const state = loadState();

  // --- Detect BEFORE pushing (history = previous calls only) ---
  // --- Detector 1: Consecutive repeats ---
  const repeats = countConsecutiveRepeats(state.history, callHash);

  // --- Detector 2: Ping-pong alternation ---
  const pingpong = detectPingPong(state.history, callHash);

  // --- Detector 3: Multi-cycle loops (A→B→C→A→B→C...) ---
  const multiCycle = detectMultiCycle(state.history, callHash);

  // --- Push AFTER detection ---
  state.history.push(callHash);
  if (state.history.length > HISTORY_SIZE) {
    state.history = state.history.slice(-HISTORY_SIZE);
  }

  saveState(state);

  // Emit warnings via stdout JSON (most severe first)
  let loopMessage = null;
  if (repeats >= CRITICAL_THRESHOLD) {
    loopMessage = `[LOOP CRITICAL] Tool "${toolName}" called ${repeats}x identically. STOP and try a completely different approach.`;
  } else if (pingpong.count >= PINGPONG_CRITICAL) {
    loopMessage = `[PING-PONG CRITICAL] Alternating between 2 tool patterns ${pingpong.count}x with no progress. STOP — you're in a loop. Try a completely different approach.`;
  } else if (multiCycle.count >= 3) {
    loopMessage = `[MULTI-CYCLE CRITICAL] Repeating a ${multiCycle.patternLen}-step pattern ${multiCycle.count}x. STOP — you're in a loop. Try a completely different approach.`;
  } else if (repeats >= REPEAT_THRESHOLD) {
    loopMessage = `[LOOP WARNING] Tool "${toolName}" called ${repeats}x with same params. Consider changing approach.`;
  } else if (pingpong.count >= PINGPONG_THRESHOLD) {
    loopMessage = `[PING-PONG WARNING] Alternating between 2 tool patterns ${pingpong.count}x. This looks like a stuck loop — consider a different strategy.`;
  } else if (multiCycle.count >= 2) {
    loopMessage = `[MULTI-CYCLE WARNING] Repeating a ${multiCycle.patternLen}-step pattern ${multiCycle.count}x. This may be a loop — consider a different strategy.`;
  }

  if (loopMessage) {
    console.log(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PostToolUse",
        additionalContext: loopMessage
      }
    }));
  }
} catch {
  // Hook must never block — fail silently
  process.exit(0);
}
