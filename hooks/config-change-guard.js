#!/usr/bin/env node
/**
 * config-change-guard.js
 * PostToolUse hook — warns when config files are modified
 * Matcher: Write|Edit
 * ALWAYS exits 0 (notification only, never blocks)
 */

const fs = require('fs');
const path = require('path');

// Patterns to watch (normalized to forward slashes for cross-platform matching)
const CONFIG_PATTERNS = [
  'settings.json',
  'settings.local.json',
  '.claude.json',
  'CLAUDE.md',
  '.claude/rules/'
];

function normalizePath(p) {
  if (!p) return '';
  return p.replace(/\\/g, '/');
}

function isConfigFile(filePath) {
  const normalized = normalizePath(filePath);
  return CONFIG_PATTERNS.some(pattern => normalized.includes(pattern));
}

function main() {
  try {
    const raw = fs.readFileSync(0, 'utf8');
    if (!raw.trim()) {
      process.exit(0);
    }

    const data = JSON.parse(raw);
    const toolInput = data.tool_input || {};
    const filePath = toolInput.file_path || '';

    if (filePath && isConfigFile(filePath)) {
      process.stderr.write(`\u26a0 Config file modified: ${filePath}\n`);
    }
  } catch {
    // Never fail — silently exit
  }

  process.exit(0);
}

main();
