#!/usr/bin/env node
/**
 * Session-to-Graph Hook (Stop)
 *
 * Extracts key session entities and queues them for Knowledge Graph persistence.
 * Since hooks can't call MCP tools directly, this writes to a local queue.
 * At next SessionStart, Claude processes the queue via mcp__memory__* tools.
 *
 * Queue directory: ~/.claude/graph-queue/
 * Format: {timestamp}-{sessionId}.json
 * Auto-cleanup: entries older than 7 days
 */

const fs = require("fs");
const path = require("path");
const os = require("os");

const HOME = os.homedir();
const QUEUE_DIR = path.join(HOME, ".claude", "graph-queue");
const TEMP = process.env.TEMP || os.tmpdir();
const STATS_FILE = path.join(TEMP, "claude-session-stats.json");
const MAX_AGE_DAYS = 7;

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

function shortenPath(p) {
  return p
    .replace(/\\/g, "/")
    .replace(new RegExp("^" + HOME.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\\/g, "/"), "i"), "~");
}

function cleanOldEntries() {
  try {
    const files = fs.readdirSync(QUEUE_DIR);
    const cutoff = Date.now() - MAX_AGE_DAYS * 86400000;
    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      const filePath = path.join(QUEUE_DIR, file);
      const stat = fs.statSync(filePath);
      if (stat.mtimeMs < cutoff) {
        fs.unlinkSync(filePath);
      }
    }
  } catch {
    // best-effort
  }
}

try {
  const input = JSON.parse(readStdin());
  const stats = loadStats();

  // Only process meaningful sessions (10+ tool calls)
  const totalCalls = stats ? stats.totalCalls : 0;
  if (totalCalls < 10) {
    process.exit(0);
  }

  fs.mkdirSync(QUEUE_DIR, { recursive: true });

  const projectDir = process.env.CLAUDE_PROJECT_DIR || "";
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = now.toISOString().slice(11, 16);
  const sessionId = stats && stats.startedAt
    ? stats.startedAt.toString(36).slice(-6)
    : Date.now().toString(36).slice(-6);

  // Build entities for the knowledge graph
  const entities = [];
  const relations = [];

  // Project entity
  const projectName = projectDir
    ? path.basename(projectDir.replace(/\\/g, "/"))
    : "global";

  entities.push({
    name: `project:${projectName}`,
    entityType: "project",
    observations: [`Session ${dateStr} ${timeStr} — ${totalCalls} tool calls, ${stats ? stats.errors : 0} errors`]
  });

  // Files modified as entities
  if (stats && stats.filesModified && stats.filesModified.length > 0) {
    for (const f of stats.filesModified.slice(0, 15)) {
      const shortPath = shortenPath(f);
      entities.push({
        name: `file:${shortPath}`,
        entityType: "file",
        observations: [`Modified on ${dateStr} in session ${sessionId}`]
      });
      relations.push({
        from: `project:${projectName}`,
        to: `file:${shortPath}`,
        relationType: "contains"
      });
    }
  }

  // Top tools used (insight into what kind of work was done)
  if (stats && stats.toolCounts) {
    const topTools = Object.entries(stats.toolCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => `${name}(${count})`)
      .join(", ");

    // Add observation to project entity
    entities[0].observations.push(`Tools used: ${topTools}`);
  }

  // Duration
  if (stats && stats.startedAt) {
    const durationMs = Date.now() - stats.startedAt;
    const mins = Math.round(durationMs / 60000);
    entities[0].observations.push(`Duration: ${mins}min`);
  }

  const queueEntry = {
    timestamp: now.toISOString(),
    sessionId,
    project: projectName,
    projectDir: projectDir ? shortenPath(projectDir) : null,
    entities,
    relations,
    processed: false
  };

  const fileName = `${dateStr}-${sessionId}.json`;
  fs.writeFileSync(path.join(QUEUE_DIR, fileName), JSON.stringify(queueEntry, null, 2));

  // Clean old entries
  cleanOldEntries();
} catch {
  // Hook must never block
  process.exit(0);
}
