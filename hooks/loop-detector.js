#!/usr/bin/env node
/**
 * Loop Detector Hook (PostToolUse)
 * Detects repeated identical tool calls that indicate an agent stuck in a loop.
 * Inspired by openclaw's loop detection pattern.
 *
 * Config: historySize=10, repeatThreshold=3, criticalThreshold=5
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const HISTORY_SIZE = 10;
const REPEAT_THRESHOLD = 3;
const CRITICAL_THRESHOLD = 5;
const STATE_FILE = path.join(
  process.env.TEMP || "/tmp",
  "claude-loop-detector.json"
);

function readStdin() {
  try {
    return fs.readFileSync(0, "utf8");
  } catch {
    return "{}";
  }
}

function loadState() {
  try {
    const data = fs.readFileSync(STATE_FILE, "utf8");
    const state = JSON.parse(data);
    // Reset if state is older than 10 minutes (stale session)
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

function hashCall(toolName, params) {
  const key = JSON.stringify({ tool: toolName, params }).slice(0, 500);
  return crypto.createHash("md5").update(key).digest("hex").slice(0, 12);
}

function countConsecutiveRepeats(history, currentHash) {
  let count = 1; // current call counts as 1
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i] === currentHash) {
      count++;
    } else {
      break;
    }
  }
  return count;
}

try {
  const input = JSON.parse(readStdin());
  const toolName = input.tool_name || "";
  const toolInput = input.tool_input || {};

  // Skip non-actionable tools (Read, Grep, Glob are expected to repeat)
  const READ_ONLY_TOOLS = ["Read", "Grep", "Glob", "WebFetch", "WebSearch", "TaskList", "TaskGet"];
  if (READ_ONLY_TOOLS.includes(toolName)) {
    process.exit(0);
  }

  const callHash = hashCall(toolName, toolInput);
  const state = loadState();

  state.history.push(callHash);
  if (state.history.length > HISTORY_SIZE) {
    state.history = state.history.slice(-HISTORY_SIZE);
  }

  const repeats = countConsecutiveRepeats(state.history, callHash);
  saveState(state);

  if (repeats >= CRITICAL_THRESHOLD) {
    console.error(
      `[LOOP CRITICAL] Tool "${toolName}" called ${repeats}x identically. STOP and try a different approach.`
    );
  } else if (repeats >= REPEAT_THRESHOLD) {
    console.error(
      `[LOOP WARNING] Tool "${toolName}" called ${repeats}x with same params. Consider changing approach.`
    );
  }
} catch {
  // Hook must never block — fail silently
  process.exit(0);
}
