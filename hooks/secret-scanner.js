#!/usr/bin/env node
/**
 * Secret Scanner Hook (JS rewrite of secret-scanner.py)
 * Detects hardcoded secrets before git commits.
 * Exit: 0=safe, 2=block (secrets found)
 *
 * Rewritten from Python to eliminate ~200ms interpreter startup.
 * All 50+ patterns and logic preserved exactly.
 */
'use strict';

const fs = require('fs');
const { execFileSync } = require('child_process');
const path = require('path');

// ─── Secret detection patterns: [regex, description, severity] ───
const SECRET_PATTERNS = [
  // AWS
  [/AKIA[0-9A-Z]{16}/, 'AWS Access Key ID', 'high'],
  [/(?:aws)[_\-\s]*secret[_\-\s]*access[_\-\s]*key['"\\s]*[=:]['"\\s]*[A-Za-z0-9/+=]{40}/i, 'AWS Secret Access Key', 'high'],

  // Anthropic
  [/sk-ant-api\d{2}-[A-Za-z0-9\-_]{20,}/, 'Anthropic API Key', 'high'],

  // OpenAI
  [/sk-[a-zA-Z0-9]{48,}/, 'OpenAI API Key', 'high'],
  [/sk-proj-[a-zA-Z0-9\-_]{32,}/, 'OpenAI Project API Key', 'high'],

  // Google
  [/AIza[0-9A-Za-z\-_]{35}/, 'Google API Key', 'high'],
  [/ya29\.[0-9A-Za-z\-_]+/, 'Google OAuth Access Token', 'high'],

  // Stripe
  [/sk_live_[0-9a-zA-Z]{24,}/, 'Stripe Live Secret Key', 'critical'],
  [/sk_test_[0-9a-zA-Z]{24,}/, 'Stripe Test Secret Key', 'medium'],
  [/rk_live_[0-9a-zA-Z]{24,}/, 'Stripe Live Restricted Key', 'high'],
  [/pk_live_[0-9a-zA-Z]{24,}/, 'Stripe Live Publishable Key', 'medium'],

  // GitHub
  [/ghp_[0-9a-zA-Z]{36}/, 'GitHub Personal Access Token', 'high'],
  [/gho_[0-9a-zA-Z]{36}/, 'GitHub OAuth Token', 'high'],
  [/ghs_[0-9a-zA-Z]{36}/, 'GitHub App Secret', 'high'],
  [/ghr_[0-9a-zA-Z]{36}/, 'GitHub Refresh Token', 'high'],
  [/github_pat_[0-9a-zA-Z_]{22,}/, 'GitHub Fine-Grained PAT', 'high'],

  // GitLab
  [/glpat-[0-9a-zA-Z\-_]{20,}/, 'GitLab Personal Access Token', 'high'],

  // Vercel
  [/vercel_[0-9a-zA-Z_\-]{24,}/, 'Vercel Token', 'high'],

  // Supabase
  [/sbp_[0-9a-f]{40}/, 'Supabase Service Key', 'high'],
  [/sb_publishable_[A-Za-z0-9\-_]{20,}/, 'Supabase Publishable Key', 'medium'],
  [/sb_secret_[A-Za-z0-9\-_]{20,}/, 'Supabase Secret Key', 'high'],

  // Hugging Face
  [/hf_[a-zA-Z0-9]{34,}/, 'Hugging Face Token', 'high'],

  // Replicate
  [/r8_[a-zA-Z0-9]{38,}/, 'Replicate API Token', 'high'],

  // Groq
  [/gsk_[a-zA-Z0-9]{48,}/, 'Groq API Key', 'high'],

  // Databricks
  [/dapi[0-9a-f]{32}/, 'Databricks Access Token', 'high'],

  // Azure
  [/azure[_\-\s]*(?:key|secret|token)['"\\s]*[=:]['"\\s]*[A-Za-z0-9+/=]{32,}/i, 'Azure Key', 'high'],

  // Cloudflare
  [/(?:cf|cloudflare)[_\-]?[A-Za-z0-9_\-]{37,}/, 'Cloudflare API Token', 'medium'],

  // DigitalOcean
  [/dop_v1_[0-9a-f]{64}/, 'DigitalOcean Personal Access Token', 'high'],
  [/doo_v1_[0-9a-f]{64}/, 'DigitalOcean OAuth Token', 'high'],

  // Linear
  [/lin_api_[a-zA-Z0-9]{40,}/, 'Linear API Key', 'high'],

  // Notion
  [/ntn_[0-9a-zA-Z]{40,}/, 'Notion Integration Token', 'high'],
  [/secret_[0-9a-zA-Z]{43}/, 'Notion API Key (legacy)', 'high'],

  // Figma
  [/figd_[0-9a-zA-Z\-_]{40,}/, 'Figma Access Token', 'high'],

  // npm
  [/npm_[0-9a-zA-Z]{36,}/, 'npm Access Token', 'high'],

  // PyPI
  [/pypi-[A-Za-z0-9\-_]{16,}/, 'PyPI API Token', 'high'],

  // Generic
  [/(?:api[_\-\s]*key|apikey)['"\\s]*[=:]['"\\s]*['"][0-9a-zA-Z\-_]{20,}['"]/i, 'Generic API Key', 'medium'],
  [/(?:secret[_\-\s]*key|secretkey)['"\\s]*[=:]['"\\s]*['"][0-9a-zA-Z\-_]{20,}['"]/i, 'Generic Secret Key', 'medium'],
  [/(?:access[_\-\s]*token|accesstoken)['"\\s]*[=:]['"\\s]*['"][0-9a-zA-Z\-_]{20,}['"]/i, 'Generic Access Token', 'medium'],

  // Passwords
  [/password['"\\s]*[=:]['"\\s]*['"][^'"\\s]{8,}['"]/i, 'Hardcoded Password', 'high'],
  [/passwd['"\\s]*[=:]['"\\s]*['"][^'"\\s]{8,}['"]/i, 'Hardcoded Password', 'high'],

  // Private Keys
  [/-----BEGIN (?:RSA |DSA |EC )?PRIVATE KEY-----/, 'Private Key', 'critical'],
  [/-----BEGIN OPENSSH PRIVATE KEY-----/, 'OpenSSH Private Key', 'critical'],

  // Database Connection Strings
  [/(?:mysql|postgresql|postgres|mongodb):\/\/[^\s'")]+:[^\s'")]+@/i, 'Database Connection String', 'high'],
  [/Server=[^;]+;Database=[^;]+;User Id=[^;]+;Password=[^;]+/i, 'SQL Server Connection String', 'high'],

  // JWT
  [/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/, 'JWT Token', 'medium'],

  // Slack
  [/xox[baprs]-[0-9a-zA-Z\-]{10,}/, 'Slack Token', 'high'],

  // Telegram
  [/[0-9]{8,10}:[A-Za-z0-9_\-]{35}/, 'Telegram Bot Token', 'medium'],

  // Discord
  [/https:\/\/discord\.com\/api\/webhooks\/[0-9]+\/[A-Za-z0-9_\-]+/, 'Discord Webhook URL', 'medium'],

  // Twilio
  [/SK[0-9a-fA-F]{32}/, 'Twilio API Key', 'high'],

  // SendGrid
  [/SG\.[A-Za-z0-9_\-]{22}\.[A-Za-z0-9_\-]{43}/, 'SendGrid API Key', 'high'],

  // Mailgun
  [/key-[0-9a-zA-Z]{32}/, 'Mailgun API Key', 'medium'],

  // UUID-format potential keys
  [/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/, 'Potential API Key (UUID format)', 'low'],
];

const EXCLUDED_FILES = new Set([
  '.env.example', '.env.sample', '.env.template',
  'package-lock.json', 'yarn.lock', 'poetry.lock',
  'Pipfile.lock', 'Cargo.lock', 'go.sum', '.gitignore',
]);

const EXCLUDED_DIRS = [
  'node_modules/', 'vendor/', '.git/', 'dist/', 'build/',
  '__pycache__/', '.pytest_cache/', 'venv/', 'env/',
];

function shouldSkipFile(filePath) {
  if (!fs.existsSync(filePath)) return true;
  if (EXCLUDED_FILES.has(path.basename(filePath))) return true;
  for (const dir of EXCLUDED_DIRS) {
    if (filePath.includes(dir)) return true;
  }
  // Skip binary files
  try {
    const buf = Buffer.alloc(1024);
    const fd = fs.openSync(filePath, 'r');
    const bytesRead = fs.readSync(fd, buf, 0, 1024, 0);
    fs.closeSync(fd);
    for (let i = 0; i < bytesRead; i++) {
      if (buf[i] === 0) return true;
    }
  } catch { return true; }
  return false;
}

function getStagedFiles(command) {
  let files = [];

  // Try git diff --cached first
  try {
    const result = execFileSync('git', ['diff', '--cached', '--name-only', '--diff-filter=ACM'], { encoding: 'utf8', timeout: 5000 });
    files = result.split('\n').map(f => f.trim()).filter(Boolean);
  } catch { /* not in git repo or no staged files */ }

  if (files.length > 0) return files;

  // Handle git commit -a (auto-stage)
  const commitMatch = command.match(/git\s+commit\s+(.+)/);
  if (commitMatch && /-\w*a/.test(commitMatch[1])) {
    try {
      const result = execFileSync('git', ['diff', '--name-only'], { encoding: 'utf8', timeout: 5000 });
      files = result.split('\n').map(f => f.trim()).filter(f => f && fs.existsSync(f));
    } catch { /* ignore */ }
  }

  // Handle chained git add ... && git commit
  for (const part of command.split(/&&|;/)) {
    const addMatch = part.trim().match(/git\s+add\s+(.+)/);
    if (!addMatch) continue;
    const args = addMatch[1].trim();
    if (args === '.' || args === '-A' || args === '--all') {
      try {
        const result = execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8', timeout: 5000 });
        for (const line of result.split('\n')) {
          if (line && line.length > 3) {
            const f = line.slice(3).trim();
            if (fs.existsSync(f)) files.push(f);
          }
        }
      } catch { /* ignore */ }
    } else {
      for (const token of args.split(/\s+/)) {
        if (!token.startsWith('-') && fs.existsSync(token)) files.push(token);
      }
    }
  }

  return files;
}

function scanFile(filePath) {
  if (shouldSkipFile(filePath)) return [];

  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch { return []; }

  const findings = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineStripped = line.trim();

    for (const [regex, description, severity] of SECRET_PATTERNS) {
      if (!regex.test(line)) continue;

      // Skip comments with example/placeholder
      if ((lineStripped.startsWith('#') || lineStripped.startsWith('//')) &&
          (/example|placeholder/i.test(lineStripped))) {
        continue;
      }

      const match = line.match(regex);
      const matchStr = match ? match[0] : '';
      findings.push({
        file: filePath,
        line: i + 1,
        description,
        severity,
        match: matchStr.length > 50 ? matchStr.slice(0, 50) + '...' : matchStr,
        full_line: lineStripped.slice(0, 100),
      });
    }
  }

  return findings;
}

function printFindings(findings) {
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  findings.sort((a, b) => (severityOrder[a.severity] || 4) - (severityOrder[b.severity] || 4));

  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const f of findings) counts[f.severity] = (counts[f.severity] || 0) + 1;

  const emoji = { critical: '[CRIT]', high: '[HIGH]', medium: '[MED]', low: '[LOW]' };

  process.stderr.write(`\nSECRET SCANNER: ${findings.length} potential secret(s) detected!\n\n`);
  if (counts.critical) process.stderr.write(`  Critical: ${counts.critical}\n`);
  if (counts.high) process.stderr.write(`  High: ${counts.high}\n`);
  if (counts.medium) process.stderr.write(`  Medium: ${counts.medium}\n`);
  if (counts.low) process.stderr.write(`  Low: ${counts.low}\n`);
  process.stderr.write('\n');

  for (const f of findings) {
    process.stderr.write(`${emoji[f.severity] || '[???]'} ${f.description}\n`);
    process.stderr.write(`   File: ${f.file}:${f.line}\n`);
    process.stderr.write(`   Match: ${f.match}\n\n`);
  }

  process.stderr.write('COMMIT BLOCKED: Remove secrets before committing.\n');
  process.stderr.write('Fix: move secrets to .env (in .gitignore) or use a secrets manager.\n\n');
}

// ─── Main ───
let data = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { data += chunk; });
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);
    const toolInput = input.tool_input || input.params || {};
    const command = toolInput.command || '';

    // Only act on git commit commands
    if (!/git\s+commit/.test(command)) {
      process.exit(0);
    }

    const stagedFiles = getStagedFiles(command);
    if (stagedFiles.length === 0) {
      process.exit(0);
    }

    const allFindings = [];
    for (const filePath of stagedFiles) {
      allFindings.push(...scanFile(filePath));
    }

    if (allFindings.length > 0) {
      printFindings(allFindings);
      process.exit(2);
    }

    process.exit(0);
  } catch {
    // Hook must never block on internal error
    process.exit(0);
  }
});
