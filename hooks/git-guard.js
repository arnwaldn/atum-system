#!/usr/bin/env node
/**
 * Unified Bash Guard Hook (JS rewrite of git-guard.py)
 * Replaces 4 separate hooks:
 *   - dangerous-command-blocker
 *   - conventional-commits-enforcer
 *   - prevent-direct-push
 *   - validate-branch-name
 *
 * Exit: 0 always (uses JSON decision on stdout)
 * Output: {"decision": "approve"|"block", "reason": "..."}
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

function readStdin() {
  try { return fs.readFileSync(0, 'utf8'); } catch { return '{}'; }
}

function respond(decision, reason) {
  process.stdout.write(JSON.stringify({ decision, reason }));
  process.exit(0);
}

// ─── 1. DANGEROUS COMMAND BLOCKER ───
const DANGEROUS_PATTERNS = [
  [/rm\s+(-[a-zA-Z]+\s+)*\/(\s|$|\*)/i, 'rm on root directory'],
  [/rm\s+-[a-zA-Z]*rf\b/i, 'recursive force delete'],
  [/mkfs\./i, 'filesystem format'],
  [/dd\s+.*of=\/dev\//i, 'raw disk write'],
  [/:\(\)\s*\{\s*:\|:\s*&\s*\}\s*;:/i, 'fork bomb'],
  [/>\s*\/dev\/sd[a-z]/i, 'raw device write'],
  [/chmod\s+-R\s+777\s+\//i, 'recursive 777 on root'],
  [/DROP\s+DATABASE/i, 'drop database'],
  [/DROP\s+TABLE/i, 'drop table'],
  [/TRUNCATE\s+TABLE/i, 'truncate table'],
  [/DELETE\s+FROM\s+\w+\s*;?\s*$/i, 'delete all rows (no WHERE)'],
];

// ─── 2. CONVENTIONAL COMMITS ───
const VALID_COMMIT_TYPES = ['feat', 'fix', 'refactor', 'docs', 'test', 'chore', 'perf', 'ci', 'style', 'build', 'revert'];
const COMMIT_PATTERN = new RegExp(`^(${VALID_COMMIT_TYPES.join('|')})(\\(.+\\))?!?:\\s+.+`);

// ─── 3. PUSH PROTECTION ───
const PROTECTED_BRANCHES = ['main', 'master', 'production', 'release'];
const BACKUP_REPOS = [
  'claude-code-config', 'project-templates', 'webmcp-optimized',
  'atum-memory', 'gigroute-mobile', 'live-tour-manager',
];

// ─── 4. BRANCH NAMING ───
const VALID_BRANCH_PREFIXES = [
  /^(feature|feat)\/.+/,
  /^(fix|bugfix|hotfix)\/.+/,
  /^release\/v?\d+\.\d+/,
  /^(chore|docs|test|ci|refactor|perf|style|build)\/.+/,
  /^(main|master|develop|dev|staging)$/,
];

// ─── Main ───
try {
  const inputData = JSON.parse(readStdin());

  if (inputData.tool_name !== 'Bash') {
    respond('approve', 'Not a Bash command');
  }

  const command = (inputData.tool_input || {}).command || '';

  // 1. Dangerous command check
  for (const [pattern, desc] of DANGEROUS_PATTERNS) {
    if (pattern.test(command)) {
      respond('block', `BLOCKED: Dangerous command detected — ${desc}\nCommand: ${command.slice(0, 100)}`);
    }
  }

  // 2. Conventional commits enforcer
  if (/git\s+commit\b/.test(command) && !command.trim().startsWith('#')) {
    let msg = null;

    const msgMatch = command.match(/-m\s+["'](.+?)["']/);
    if (msgMatch) {
      msg = msgMatch[1].trim();
    } else {
      const heredocMatch = command.match(/<<.*?EOF.*?\n(.+?)\n/s);
      if (heredocMatch) {
        msg = heredocMatch[1].trim().split('\n')[0];
      }
    }

    if (msg && !COMMIT_PATTERN.test(msg)) {
      respond('block',
        `Commit message does not follow conventional format.\n` +
        `Expected: <type>: <description>\n` +
        `Types: ${VALID_COMMIT_TYPES.join(', ')}\n` +
        `Got: ${msg.slice(0, 80)}`
      );
    }
  }

  // 3. Push protection
  if (/git\s+push\b/.test(command)) {
    const isForce = /--force\b|-f\b/.test(command);

    let targetBranch = null;
    for (const branch of PROTECTED_BRANCHES) {
      if (new RegExp(`\\b${branch}\\b`).test(command)) {
        targetBranch = branch;
        break;
      }
    }

    // Check if backup repo
    let isBackupRepo = BACKUP_REPOS.some(repo => command.includes(repo));
    if (!isBackupRepo) {
      try {
        const cdMatch = command.match(/cd\s+([^\s&;]+)/);
        const args = cdMatch
          ? ['git', '-C', cdMatch[1].replace(/^~/, process.env.HOME || process.env.USERPROFILE || ''), 'remote', 'get-url', 'origin']
          : ['git', 'remote', 'get-url', 'origin'];
        const remoteUrl = execFileSync(args[0], args.slice(1), { encoding: 'utf8', timeout: 5000 }).trim();
        isBackupRepo = BACKUP_REPOS.some(repo => remoteUrl.includes(repo));
      } catch { /* not in a git repo */ }
    }

    if (isForce && targetBranch) {
      respond('block', `BLOCKED: Force push to protected branch '${targetBranch}' is not allowed.\nUse a feature branch and create a PR instead.`);
    } else if (isForce) {
      respond('block', 'BLOCKED: Force push detected. Use --force-with-lease instead.');
    } else if (targetBranch && !isBackupRepo) {
      respond('block', `WARNING: Direct push to '${targetBranch}' detected.\nConsider using a feature branch and creating a PR.`);
    }
  }

  // 4. Branch name validation
  const branchCreate = command.match(/git\s+(?:checkout\s+-b|switch\s+-c|branch)\s+(?!-|\s)(\S+)/);
  if (branchCreate) {
    const branchName = branchCreate[1];
    if (!VALID_BRANCH_PREFIXES.some(p => p.test(branchName))) {
      respond('block',
        `Branch name '${branchName}' does not follow naming convention.\n` +
        `Expected: feature/*, fix/*, hotfix/*, release/v*.*.*, chore/*, docs/*, test/*, ci/*\n` +
        `Example: feature/user-auth, fix/login-bug, release/v1.2.0`
      );
    }
  }

  // All clear
  respond('approve', 'Command approved');
} catch {
  respond('approve', 'Could not parse hook input');
}
