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
const CONTEXT_WARN_CALLS = 80;     // Total calls proxy for context getting large
const CONTEXT_CRITICAL_CALLS = 120; // Total calls proxy for context critically large

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
    contextWarned: false,
  };
}

function saveStats(stats) {
  fs.writeFileSync(STATS_FILE, JSON.stringify(stats));
}

// --- Hashing ---

function hashCall(toolName, params) {
  const key = JSON.stringify({ tool: toolName, params }).slice(0, 500);
  return crypto.createHash("md5").update(key).digest("hex").slice(0, 12);
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
  // History ends with: ...A, B, A, B  and current = A
  // So we walk backwards checking the alternation pattern
  const hashA = currentHash;
  const hashB = lastHash;
  let alternatingCount = 1; // current counts as 1

  for (let i = history.length - 1; i >= 0; i--) {
    // Expect alternating: position from end 0=B, 1=A, 2=B, 3=A...
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

  // Track errors from tool output
  const outputStr = typeof toolOutput === "string" ? toolOutput : JSON.stringify(toolOutput || "");
  if (outputStr.includes("Error") || outputStr.includes("error:") || outputStr.includes("FAILED")) {
    stats.errors++;
  }

  // === Context exhaustion warning (all tools count) ===
  if (stats.totalCalls === CONTEXT_CRITICAL_CALLS) {
    console.error(
      `[CONTEXT CRITICAL] ${stats.totalCalls} tool calls this session. Context window likely near limit. Use /compact NOW to free space.`
    );
  } else if (stats.totalCalls === CONTEXT_WARN_CALLS && !stats.contextWarned) {
    console.error(
      `[CONTEXT WARNING] ${stats.totalCalls} tool calls this session. Consider using /compact to prevent context overflow.`
    );
    stats.contextWarned = true;
  }

  saveStats(stats);

  // === Loop detection (skip read-only tools) ===
  const READ_ONLY_TOOLS = ["Read", "Grep", "Glob", "WebFetch", "WebSearch", "TaskList", "TaskGet", "TaskCreate", "ToolSearch"];
  if (READ_ONLY_TOOLS.includes(toolName)) {
    process.exit(0);
  }

  const callHash = hashCall(toolName, toolInput);
  const state = loadState();

  // --- Detect BEFORE pushing (history = previous calls only) ---
  // --- Detector 1: Consecutive repeats ---
  const repeats = countConsecutiveRepeats(state.history, callHash);

  // --- Detector 2: Ping-pong alternation ---
  const pingpong = detectPingPong(state.history, callHash);

  // --- Push AFTER detection ---
  state.history.push(callHash);
  if (state.history.length > HISTORY_SIZE) {
    state.history = state.history.slice(-HISTORY_SIZE);
  }

  saveState(state);

  // Emit warnings (most severe first)
  if (repeats >= CRITICAL_THRESHOLD) {
    console.error(
      `[LOOP CRITICAL] Tool "${toolName}" called ${repeats}x identically. STOP and try a different approach.`
    );
  } else if (pingpong.count >= PINGPONG_CRITICAL) {
    console.error(
      `[PING-PONG CRITICAL] Alternating between 2 tool patterns ${pingpong.count}x with no progress. STOP — you're in a loop. Try a completely different approach.`
    );
  } else if (repeats >= REPEAT_THRESHOLD) {
    console.error(
      `[LOOP WARNING] Tool "${toolName}" called ${repeats}x with same params. Consider changing approach.`
    );
  } else if (pingpong.count >= PINGPONG_THRESHOLD) {
    console.error(
      `[PING-PONG WARNING] Alternating between 2 tool patterns ${pingpong.count}x. This looks like a stuck loop — consider a different strategy.`
    );
  }
} catch {
  // Hook must never block — fail silently
  process.exit(0);
}
