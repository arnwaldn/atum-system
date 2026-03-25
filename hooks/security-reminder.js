#!/usr/bin/env node
/**
 * Security Reminder Hook (JS rewrite of security-reminder.py)
 * Checks for dangerous code patterns in file edits and warns.
 * Exit: 0=safe, 2=block (first occurrence per session)
 *
 * Rewritten from Python to eliminate ~150ms interpreter startup.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

// ─── Security patterns ───
const SECURITY_PATTERNS = [
  {
    ruleName: 'github_actions_workflow',
    pathCheck: (p) => p.includes('.github/workflows/') && (p.endsWith('.yml') || p.endsWith('.yaml')),
    reminder: 'Security: GitHub Actions workflow — avoid command injection. Never use untrusted input (${{ github.event.* }}) directly in run: commands. Use env: variables with proper quoting instead.',
  },
  {
    ruleName: 'child_process_exec',
    substrings: ['child_process.exec', 'exec(', 'execSync('],
    reminder: 'Security: child_process.exec() can lead to command injection. Prefer execFile() or execFileSync() which avoid shell interpretation.',
  },
  {
    ruleName: 'new_function_injection',
    substrings: ['new Function'],
    reminder: 'Security: new Function() with dynamic strings can lead to code injection. Consider alternative approaches.',
  },
  {
    ruleName: 'eval_injection',
    substrings: ['eval('],
    reminder: 'Security: eval() executes arbitrary code. Use JSON.parse() for data or alternative patterns.',
  },
  {
    ruleName: 'react_dangerously_set_html',
    substrings: ['dangerouslySetInnerHTML'],
    reminder: 'Security: dangerouslySetInnerHTML can lead to XSS. Ensure content is sanitized (DOMPurify).',
  },
  {
    ruleName: 'document_write_xss',
    substrings: ['document.write'],
    reminder: 'Security: document.write() can be exploited for XSS. Use DOM methods instead.',
  },
  {
    ruleName: 'innerHTML_xss',
    substrings: ['.innerHTML =', '.innerHTML='],
    reminder: 'Security: innerHTML with untrusted content leads to XSS. Use textContent or sanitize with DOMPurify.',
  },
  {
    ruleName: 'pickle_deserialization',
    substrings: ['pickle'],
    reminder: 'Security: pickle with untrusted content can execute arbitrary code. Use JSON or safe formats.',
  },
  {
    ruleName: 'os_system_injection',
    substrings: ['os.system', 'from os import system'],
    reminder: 'Security: os.system() should only be used with static arguments, never user-controlled input.',
  },
];

function getStateFile(sessionId) {
  return path.join(os.homedir(), '.claude', `security_warnings_state_${sessionId}.json`);
}

function loadState(sessionId) {
  try {
    const data = fs.readFileSync(getStateFile(sessionId), 'utf8');
    return new Set(JSON.parse(data));
  } catch { return new Set(); }
}

function saveState(sessionId, shownWarnings) {
  try {
    const dir = path.join(os.homedir(), '.claude');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(getStateFile(sessionId), JSON.stringify([...shownWarnings]));
  } catch { /* non-critical */ }
}

// Probabilistic cleanup of old state files (10% chance per run)
function maybeCleanup() {
  if (Math.random() > 0.1) return;
  try {
    const dir = path.join(os.homedir(), '.claude');
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    for (const f of fs.readdirSync(dir)) {
      if (f.startsWith('security_warnings_state_') && f.endsWith('.json')) {
        const fp = path.join(dir, f);
        if (fs.statSync(fp).mtimeMs < thirtyDaysAgo) fs.unlinkSync(fp);
      }
    }
  } catch { /* ignore */ }
}

function checkPatterns(filePath, content) {
  const normalized = filePath.replace(/\\/g, '/');
  for (const pattern of SECURITY_PATTERNS) {
    if (pattern.pathCheck && pattern.pathCheck(normalized)) {
      return [pattern.ruleName, pattern.reminder];
    }
    if (pattern.substrings && content) {
      for (const sub of pattern.substrings) {
        if (content.includes(sub)) return [pattern.ruleName, pattern.reminder];
      }
    }
  }
  return [null, null];
}

// ─── Main ───
let data = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { data += chunk; });
process.stdin.on('end', () => {
  try {
    if (process.env.ENABLE_SECURITY_REMINDER === '0') process.exit(0);

    maybeCleanup();

    const input = JSON.parse(data);
    const sessionId = input.session_id || 'default';
    const toolName = input.tool_name || '';
    const toolInput = input.tool_input || {};

    if (!['Edit', 'Write', 'MultiEdit'].includes(toolName)) process.exit(0);

    const filePath = toolInput.file_path || '';
    if (!filePath) process.exit(0);

    // Extract content to check
    let content = '';
    if (toolName === 'Write') content = toolInput.content || '';
    else if (toolName === 'Edit') content = toolInput.new_string || '';
    else if (toolName === 'MultiEdit') {
      content = (toolInput.edits || []).map(e => e.new_string || '').join(' ');
    }

    const [ruleName, reminder] = checkPatterns(filePath, content);

    if (ruleName && reminder) {
      const warningKey = `${filePath}-${ruleName}`;
      const shown = loadState(sessionId);

      if (!shown.has(warningKey)) {
        shown.add(warningKey);
        saveState(sessionId, shown);
        process.stderr.write(reminder + '\n');
        process.exit(2);
      }
    }

    process.exit(0);
  } catch {
    process.exit(0);
  }
});
