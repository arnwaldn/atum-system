#!/usr/bin/env node
/**
 * ATUM Project Scanner (SessionStart hook)
 *
 * Scans all known project directories on the current machine,
 * evaluates maturity (git activity, tests, deploy config, codebase size),
 * and updates the projects table in Supabase.
 *
 * Runs at session start (max once per hour to avoid spam).
 * Reads project mapping from ~/.claude/atum-projects.json
 * Fails silently — never blocks session start.
 */

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const os = require("os");

const HOME = os.homedir();
const TEMP = process.env.TEMP || "/tmp";
const LAST_SCAN_FILE = path.join(TEMP, "atum-scanner-last-run.json");
const CONFIG_FILE = path.join(HOME, ".claude", "atum-projects.json");
const MIN_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

function shouldRun() {
  try {
    const last = JSON.parse(fs.readFileSync(LAST_SCAN_FILE, "utf8"));
    return Date.now() - last.timestamp > MIN_INTERVAL_MS;
  } catch {
    return true;
  }
}

function markRun() {
  try {
    fs.writeFileSync(LAST_SCAN_FILE, JSON.stringify({ timestamp: Date.now() }));
  } catch {}
}

function loadConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
  } catch {
    return null;
  }
}

function gitExec(args, cwd) {
  try {
    return execFileSync("git", args, { cwd, encoding: "utf8", timeout: 10000, windowsHide: true }).trim();
  } catch {
    return "";
  }
}

function dirExists(p) {
  try { return fs.statSync(p).isDirectory(); } catch { return false; }
}

function fileExists(p) {
  try { return fs.statSync(p).isFile(); } catch { return false; }
}

function countFiles(dir, extensions, maxDepth) {
  let count = 0;
  const skip = new Set([".git", "node_modules", "__pycache__", "dist", "build", ".next", "venv", "coverage", ".venv", "target"]);
  function walk(d, depth) {
    if (depth > (maxDepth || 4)) return;
    let entries;
    try { entries = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      if (entry.name.startsWith(".") || skip.has(entry.name)) continue;
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) walk(full, depth + 1);
      else if (entry.isFile() && extensions.includes(path.extname(entry.name).toLowerCase())) count++;
    }
  }
  walk(dir, 0);
  return count;
}

function countTestFiles(dir) {
  const testSuffixes = [".test.js", ".test.ts", ".test.tsx", ".spec.js", ".spec.ts", ".spec.tsx", ".test.py"];
  let count = 0;
  const skip = new Set([".git", "node_modules", "__pycache__", "dist", "build", ".next", "venv", "coverage"]);
  function walk(d, depth) {
    if (depth > 4) return;
    let entries;
    try { entries = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (e.name.startsWith(".") || skip.has(e.name)) continue;
      const full = path.join(d, e.name);
      if (e.isDirectory()) walk(full, depth + 1);
      else if (e.isFile()) {
        if (testSuffixes.some(s => e.name.endsWith(s))) count++;
        else if (e.name.startsWith("test_") && e.name.endsWith(".py")) count++;
      }
    }
  }
  walk(dir, 0);
  return count;
}

/**
 * Evaluate a project's maturity based on filesystem signals.
 * Returns { progress, status, signals }
 */
