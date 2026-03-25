#!/usr/bin/env node
/**
 * ATUM Audit — SessionStart hook (JS wrapper)
 *
 * Fast JS entry point that:
 *  1. Checks hook integrity (JS, ~1ms)
 *  2. Delegates to Python only if ATUM_PROJECT_DIR is set and atum_audit is available
 *
 * This avoids paying ~200ms Python startup when atum_audit isn't installed.
 * Hook type: SessionStart. Exit: always 0.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

function checkHookIntegrity() {
  const hooksDir = __dirname;
  const critical = ['file-guard.js', 'secret-scanner.js', 'git-guard.js',
                    'anti-rationalization.js', 'pre-completion-gate.js'];
  const missing = critical.filter(h => !fs.existsSync(path.join(hooksDir, h)));
  if (missing.length > 0) {
    process.stderr.write(`WARNING: Missing safety hooks: ${missing.join(', ')}\n`);
  }
}

// Drain stdin
let stdinData = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { stdinData += chunk; });
process.stdin.on('end', () => {
  try {
    checkHookIntegrity();

    const libDir = process.env.ATUM_PROJECT_DIR || '';
    if (!libDir) {
      // No ATUM project configured — skip Python call entirely
      process.exit(0);
    }

    // Delegate to Python script (only when atum_audit is available)
    const pyScript = path.join(__dirname, 'atum-session-start.py');
    if (!fs.existsSync(pyScript)) process.exit(0);

    try {
      const result = execFileSync('python3', [pyScript], {
        input: stdinData,
        encoding: 'utf8',
        timeout: 5000,
        env: { ...process.env, ATUM_PROJECT_DIR: libDir },
      });
      if (result.trim()) process.stdout.write(result);
    } catch {
      // Python not available or atum_audit not installed — silent skip
    }
  } catch {
    // Never block
  }
  process.exit(0);
});
