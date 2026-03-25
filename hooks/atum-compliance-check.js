#!/usr/bin/env node
/**
 * ATUM Audit — Post-Commit compliance hook (JS wrapper)
 *
 * Fast JS entry point: checks if this is a git commit, then delegates
 * to Python only when ATUM_PROJECT_DIR is set. Avoids ~200ms Python
 * startup on every non-commit Bash command.
 *
 * Hook type: PostToolUse (Bash). Exit: always 0.
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
    const input = JSON.parse(data);
    const command = (input.tool_input || {}).command || '';

    // Fast exit: only trigger on git commit commands
    if (!/git\s+commit/.test(command)) process.exit(0);

    const libDir = process.env.ATUM_PROJECT_DIR || '';
    if (!libDir) process.exit(0);

    // Delegate to Python for atum_audit integration
    const pyScript = path.join(__dirname, 'atum-compliance-check.py');
    if (!fs.existsSync(pyScript)) process.exit(0);

    try {
      const result = execFileSync('python3', [pyScript], {
        input: data,
        encoding: 'utf8',
        timeout: 10000,
        env: { ...process.env, ATUM_PROJECT_DIR: libDir },
      });
      if (result.trim()) process.stdout.write(result);
    } catch {
      // Python or atum_audit not available — silent skip
    }
  } catch {
    // Never block
  }
  process.exit(0);
});
