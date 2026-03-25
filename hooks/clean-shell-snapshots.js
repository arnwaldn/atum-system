#!/usr/bin/env node
/**
 * Clean Shell Snapshots Hook (JS rewrite of clean-shell-snapshots.py)
 * Prevents corrupted shell snapshots on Git Bash/MINGW64 (Windows).
 *
 * Hook types: PreToolUse (Bash), SessionStart
 * Exit code: always 0 (never blocks Claude)
 *
 * Rewritten from Python to eliminate ~150ms interpreter startup.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const SNAPSHOT_DIR = path.join(os.homedir(), '.claude', 'shell-snapshots');

function cleanExisting() {
  let deleted = 0;
  try {
    if (!fs.existsSync(SNAPSHOT_DIR)) return 0;
    for (const file of fs.readdirSync(SNAPSHOT_DIR)) {
      if (!file.endsWith('.sh')) continue;
      const fp = path.join(SNAPSHOT_DIR, file);
      try {
        fs.chmodSync(fp, 0o666);
        fs.unlinkSync(fp);
        deleted++;
      } catch { /* NTFS lock or permission issue — skip */ }
    }
  } catch { /* directory read error */ }
  return deleted;
}

function ensureNtfsLock() {
  // Only relevant on Windows
  if (process.platform !== 'win32') return 'not_windows';
  if (!fs.existsSync(SNAPSHOT_DIR)) return 'no_dir';

  const username = process.env.USERNAME || 'user';
  const winPath = SNAPSHOT_DIR.replace(/\//g, '\\');
  const testFile = path.join(SNAPSHOT_DIR, '_test_write_check');

  try {
    // Test if write is already blocked
    fs.writeFileSync(testFile, 'test');
    // Write succeeded — need to set ACL
    fs.unlinkSync(testFile);
    execFileSync('icacls', [winPath, '/deny', `${username}:(W,AD,WD)`], { timeout: 5000 });
    return 'locked';
  } catch (err) {
    if (err.code === 'EPERM' || err.code === 'EACCES') return 'already_locked';
    return 'error';
  }
}

// ─── Main ───
// Drain stdin (required by hook protocol)
process.stdin.resume();
process.stdin.on('end', () => {});
process.stdin.on('data', () => {});

try {
  if (!fs.existsSync(SNAPSHOT_DIR)) process.exit(0);

  const deleted = cleanExisting();
  const lockStatus = ensureNtfsLock();

  if (deleted > 0 || lockStatus === 'locked') {
    const parts = [];
    if (deleted > 0) parts.push(`cleaned ${deleted} snapshot(s)`);
    if (lockStatus === 'locked') parts.push('applied NTFS write lock');
    const output = {
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        additionalContext: `Shell snapshots: ${parts.join(', ')}`,
      },
    };
    process.stdout.write(JSON.stringify(output));
  }
} catch { /* never block */ }

// Give stdin a moment to drain, then exit
setTimeout(() => process.exit(0), 50);
