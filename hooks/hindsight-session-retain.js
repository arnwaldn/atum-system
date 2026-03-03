#!/usr/bin/env node
/**
 * Hindsight Session Retain Hook (Stop)
 * Sends structured session summaries to Hindsight shared memory.
 *
 * Routes to bank:
 *   - "atum"     → if session involved ATUM-related work
 *   - personal   → otherwise (uses ATUM_USER env var: arnaud/pablo/wahid)
 *
 * Env vars required:
 *   HINDSIGHT_URL     — base URL (e.g. https://memory.atum.tech)
 *   HINDSIGHT_API_KEY — Bearer auth token
 *   ATUM_USER         — co-founder name (arnaud/pablo/wahid)
 */

const fs = require("fs");
const path = require("path");

const HINDSIGHT_URL = (process.env.HINDSIGHT_URL || "").replace(/\/+$/, "");
const HINDSIGHT_API_KEY = process.env.HINDSIGHT_API_KEY || "";
const ATUM_USER = process.env.ATUM_USER || "arnaud";
const TEMP = process.env.TEMP || "/tmp";
const STATS_FILE = path.join(TEMP, "claude-session-stats.json");

// ATUM detection patterns (case-insensitive)
const ATUM_PATTERNS = [
  "atum-agency",
  "agence-atum",
  "atum_audit",
  "agent-owl",
  "atum sas",
  "gigroute",
  "tradingbrain",
  "quick-summarize",
];

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
  const home = (process.env.HOME || process.env.USERPROFILE || "").replace(/\\/g, "/");
  return p
    .replace(/\\/g, "/")
    .replace(new RegExp("^" + home.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), "~");
}

function formatDuration(ms) {
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins}min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h${m > 0 ? m + "min" : ""}`;
}

function topTools(toolCounts, limit) {
  return Object.entries(toolCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => `${name}(${count})`)
    .join(", ");
}

function isAtumRelated(projectDir, filesModified, filesRead) {
  const allPaths = [
    projectDir || "",
    ...(filesModified || []),
    ...(filesRead || []).slice(0, 20),
  ];
  const combined = allPaths.join(" ").toLowerCase().replace(/\\/g, "/");
  return ATUM_PATTERNS.some((p) => combined.includes(p));
}

function retainToHindsight(bankId, content, metadata, tags) {
  return new Promise((resolve) => {
    const url = new URL(`/v1/default/banks/${bankId}/memories`, HINDSIGHT_URL);
    const docId = `session-${metadata.session_id || "unknown"}-${metadata.date || ""}`;
    const ctx = metadata.project || "claude-code";
    const payload = JSON.stringify({
      items: [{ content, context: ctx, document_id: docId }],
    });
    const proto = url.protocol === "https:" ? require("https") : require("http");

    const req = proto.request(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${HINDSIGHT_API_KEY}`,
          "Content-Length": Buffer.byteLength(payload),
        },
        timeout: 15000,
      },
      (res) => {
        res.resume(); // drain response
        resolve(res.statusCode >= 200 && res.statusCode < 300);
      }
    );

    req.on("error", () => resolve(false));
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });

    req.write(payload);
    req.end();
  });
}

async function main() {
  // Skip if Hindsight not configured
  if (!HINDSIGHT_URL || !HINDSIGHT_API_KEY) {
    process.exit(0);
  }

  const input = JSON.parse(readStdin());
  const sessionId = process.env.CLAUDE_SESSION_ID || "unknown";
  const projectDir = process.env.CLAUDE_PROJECT_DIR || "";

  // Load accumulated stats from loop-detector
  const stats = loadStats();
  const totalCalls = stats ? stats.totalCalls : 0;

  // Only retain if meaningful work was done
  if (totalCalls < 5) {
    process.exit(0);
  }

  // Determine target bank
  const atumWork = isAtumRelated(
    projectDir,
    stats ? stats.filesModified : [],
    stats ? stats.filesRead : []
  );
  const bankId = atumWork ? "atum" : ATUM_USER;

  // Build structured summary
  const dateStr = new Date().toISOString().slice(0, 10);
  const timeStr = new Date().toISOString().slice(11, 16);
  const duration = stats && stats.startedAt ? formatDuration(Date.now() - stats.startedAt) : "?";
  const shortId = sessionId.slice(0, 8);

  const lines = [
    `Session de travail Claude Code — ${dateStr} ${timeStr}`,
    `Utilisateur: ${ATUM_USER} | Duree: ${duration} | Appels outils: ${totalCalls} | Erreurs: ${stats ? stats.errors : 0}`,
    `Projet: ${projectDir ? shortenPath(projectDir) : "global"}`,
    "",
  ];

  // Tool usage
  if (stats && stats.toolCounts) {
    lines.push(`Outils utilises: ${topTools(stats.toolCounts, 8)}`);
    lines.push("");
  }

  // Files modified (most important for memory)
  if (stats && stats.filesModified && stats.filesModified.length > 0) {
    lines.push("Fichiers modifies:");
    for (const f of stats.filesModified.slice(0, 15)) {
      lines.push(`- ${shortenPath(f)}`);
    }
    if (stats.filesModified.length > 15) {
      lines.push(`- ...et ${stats.filesModified.length - 15} autres`);
    }
    lines.push("");
  }

  // Files read (context for understanding the work)
  if (stats && stats.filesRead && stats.filesRead.length > 0) {
    lines.push(`Fichiers lus: ${stats.filesRead.length} fichiers`);
    const shown = stats.filesRead.slice(0, 5);
    for (const f of shown) {
      lines.push(`- ${shortenPath(f)}`);
    }
    lines.push("");
  }

  const content = lines.join("\n");

  const metadata = {
    source: "claude-code-session",
    session_id: shortId,
    user: ATUM_USER,
    project: projectDir ? shortenPath(projectDir) : "global",
    date: dateStr,
    tools_count: totalCalls,
    files_modified: stats ? (stats.filesModified || []).length : 0,
  };

  const tags = [
    "session",
    ATUM_USER,
    atumWork ? "atum" : "personnel",
    dateStr.slice(0, 7), // YYYY-MM for monthly filtering
  ];

  await retainToHindsight(bankId, content, metadata, tags);
}

main().catch(() => process.exit(0));
