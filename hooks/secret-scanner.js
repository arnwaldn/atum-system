#!/usr/bin/env node
/**
 * Secret Scanner Hook — Detects 40+ hardcoded secret patterns before git commits.
 * Node.js rewrite of secret-scanner.py for faster startup (~50ms vs ~200ms).
 * Exit: 0=clean, 2=secrets found (block commit)
 */

const fs = require("fs");
const { execFileSync } = require("child_process");

const SECRET_PATTERNS = [
  [/AKIA[0-9A-Z]{16}/, "AWS Access Key ID", "high"],
  [/aws[\s_-]*secret[\s_-]*access[\s_-]*key['":\s]*=['":\s]*[A-Za-z0-9/+=]{40}/i, "AWS Secret Access Key", "high"],
  [/sk-ant-api\d{2}-[A-Za-z0-9\-_]{20,}/, "Anthropic API Key", "high"],
  [/sk-[a-zA-Z0-9]{48,}/, "OpenAI API Key", "high"],
  [/sk-proj-[a-zA-Z0-9\-_]{32,}/, "OpenAI Project API Key", "high"],
  [/AIza[0-9A-Za-z\-_]{35}/, "Google API Key", "high"],
  [/ya29\.[0-9A-Za-z\-_]+/, "Google OAuth Token", "high"],
  [/sk_live_[0-9a-zA-Z]{24,}/, "Stripe Live Secret Key", "critical"],
  [/sk_test_[0-9a-zA-Z]{24,}/, "Stripe Test Secret Key", "medium"],
  [/rk_live_[0-9a-zA-Z]{24,}/, "Stripe Live Restricted Key", "high"],
  [/ghp_[0-9a-zA-Z]{36}/, "GitHub PAT", "high"],
  [/gho_[0-9a-zA-Z]{36}/, "GitHub OAuth Token", "high"],
  [/ghs_[0-9a-zA-Z]{36}/, "GitHub App Secret", "high"],
  [/ghr_[0-9a-zA-Z]{36}/, "GitHub Refresh Token", "high"],
  [/github_pat_[0-9a-zA-Z_]{22,}/, "GitHub Fine-Grained PAT", "high"],
  [/glpat-[0-9a-zA-Z\-_]{20,}/, "GitLab PAT", "high"],
  [/vercel_[0-9a-zA-Z_\-]{24,}/, "Vercel Token", "high"],
  [/sbp_[0-9a-f]{40}/, "Supabase Service Key", "high"],
  [/hf_[a-zA-Z0-9]{34,}/, "Hugging Face Token", "high"],
  [/r8_[a-zA-Z0-9]{38,}/, "Replicate API Token", "high"],
  [/gsk_[a-zA-Z0-9]{48,}/, "Groq API Key", "high"],
  [/dapi[0-9a-f]{32}/, "Databricks Token", "high"],
  [/dop_v1_[0-9a-f]{64}/, "DigitalOcean PAT", "high"],
  [/lin_api_[a-zA-Z0-9]{40,}/, "Linear API Key", "high"],
  [/ntn_[0-9a-zA-Z]{40,}/, "Notion Token", "high"],
  [/figd_[0-9a-zA-Z\-_]{40,}/, "Figma Token", "high"],
  [/npm_[0-9a-zA-Z]{36,}/, "npm Token", "high"],
  [/pypi-[A-Za-z0-9\-_]{16,}/, "PyPI Token", "high"],
  [/password['":\s]*=['":\s]*['"][^'"\s]{8,}['"]/i, "Hardcoded Password", "high"],
  [/-----BEGIN (RSA |DSA |EC )?PRIVATE KEY-----/, "Private Key", "critical"],
  [/-----BEGIN OPENSSH PRIVATE KEY-----/, "OpenSSH Private Key", "critical"],
  [/(mysql|postgresql|postgres|mongodb):\/\/[^\s'")+]+:[^\s'")+]+@/i, "DB Connection String", "high"],
  [/xox[baprs]-[0-9a-zA-Z\-]{10,}/, "Slack Token", "high"],
  [/SG\.[A-Za-z0-9_\-]{22}\.[A-Za-z0-9_\-]{43}/, "SendGrid API Key", "high"],
  [/SK[0-9a-fA-F]{32}/, "Twilio API Key", "high"],
];

const EXCLUDED_FILES = new Set([
  ".env.example", ".env.sample", ".env.template",
  "package-lock.json", "yarn.lock", "poetry.lock", "Pipfile.lock", "Cargo.lock", "go.sum", ".gitignore",
]);

const EXCLUDED_DIRS = ["node_modules/", "vendor/", ".git/", "dist/", "build/", "__pycache__/", "venv/", "env/"];

function shouldSkip(filePath) {
  const base = require("path").basename(filePath);
  if (EXCLUDED_FILES.has(base)) return true;
  if (EXCLUDED_DIRS.some((d) => filePath.includes(d))) return true;
  if (!fs.existsSync(filePath)) return true;
  try {
    const buf = Buffer.alloc(1024);
    const fd = fs.openSync(filePath, "r");
    const n = fs.readSync(fd, buf, 0, 1024, 0);
    fs.closeSync(fd);
    if (buf.slice(0, n).includes(0)) return true;
  } catch { return true; }
  return false;
}

function getStagedFiles(command) {
  let files = [];
  try {
    files = execFileSync("git", ["diff", "--cached", "--name-only", "--diff-filter=ACM"], { encoding: "utf8", timeout: 5000 })
      .split("\n").map((f) => f.trim()).filter(Boolean);
  } catch {}

  if (!files.length) {
    if (/-\w*a/.test(command)) {
      try {
        files = execFileSync("git", ["diff", "--name-only"], { encoding: "utf8", timeout: 5000 })
          .split("\n").map((f) => f.trim()).filter((f) => f && fs.existsSync(f));
      } catch {}
    }
    for (const part of command.split(/&&|;/)) {
      const m = part.trim().match(/^git\s+add\s+(.+)/);
      if (m) {
        const args = m[1].trim();
        if ([".", "-A", "--all"].includes(args)) {
          try {
            const lines = execFileSync("git", ["status", "--porcelain"], { encoding: "utf8", timeout: 5000 }).split("\n");
            for (const l of lines) {
              if (l.length > 3) { const f = l.slice(3).trim(); if (fs.existsSync(f)) files.push(f); }
            }
          } catch {}
        } else {
          for (const tok of args.split(/\s+/)) {
            if (!tok.startsWith("-") && fs.existsSync(tok)) files.push(tok);
          }
        }
      }
    }
  }
  return files;
}

function scanFile(filePath) {
  if (shouldSkip(filePath)) return [];
  const findings = [];
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const stripped = line.trim();
      if (stripped.startsWith("#") || stripped.startsWith("//")) {
        if (/example|placeholder/i.test(stripped)) continue;
      }
      for (const [pat, desc, sev] of SECRET_PATTERNS) {
        if (pat.test(line)) {
          const match = line.match(pat);
          findings.push({ file: filePath, line: i + 1, description: desc, severity: sev, match: match ? match[0].slice(0, 50) : "" });
        }
      }
    }
  } catch {}
  return findings;
}

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (d) => (input += d));
process.stdin.on("end", () => {
  try {
    const data = JSON.parse(input);
    const command = (data.tool_input || {}).command || "";
    if (!/git\s+commit/i.test(command)) process.exit(0);

    const files = getStagedFiles(command);
    if (!files.length) process.exit(0);

    const allFindings = [];
    for (const f of files) allFindings.push(...scanFile(f));

    if (allFindings.length) {
      const sevOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      allFindings.sort((a, b) => (sevOrder[a.severity] || 4) - (sevOrder[b.severity] || 4));
      const emoji = { critical: "\u{1F534}", high: "\u{1F7E0}", medium: "\u{1F7E1}", low: "\u{1F535}" };

      process.stderr.write(`\nSECRET SCANNER: ${allFindings.length} potential secret(s) detected!\n\n`);
      for (const f of allFindings) {
        process.stderr.write(`${emoji[f.severity] || ""} ${f.description}\n   ${f.file}:${f.line}\n   ${f.match}\n\n`);
      }
      process.stderr.write("COMMIT BLOCKED: Remove secrets before committing.\nMove secrets to .env (in .gitignore) or use a secrets manager.\n");
      process.exit(2);
    }
    process.exit(0);
  } catch {
    process.exit(0);
  }
});
