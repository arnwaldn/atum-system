#!/usr/bin/env node
/**
 * Graph Queue Loader — SessionStart Hook
 *
 * At session start, checks ~/.claude/graph-queue/ for pending entries
 * from previous sessions. If found, injects them into context with
 * instructions for Claude to persist them via mcp__memory__* tools.
 *
 * Also reminds Claude to query the knowledge graph for relevant context.
 *
 * Hook type: SessionStart
 * Exit code: always 0 (never blocks)
 */

const fs = require("fs");
const path = require("path");
const os = require("os");

const HOME = os.homedir();
const QUEUE_DIR = path.join(HOME, ".claude", "graph-queue");

function getProjectName() {
  const projectDir = process.env.CLAUDE_PROJECT_DIR || process.env.PWD || process.cwd();
  return path.basename(projectDir.replace(/\\/g, "/"));
}

try {
  if (!fs.existsSync(QUEUE_DIR)) {
    process.exit(0);
  }

  const files = fs.readdirSync(QUEUE_DIR)
    .filter(f => f.endsWith(".json"))
    .sort()
    .reverse(); // newest first

  if (files.length === 0) {
    process.exit(0);
  }

  // Load unprocessed entries (max 5 to avoid context bloat)
  const pending = [];
  for (const file of files.slice(0, 5)) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(QUEUE_DIR, file), "utf8"));
      if (!data.processed) {
        pending.push({ file, data });
      }
    } catch {
      // skip malformed files
    }
  }

  if (pending.length === 0) {
    process.exit(0);
  }

  // Build context summary
  const projectName = getProjectName();
  const summaries = pending.map(({ data }) => {
    const entityNames = data.entities.map(e => e.name).join(", ");
    return `- Session ${data.timestamp.slice(0, 16)}: ${data.project} — ${data.entities.length} entities (${entityNames})`;
  }).join("\n");

  // Mark entries as processed
  for (const { file } of pending) {
    try {
      const filePath = path.join(QUEUE_DIR, file);
      const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
      data.processed = true;
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch {
      // best-effort
    }
  }

  // Collect all entities and relations for Claude to persist
  const allEntities = [];
  const allRelations = [];
  for (const { data } of pending) {
    allEntities.push(...data.entities);
    allRelations.push(...data.relations);
  }

  // Build the context message
  const context = [
    `[Knowledge Graph] ${pending.length} session(s) en attente de persistance:`,
    summaries,
    "",
    `Entities a persister (${allEntities.length}):`,
    JSON.stringify(allEntities.slice(0, 20), null, 2),
    "",
    allRelations.length > 0 ? `Relations (${allRelations.length}):` : "",
    allRelations.length > 0 ? JSON.stringify(allRelations.slice(0, 20), null, 2) : "",
    "",
    `Utilise mcp__memory__create_entities et mcp__memory__create_relations pour persister ces donnees.`,
    `Puis recherche mcp__memory__search_nodes("${projectName}") pour le contexte pertinent.`
  ].filter(Boolean).join("\n");

  const output = {
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext: context
    }
  };

  console.log(JSON.stringify(output));
} catch {
  // Hook must never block
  process.exit(0);
}
