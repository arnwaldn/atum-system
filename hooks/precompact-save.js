#!/usr/bin/env node
/**
 * PreCompact Hook
 * Saves critical session state BEFORE context compaction occurs.
 * Returns the brief as additionalContext so it survives the compaction.
 *
 * Source: Anthropic docs + mvara-ai/precompact-hook pattern
 */

const fs = require("fs");
const path = require("path");

const TEMP = process.env.TEMP || "/tmp";
const STATS_FILE = path.join(TEMP, "claude-session-stats.json");
const BRIEF_FILE = path.join(TEMP, "claude-precompact-brief.md");

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

try {
  // === Reset image counter on compact ===
  // When compact happens, all images are cleared from context.
  // Reset the counter so image-guard doesn't block after the compact.
  const os = require('os');
  const SESSION_ID = process.env.CLAUDE_SESSION_ID || 'default';
  const counterDir = path.join(os.homedir(), '.claude', 'tmp');
  const counterFile = path.join(counterDir, `image-count-${SESSION_ID}.json`);
  try {
    if (fs.existsSync(counterFile)) {
      fs.writeFileSync(counterFile, JSON.stringify({ count: 0, lastCompact: 0 }));
    }
  } catch {
    // Best-effort reset
  }

  // === Auto-cleanup test screenshots ===
  // Images are gone from context after compact — delete the source files too.
  const cleanupFile = path.join(os.homedir(), '.claude', 'tmp', 'screenshot-cleanup.txt');
  let cleanedCount = 0;
  try {
    if (fs.existsSync(cleanupFile)) {
      const content = fs.readFileSync(cleanupFile, 'utf8');
      const filesToClean = [...new Set(content.split('\n').filter(Boolean))]; // deduplicate
      for (const f of filesToClean) {
        try {
          if (fs.existsSync(f)) { fs.unlinkSync(f); cleanedCount++; }
        } catch { /* skip locked files */ }
      }
      fs.writeFileSync(cleanupFile, ''); // Reset the list
    }
  } catch {
    // Best-effort cleanup
  }

  const stats = loadStats();

  const sections = [];
  sections.push("# Pre-Compaction Brief");
  sections.push(`**Timestamp**: ${new Date().toISOString()}`);

  if (stats) {
    // Files modified
    if (stats.filesModified && stats.filesModified.length > 0) {
      sections.push("");
      sections.push("## Files Modified");
      for (const f of stats.filesModified) {
        sections.push(`- ${shortenPath(f)}`);
      }
    }

    // Files read (top 15)
    if (stats.filesRead && stats.filesRead.length > 0) {
      sections.push("");
      sections.push("## Key Files Read");
      const shown = stats.filesRead.slice(0, 15);
      for (const f of shown) {
        sections.push(`- ${shortenPath(f)}`);
      }
      if (stats.filesRead.length > 15) {
        sections.push(`- ...and ${stats.filesRead.length - 15} more`);
      }
    }

    // Errors encountered
    if (stats.errorDetails && stats.errorDetails.length > 0) {
      sections.push("");
      sections.push("## Errors Encountered");
      for (const err of stats.errorDetails) {
        sections.push(`- **${err.tool}**: ${err.message}`);
      }
    }

    // Git commits made
    if (stats.commitMessages && stats.commitMessages.length > 0) {
      sections.push("");
      sections.push("## Commits Made");
      for (const msg of stats.commitMessages) {
        sections.push(`- ${msg}`);
      }
    }

    // Session stats
    sections.push("");
    sections.push("## Session Stats");
    sections.push(`- Total tool calls: ${stats.totalCalls || 0}`);
    sections.push(`- Errors: ${stats.errors || 0}`);

    if (stats.toolCounts) {
      const top5 = Object.entries(stats.toolCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => `${name}(${count})`)
        .join(", ");
      sections.push(`- Top tools: ${top5}`);
    }
  }

  const brief = sections.join("\n");

  // Save to file for reference
  fs.writeFileSync(BRIEF_FILE, brief);

  // Reset session stats (tool call counter) so context warnings reset after compact
  if (stats) {
    try {
      const resetStats = Object.assign({}, stats, {
        totalCalls: 0,
        contextWarned: false,
        errors: 0,
        errorDetails: [],
        startedAt: Date.now(),
      });
      fs.writeFileSync(STATS_FILE, JSON.stringify(resetStats));
    } catch {
      // Best-effort reset
    }
  }

  // Return as additionalContext so it survives compaction
  const output = {
    additionalContext: brief,
  };

  process.stdout.write(JSON.stringify(output));
} catch {
  // Hook must never block
  process.exit(0);
}
