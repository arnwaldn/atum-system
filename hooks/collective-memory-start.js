#!/usr/bin/env node
/**
 * Collective Memory — SessionStart Hook
 *
 * At every session start:
 *   1. Git pull to sync latest memories from all collaborators
 *   2. Search local files for relevant context (recency, project, decisions)
 *   3. Inject into additionalContext for Claude
 *   4. Remind Claude to proactively save important insights
 *
 * Replaces: hindsight-healthcheck.js
 * Exit code: always 0 (never blocks Claude)
 */

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const HOME = process.env.HOME || process.env.USERPROFILE || "";
const ATUM_USER = process.env.ATUM_USER || "arnaud";
const MEMORY_DIR = path.join(HOME, ".claude", "collective-memory");
const SESSIONS_DIR = path.join(MEMORY_DIR, "sessions");
const EXPLICIT_DIR = path.join(MEMORY_DIR, "explicit");

function gitPull() {
  try {
    execFileSync("git", ["pull", "--rebase", "--autostash"], {
      cwd: MEMORY_DIR,
      timeout: 10000,
      encoding: "utf8",
      windowsHide: true,
      stdio: "pipe",
    });
    return true;
  } catch {
    return false;
  }
}

function shortenPath(p) {
  const home = HOME.replace(/\\/g, "/");
  return (p || "")
    .replace(/\\/g, "/")
    .replace(new RegExp("^" + home.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), "~");
}

function readFirstLines(filePath, maxLines) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    return content.split("\n").slice(0, maxLines || 5).join("\n");
  } catch {
    return "";
  }
}

function listMemoryFiles(dir) {
  const results = [];
  try {
    const users = fs.readdirSync(dir).filter(function(d) {
      return fs.statSync(path.join(dir, d)).isDirectory() && d !== ".git";
    });
    for (const user of users) {
      const userDir = path.join(dir, user);
      try {
        const files = fs.readdirSync(userDir).filter(function(f) { return f.endsWith(".md"); });
        for (const file of files) {
          const filePath = path.join(userDir, file);
          const stat = fs.statSync(filePath);
          results.push({ path: filePath, user: user, file: file, mtime: stat.mtimeMs });
        }
      } catch { /* skip */ }
    }
  } catch { /* skip */ }
  return results.sort(function(a, b) { return b.mtime - a.mtime; });
}

function getRecentTeamActivity(hoursBack) {
  const cutoff = Date.now() - hoursBack * 3600 * 1000;
  const files = listMemoryFiles(SESSIONS_DIR);
  return files
    .filter(function(f) { return f.mtime > cutoff && f.user !== ATUM_USER; })
    .slice(0, 5)
    .map(function(f) {
      const header = readFirstLines(f.path, 3);
      const summary = header.replace(/^#+\s*/gm, "").replace(/\n/g, " ").slice(0, 150);
      return f.user + ": " + summary;
    });
}

function getProjectMemories(projectDir) {
  if (!projectDir) return [];
  const projectName = projectDir.replace(/\\/g, "/").split("/").pop().toLowerCase();
  if (!projectName) return [];

  const allFiles = [].concat(listMemoryFiles(SESSIONS_DIR), listMemoryFiles(EXPLICIT_DIR));
  const matches = [];

  for (const f of allFiles) {
    try {
      const content = fs.readFileSync(f.path, "utf8").toLowerCase();
      if (content.includes(projectName)) {
        const header = readFirstLines(f.path, 3);
        const summary = header.replace(/^#+\s*/gm, "").replace(/\n/g, " ").slice(0, 150);
        matches.push(summary);
      }
    } catch { /* skip */ }
    if (matches.length >= 3) break;
  }
  return matches;
}

function getStrategicDecisions() {
  const files = listMemoryFiles(EXPLICIT_DIR);
  const decisions = [];
  const keywords = /\b(decision|strateg|tarif|business|client|pipeline|convention|choix)\b/i;

  for (const f of files) {
    try {
      const content = fs.readFileSync(f.path, "utf8");
      if (keywords.test(content)) {
        const header = readFirstLines(f.path, 4);
        const summary = header.replace(/^#+\s*/gm, "").replace(/\n/g, " ").slice(0, 150);
        decisions.push(summary);
      }
    } catch { /* skip */ }
    if (decisions.length >= 4) break;
  }

  // Also check session files for detected decisions
  const sessions = listMemoryFiles(SESSIONS_DIR).slice(0, 20);
  for (const f of sessions) {
    if (decisions.length >= 6) break;
    try {
      const content = fs.readFileSync(f.path, "utf8");
      const decisionSection = content.match(/## Decisions\n([\s\S]*?)(?:\n##|\n$|$)/);
      if (decisionSection) {
        const items = decisionSection[1].trim().split("\n").filter(function(l) { return l.startsWith("- "); });
        for (const item of items) {
          decisions.push(f.user + ": " + item.slice(2).slice(0, 100));
          if (decisions.length >= 6) break;
        }
      }
    } catch { /* skip */ }
  }
  return decisions;
}

function countMemories() {
  const sessions = listMemoryFiles(SESSIONS_DIR).length;
  const explicit = listMemoryFiles(EXPLICIT_DIR).length;
  return { sessions: sessions, explicit: explicit, total: sessions + explicit };
}

function main() {
  if (!fs.existsSync(MEMORY_DIR) || !fs.existsSync(path.join(MEMORY_DIR, ".git"))) {
    // Not configured — skip silently
    process.exit(0);
  }

  const synced = gitPull();
  const counts = countMemories();
  const projectDir = process.env.CLAUDE_PROJECT_DIR || "";

  const parts = [];

  if (synced) {
    parts.push("[Memoire collective] Synced — " + counts.total + " memoires (" + counts.sessions + " sessions, " + counts.explicit + " explicites)");
  } else {
    parts.push("[Memoire collective] Offline (git pull echoue) — " + counts.total + " memoires locales");
  }

  // Recent team activity (48h)
  const team = getRecentTeamActivity(48);
  if (team.length > 0) {
    parts.push("Equipe (48h): " + team.join(" | "));
  }

  // Project-specific memories
  if (projectDir) {
    const project = getProjectMemories(projectDir);
    if (project.length > 0) {
      parts.push("Memoires projet (" + shortenPath(projectDir) + "): " + project.join(" | "));
    }
  }

  // Strategic decisions
  const decisions = getStrategicDecisions();
  if (decisions.length > 0) {
    parts.push("Decisions/strategie: " + decisions.slice(0, 3).join(" | "));
  }

  // Reminder for Claude to proactively save
  parts.push("Rappel: sauvegarde les insights importants dans ~/.claude/collective-memory/explicit/" + ATUM_USER + "/");

  const output = {
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext: parts.join(". "),
    },
  };

  console.log(JSON.stringify(output));
}

main();
process.exit(0);