function evaluateProject(projectDir) {
  if (!dirExists(projectDir)) return null;

  const signals = {};
  let score = 0;

  // 1. Git repository (10 pts)
  const hasGit = dirExists(path.join(projectDir, ".git"));
  signals.has_git = hasGit;
  if (hasGit) score += 10;

  // 2. Git commits and activity (20 pts)
  if (hasGit) {
    const totalCommits = parseInt(gitExec(["rev-list", "--count", "HEAD"], projectDir)) || 0;
    signals.total_commits = totalCommits;
    if (totalCommits > 0) score += 5;
    if (totalCommits > 10) score += 5;
    if (totalCommits > 50) score += 5;
    if (totalCommits > 200) score += 5;

    const lastDate = gitExec(["log", "-1", "--format=%ai"], projectDir);
    signals.last_commit = lastDate;
    if (lastDate) {
      signals.days_since_last_commit = Math.round((Date.now() - new Date(lastDate).getTime()) / 86400000);
    }
  }

  // 3. Source code (15 pts)
  const codeExts = [".js", ".ts", ".tsx", ".jsx", ".py", ".rs", ".go", ".java", ".dart", ".vue", ".svelte", ".php"];
  const codeCount = countFiles(projectDir, codeExts);
  signals.source_files = codeCount;
  if (codeCount > 0) score += 5;
  if (codeCount > 10) score += 5;
  if (codeCount > 50) score += 5;

  // 4. Tests (10 pts)
  const testFiles = countTestFiles(projectDir);
  const hasTestDir = dirExists(path.join(projectDir, "tests")) || dirExists(path.join(projectDir, "__tests__")) || dirExists(path.join(projectDir, "test"));
  signals.test_files = testFiles;
  signals.has_test_dir = hasTestDir;
  if (hasTestDir || testFiles > 0) score += 5;
  if (testFiles > 5) score += 5;

  // 5. Package manager (5 pts)
  const hasPkg = fileExists(path.join(projectDir, "package.json"))
    || fileExists(path.join(projectDir, "pyproject.toml"))
    || fileExists(path.join(projectDir, "requirements.txt"))
    || fileExists(path.join(projectDir, "Cargo.toml"))
    || fileExists(path.join(projectDir, "go.mod"));
  signals.has_package_manager = hasPkg;
  if (hasPkg) score += 5;

  // 6. Deployment config (15 pts)
  const deploys = [];
  if (fileExists(path.join(projectDir, "Dockerfile"))) deploys.push("docker");
  if (fileExists(path.join(projectDir, "docker-compose.yml"))) deploys.push("docker-compose");
  if (fileExists(path.join(projectDir, "fly.toml"))) deploys.push("fly.io");
  if (fileExists(path.join(projectDir, "netlify.toml"))) deploys.push("netlify");
  if (fileExists(path.join(projectDir, "vercel.json"))) deploys.push("vercel");
  if (fileExists(path.join(projectDir, "render.yaml"))) deploys.push("render");
  if (fileExists(path.join(projectDir, "Procfile"))) deploys.push("procfile");
  if (dirExists(path.join(projectDir, ".github", "workflows"))) deploys.push("github-actions");
  signals.deploy_config = deploys;
  if (deploys.length > 0) score += 10;
  if (deploys.length > 2) score += 5;

  // 7. Docs (5 pts)
  if (fileExists(path.join(projectDir, "README.md"))) { signals.has_readme = true; score += 3; }
  if (dirExists(path.join(projectDir, "docs"))) { signals.has_docs = true; score += 2; }

  // 8. CI/CD (5 pts)
  if (deploys.includes("github-actions")) score += 5;

  // 9. Environment config (5 pts)
  if (fileExists(path.join(projectDir, ".env.example")) || fileExists(path.join(projectDir, ".env.local"))) {
    signals.has_env_config = true;
    score += 5;
  }

  // 10. Build output (10 pts)
  const hasBuild = dirExists(path.join(projectDir, "dist")) || dirExists(path.join(projectDir, "build"))
    || dirExists(path.join(projectDir, ".next")) || dirExists(path.join(projectDir, "out"));
  signals.has_build_output = hasBuild;
  if (hasBuild) score += 10;

  const progress = Math.min(Math.max(score, 0), 100);

  // Infer status
  let status = "planning";
  if (progress >= 80 && deploys.length > 0) status = "production";
  else if (progress >= 20) status = "in_progress";

  // Staleness check
  if (signals.days_since_last_commit > 60 && status !== "production") {
    status = "paused";
  }

  return { progress, status, signals };
}

async function syncToSupabase(supabaseUrl, supabaseKey, projectId, evaluation) {
  const url = `${supabaseUrl}/rest/v1/projects?id=eq.${projectId}`;
  const resp = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      progress: evaluation.progress,
      status: evaluation.status,
      updated_at: new Date().toISOString(),
    }),
    signal: AbortSignal.timeout(10000),
  });
  return resp.ok;
}

async function main() {
  if (!shouldRun()) return;

  const config = loadConfig();
  if (!config || !config.projects) return;

  // Resolve supabase credentials from config or env
  const supabaseUrl = config.supabase_url || process.env.ATUM_SUPABASE_URL;
  const supabaseKey = config.supabase_key || process.env[config.supabase_key_env] || process.env.ATUM_SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !supabaseKey) return;

  const results = [];

  for (const project of config.projects) {
    if (!project.id || !project.path) continue;

    const projectDir = project.path.replace(/^~/, HOME);
    const evaluation = evaluateProject(projectDir);

    if (!evaluation) {
      results.push({ name: project.name, error: "dir_not_found" });
      continue;
    }

    // Allow manual override: if project has override_progress, use it as floor
    if (project.override_progress != null) {
      evaluation.progress = Math.max(evaluation.progress, project.override_progress);
    }
    if (project.override_status) {
      evaluation.status = project.override_status;
    }

    try {
      const ok = await syncToSupabase(supabaseUrl, supabaseKey, project.id, evaluation);
      results.push({ name: project.name, progress: evaluation.progress, status: evaluation.status, synced: ok });
    } catch {
      results.push({ name: project.name, error: "sync_failed" });
    }
  }

  markRun();
  try {
    fs.writeFileSync(
      path.join(TEMP, "atum-scanner-results.json"),
      JSON.stringify({ timestamp: new Date().toISOString(), machine: os.hostname(), results }, null, 2)
    );
  } catch {}
}

main().catch(() => process.exit(0));
