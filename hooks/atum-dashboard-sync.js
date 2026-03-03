#!/usr/bin/env node
/**
 * ATUM Dashboard Sync Hook (Stop)
 * Sends dev session events to the ATUM Dashboard API when a Claude Code session ends.
 *
 * Reads .atum.json from the project root to determine:
 *   - project_id: UUID of the project in the dashboard
 *   - dashboard_url: Base URL of the dashboard API
 *   - auto_sync: whether to sync (default true)
 *
 * Uses accumulated stats from loop-detector (claude-session-stats.json)
 * and git log to gather commit data.
 *
 * Requires env var: ATUM_DASHBOARD_KEY (API key for Bearer auth)
 * Fails silently — never blocks session exit.
 */

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const TEMP = process.env.TEMP || "/tmp";
const STATS_FILE = path.join(TEMP, "claude-session-stats.json");

function readStdin() {
  try {
    return fs.readFileSync(0, "utf8");
  } catch {
    return "{}";
  }
}

function loadStats() {
  try {
    return JSON.parse(fs.readFileSync(STATS_FILE, "utf8"));
  } catch {
    return null;
  }
}

function findAtumConfig() {
  // Look for .atum.json starting from CWD, walking up
  let dir = process.cwd();
  for (let i = 0; i < 10; i++) {
    const configPath = path.join(dir, ".atum.json");
    if (fs.existsSync(configPath)) {
      try {
        return JSON.parse(fs.readFileSync(configPath, "utf8"));
      } catch {
        return null;
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

function gitExec(args, cwd) {
  try {
    return execFileSync("git", args, { cwd, encoding: "utf8", timeout: 5000 }).trim();
  } catch {
    return "";
  }
}

function getRecentCommits(cwd, sinceMs) {
  const sinceDate = new Date(sinceMs).toISOString();
  const raw = gitExec(
    ["log", `--since=${sinceDate}`, "--format=%H|%s|%an|%ai", "--no-merges"],
    cwd
  );
  if (!raw) return [];

  return raw.split("\n").filter(Boolean).map((line) => {
    const parts = line.split("|");
    const hash = parts[0];
    const subject = parts[1];
    const author = parts[2];
    const date = parts.slice(3).join("|"); // date may contain |
    return { hash, subject, author, date };
  });
}

function getGitDiffStats(cwd, commitCount) {
  if (commitCount <= 0) return { files_changed: 0, insertions: 0, deletions: 0 };
  const raw = gitExec(
    ["diff", "--shortstat", `HEAD~${commitCount}..HEAD`],
    cwd
  );
  if (!raw) return { files_changed: 0, insertions: 0, deletions: 0 };

  const files = raw.match(/(\d+) file/);
  const ins = raw.match(/(\d+) insertion/);
  const del = raw.match(/(\d+) deletion/);
  return {
    files_changed: files ? parseInt(files[1]) : 0,
    insertions: ins ? parseInt(ins[1]) : 0,
    deletions: del ? parseInt(del[1]) : 0,
  };
}

async function main() {
  // Check for API key
  const apiKey = process.env.ATUM_DASHBOARD_KEY;
  if (!apiKey) return;

  // Check for .atum.json config
  const config = findAtumConfig();
  if (!config || !config.project_id || !config.dashboard_url) return;
  if (config.auto_sync === false) return;

  // Parse stdin (Stop event payload)
  const input = JSON.parse(readStdin());
  const stopReason = input.stop_reason || "user";

  // Load session stats
  const stats = loadStats();
  const totalCalls = stats ? stats.totalCalls : 0;

  // Skip trivial sessions (< 3 tool calls)
  if (totalCalls < 3) return;

  const sessionStart = stats ? stats.startedAt : Date.now();
  const durationMinutes = Math.round((Date.now() - sessionStart) / 60000);
  const sessionId = process.env.CLAUDE_SESSION_ID || `session-${Date.now()}`;
  const cwd = process.cwd();

  // Gather git data
  const commits = getRecentCommits(cwd, sessionStart);
  const diffStats = getGitDiffStats(cwd, commits.length);

  // Build events array
  const events = [];

  // Session start event
  events.push({
    event_type: "session_start",
    title: "Session dev demarree",
    session_id: sessionId,
    metadata: {
      cwd,
      stop_reason: stopReason,
    },
  });

  // Individual commit events
  for (const commit of commits) {
    events.push({
      event_type: "commit",
      title: commit.subject,
      session_id: sessionId,
      metadata: {
        hash: commit.hash,
        author: commit.author,
        date: commit.date,
      },
    });
  }

  // Session end event with summary
  events.push({
    event_type: "session_end",
    title: `Session dev terminee (${durationMinutes}min)`,
    session_id: sessionId,
    metadata: {
      duration_minutes: durationMinutes,
      commits_count: commits.length,
      files_touched: stats ? (stats.filesModified || []).length : 0,
      files_read: stats ? (stats.filesRead || []).length : 0,
      tool_calls: totalCalls,
      errors: stats ? stats.errors : 0,
      stop_reason: stopReason,
      git_stats: diffStats,
      files_modified: stats ? (stats.filesModified || []).slice(0, 20) : [],
    },
  });

  // Send to dashboard API
  const url = config.dashboard_url.replace(/\/$/, "") + "/api/sync";
  const payload = {
    project_id: config.project_id,
    events,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10000),
  });

  // Log result for debugging (optional)
  if (!response.ok) {
    const errText = await response.text();
    fs.writeFileSync(
      path.join(TEMP, "atum-sync-last-error.json"),
      JSON.stringify({ status: response.status, body: errText, timestamp: new Date().toISOString() })
    );
  }
}

main().catch(() => {
  // Hook must never block — fail silently
  process.exit(0);
});
