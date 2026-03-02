#!/usr/bin/env node
/**
 * post-tool-failure-logger.js
 * PostToolUse hook — logs tool failures to $TEMP/claude-tool-failures.json
 * Matcher: Write|Edit|Bash
 * ALWAYS exits 0 (never blocks)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const LOG_FILE = path.join(os.tmpdir(), 'claude-tool-failures.json');

function main() {
  try {
    const raw = fs.readFileSync(0, 'utf8');
    if (!raw.trim()) {
      process.exit(0);
    }

    const data = JSON.parse(raw);
    const toolError = data.tool_error || '';

    // Only log if there's an actual error
    if (!toolError || toolError.trim() === '') {
      process.exit(0);
    }

    // Extract file_path from tool_input if available
    const toolInput = data.tool_input || {};
    const filePath = toolInput.file_path || toolInput.command || null;

    const entry = {
      timestamp: new Date().toISOString(),
      tool: data.tool_name || 'unknown',
      error: toolError,
      file_path: filePath,
      session_id: process.env.CLAUDE_SESSION_ID || process.env.SESSION_ID || null
    };

    // Read existing log or create new array
    let entries = [];
    if (fs.existsSync(LOG_FILE)) {
      try {
        const existing = fs.readFileSync(LOG_FILE, 'utf8');
        const parsed = JSON.parse(existing);
        if (Array.isArray(parsed)) {
          entries = parsed;
        }
      } catch {
        // Corrupted file — start fresh
        entries = [];
      }
    }

    // Rotation: keep last 400 entries when exceeding 500
    if (entries.length >= 500) {
      entries = entries.slice(-400);
    }
    entries.push(entry);
    fs.writeFileSync(LOG_FILE, JSON.stringify(entries, null, 2), 'utf8');

    // Log to stderr for visibility (never stdout to avoid interfering with hook protocol)
    process.stderr.write(`[failure-logger] Logged ${data.tool_name} error to ${LOG_FILE}\n`);
  } catch {
    // Never fail — silently exit
  }

  process.exit(0);
}

main();
