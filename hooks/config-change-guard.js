#!/usr/bin/env node
/**
 * config-change-guard.js
 * ConfigChange hook — warns when configuration files are modified
 * Fires on: user_settings, project_settings, local_settings, skills
 * ALWAYS exits 0 (notification only, never blocks)
 */

const fs = require('fs');

function main() {
  try {
    const raw = fs.readFileSync(0, 'utf8');
    if (!raw.trim()) {
      process.exit(0);
    }

    const data = JSON.parse(raw);
    const source = data.source || 'unknown';
    const filePath = data.file_path || '';

    process.stderr.write(`\u26a0 Config changed [${source}]: ${filePath}\n`);
  } catch {
    // Never fail — silently exit
  }

  process.exit(0);
}

main();
