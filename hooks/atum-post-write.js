#!/usr/bin/env node
/**
 * ATUM Audit — Post-Write hook (JS wrapper)
 *
 * Records file modification events to ATUM audit store.
 * Delegates to Python only when ATUM_PROJECT_DIR is set.
 *
 * Hook type: PostToolUse (Write/Edit). Exit: always 0.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

let data = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { data += chunk; });
process.stdin.on('end', () => {
  try {
    const libDir = process.env.ATUM_PROJECT_DIR || '';
    if (!libDir) process.exit(0);

    const pyScript = path.join(__dirname, 'atum-post-write.py');
    if (!fs.existsSync(pyScript)) process.exit(0);

    try {
      const result = execFileSync('python3', [pyScript], {
        input: data,
        encoding: 'utf8',
        timeout: 5000,
        env: { ...process.env, ATUM_PROJECT_DIR: libDir },
      });
      if (result.trim()) process.stdout.write(result);
    } catch { /* silent skip */ }
  } catch { /* never block */ }
  process.exit(0);
});
