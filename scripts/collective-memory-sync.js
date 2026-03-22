#!/usr/bin/env node
/**
 * Collective Memory — Real-time Sync (PM2 process)
 *
 * Runs continuously: every 30 seconds, pulls from GitHub (get others' changes)
 * and pushes local changes (share ours).
 *
 * Start: pm2 start ~/.claude/scripts/collective-memory-sync.js --name atum-memory-sync
 * Stop:  pm2 stop atum-memory-sync
 * Logs:  pm2 logs atum-memory-sync
 */

const { execFileSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const HOME = process.env.HOME || process.env.USERPROFILE || "";
const ATUM_USER = process.env.ATUM_USER || "arnaud";
const MEMORY_DIR = path.join(HOME, ".claude", "collective-memory");
const LOCK_FILE = path.join(MEMORY_DIR, ".sync-lock");
const INTERVAL_MS = 30000; // 30 seconds
const CLEANUP_MARKER = path.join(MEMORY_DIR, ".last-cleanup");
const CLEANUP_INTERVAL_MS = 86400000; // 24 hours
const SESSION_MAX_AGE_MS = 30 * 86400000; // 30 days
const ACCESS_FILE = path.join(MEMORY_DIR, ".access-counts.json");

function log(msg) {
  var ts = new Date().toISOString().slice(11, 19);
  console.log("[" + ts + "] " + msg);
}

function acquireLock() {
  try {
    if (fs.existsSync(LOCK_FILE)) {
      var stat = fs.statSync(LOCK_FILE);
      // Stale lock (older than 60s) — remove it
      if (Date.now() - stat.mtimeMs > 60000) {
        fs.unlinkSync(LOCK_FILE);
      } else {
        return false;
      }
    }
    fs.writeFileSync(LOCK_FILE, process.pid.toString());
    return true;
  } catch {
    return false;
  }
}

function releaseLock() {
  try { fs.unlinkSync(LOCK_FILE); } catch { /* ok */ }
}

function git(args) {
  return execFileSync("git", args, {
    cwd: MEMORY_DIR,
    timeout: 15000,
    encoding: "utf8",
    windowsHide: true,
    stdio: "pipe",
  });
}

function healRepo() {
  // Fix stuck rebase (from failed pull --rebase)
  var rebaseMerge = path.join(MEMORY_DIR, ".git", "rebase-merge");
  var rebaseApply = path.join(MEMORY_DIR, ".git", "rebase-apply");
  if (fs.existsSync(rebaseMerge) || fs.existsSync(rebaseApply)) {
    log("HEAL: aborting stuck rebase");
    try { git(["rebase", "--abort"]); } catch { /* ok */ }
  }
  // Fix conflicted merge state
  try {
    var status = git(["status", "--porcelain"]);
    if (/^[UDA]{2}/m.test(status)) {
      log("HEAL: resetting conflicted merge");
      try { git(["reset", "--hard", "HEAD"]); } catch { /* ok */ }
    }
  } catch { /* ok */ }
}

// --- Auto-propagation: install shared hooks after pull ---

var HOOKS_HASH_FILE = path.join(MEMORY_DIR, ".hooks-hash");

function getHooksHash() {
  // Compute a simple hash of all files in _hooks/ to detect changes
  var hooksDir = path.join(MEMORY_DIR, "_hooks");
  if (!fs.existsSync(hooksDir)) return "";
  try {
    var files = fs.readdirSync(hooksDir).filter(function(f) { return !f.startsWith("."); }).sort();
    var parts = [];
    for (var i = 0; i < files.length; i++) {
      var stat = fs.statSync(path.join(hooksDir, files[i]));
      parts.push(files[i] + ":" + stat.size + ":" + stat.mtimeMs);
    }
    return parts.join("|");
  } catch { return ""; }
}

function autoInstallHooks() {
  var installScript = path.join(MEMORY_DIR, "_hooks", "install.sh");
  if (!fs.existsSync(installScript)) return;

  var currentHash = getHooksHash();
  if (!currentHash) return;

  // Compare with last known hash
  var lastHash = "";
  try { lastHash = fs.readFileSync(HOOKS_HASH_FILE, "utf8").trim(); } catch { /* first run */ }

  if (currentHash !== lastHash) {
    log("HOOKS: _hooks/ changed — running install.sh");
    try {
      execFileSync("bash", [installScript], {
        cwd: MEMORY_DIR,
        timeout: 15000,
        encoding: "utf8",
        windowsHide: true,
        stdio: "pipe",
      });
      // Save new hash
      fs.writeFileSync(HOOKS_HASH_FILE, currentHash);
      log("HOOKS: install complete");
    } catch (e) {
      log("HOOKS: install failed: " + (e.message || "").slice(0, 80));
    }
  }
}

function sync() {
  if (!fs.existsSync(path.join(MEMORY_DIR, ".git"))) {
    log("ERROR: no git repo at " + MEMORY_DIR);
    return;
  }

  if (!acquireLock()) {
    log("SKIP: lock held by another process");
    return;
  }

  try {
    // Self-heal before sync
    healRepo();

    // Pull remote changes
    try {
      git(["pull", "--rebase", "--autostash"]);
    } catch (e) {
      log("pull failed: " + (e.message || "").slice(0, 80));
      // If pull failed, try to heal again (rebase may have just broken)
      healRepo();
    }

    // Auto-install shared hooks if _hooks/ changed after pull
    autoInstallHooks();

    // Stage all local changes
    git(["add", "-A"]);

    // Check if there's anything to commit
    try {
      git(["diff", "--cached", "--quiet"]);
      // No changes — nothing to push
    } catch {
      // There ARE staged changes — commit and push
      var msg = "auto-sync " + ATUM_USER + " " + new Date().toISOString().slice(0, 16);
      try {
        git(["commit", "-m", msg]);
        git(["push"]);
        log("pushed changes");
      } catch (e) {
        log("push failed: " + (e.message || "").slice(0, 80));
      }
    }
  } finally {
    releaseLock();
  }
}

// --- Smart Cleanup: human-like memory forgetting ---
// Sessions > 30 days are scored for lasting value.
// High-value = kept, low-value = deleted. Explicit memories never deleted.

var HIGH_VALUE_KEYWORDS = [
  "decision", "architecture", "deploy", "production", "release",
  "client", "contrat", "livraison", "facture", "devis",
  "migration", "breaking", "critique", "security", "incident",
  "pivot", "strategie", "partenariat", "obligation", "gouvernance",
  "revenue", "pricing", "tarif", "budget", "investissement",
];
var MEDIUM_VALUE_KEYWORDS = [
  "fix", "refactor", "feature", "integration", "config",
  "infrastructure", "database", "schema", "api", "endpoint",
];
var PROJECT_NAMES = [
  "gigroute", "atum", "owl", "cloclo",
];

function loadAccessCounts() {
  try {
    return JSON.parse(fs.readFileSync(ACCESS_FILE, "utf8"));
  } catch {
    return {};
  }
}

function getAccessInfo(accessCounts, relPath) {
  var entry = accessCounts[relPath];
  if (!entry) return { count: 0, lastAccess: 0 };
  return entry;
}

function scoreSession(content, accessInfo) {
  var lower = content.toLowerCase();
  var score = 0;

  // High-value keywords: +3 each (capped at 15)
  var highHits = 0;
  for (var i = 0; i < HIGH_VALUE_KEYWORDS.length; i++) {
    if (lower.includes(HIGH_VALUE_KEYWORDS[i])) highHits++;
  }
  score += Math.min(highHits * 3, 15);

  // Medium-value keywords: +1 each (capped at 5)
  var medHits = 0;
  for (var j = 0; j < MEDIUM_VALUE_KEYWORDS.length; j++) {
    if (lower.includes(MEDIUM_VALUE_KEYWORDS[j])) medHits++;
  }
  score += Math.min(medHits, 5);

  // Project names: +2 each
  for (var k = 0; k < PROJECT_NAMES.length; k++) {
    if (lower.includes(PROJECT_NAMES[k])) score += 2;
  }

  // Tool count heuristic: many tools = substantive work
  var toolMatch = lower.match(/outils:\s*(.+)/);
  if (toolMatch) {
    var toolNumbers = toolMatch[1].match(/\d+/g);
    if (toolNumbers) {
      var totalTools = 0;
      for (var t = 0; t < toolNumbers.length; t++) {
        totalTools += parseInt(toolNumbers[t], 10);
      }
      if (totalTools >= 15) score += 3;
      else if (totalTools >= 8) score += 1;
      else if (totalTools <= 3) score -= 2;
    }
  }

  // Very short content = likely trivial
  if (content.length < 200) score -= 2;

  // Contains commit messages about features/deploys
  if (/commit.*(?:feat|deploy|release|fix)/i.test(lower)) score += 2;

  // --- Bio-inspired: access-based reinforcement ---
  // Frequently recalled memories resist forgetting (like human spaced repetition)
  if (accessInfo && accessInfo.count > 0) {
    score += Math.min(accessInfo.count * 2, 12); // +2 per access, capped at 12
  }

  // Decay: memories never accessed lose value over time
  if (accessInfo && accessInfo.lastAccess > 0) {
    var daysSinceAccess = (Date.now() - accessInfo.lastAccess) / 86400000;
    if (daysSinceAccess > 30) {
      score -= Math.floor(daysSinceAccess / 10); // -1 per 10 days of no access
    }
  }

  return score;
}

function smartCleanup() {
  // Only run once per day
  try {
    if (fs.existsSync(CLEANUP_MARKER)) {
      var markerStat = fs.statSync(CLEANUP_MARKER);
      if (Date.now() - markerStat.mtimeMs < CLEANUP_INTERVAL_MS) {
        return; // Already ran today
      }
    }
  } catch { /* proceed */ }

  log("CLEANUP: starting smart memory cleanup...");
  var sessionsDir = path.join(MEMORY_DIR, "sessions");
  var accessCounts = loadAccessCounts();
  var deleted = 0;
  var kept = 0;

  try {
    // Scan all user directories under sessions/
    var users = fs.readdirSync(sessionsDir).filter(function(d) {
      return fs.statSync(path.join(sessionsDir, d)).isDirectory();
    });

    for (var u = 0; u < users.length; u++) {
      var userDir = path.join(sessionsDir, users[u]);
      var files = fs.readdirSync(userDir).filter(function(f) {
        return f.endsWith(".md");
      });

      for (var f = 0; f < files.length; f++) {
        var filePath = path.join(userDir, files[f]);
        var stat = fs.statSync(filePath);
        var ageMs = Date.now() - stat.mtimeMs;

        // Only process files older than 30 days
        if (ageMs < SESSION_MAX_AGE_MS) continue;

        var content = fs.readFileSync(filePath, "utf8");
        var relPath = "sessions/" + users[u] + "/" + files[f];
        var accessInfo = getAccessInfo(accessCounts, relPath);
        var score = scoreSession(content, accessInfo);

        if (score >= 3) {
          // High value — keep it (like a meaningful memory)
          kept++;
          log("CLEANUP: KEEP (score=" + score + ", accessed=" + accessInfo.count + "x) " + files[f]);
        } else {
          // Low value — delete it (like forgetting a routine day)
          fs.unlinkSync(filePath);
          // Also clean up the access counter
          if (accessCounts[relPath]) delete accessCounts[relPath];
          deleted++;
          log("CLEANUP: FORGET (score=" + score + ", accessed=" + accessInfo.count + "x) " + files[f]);
        }
      }
    }
  } catch (e) {
    log("CLEANUP error: " + (e.message || "").slice(0, 80));
  }

  // Save cleaned access counts if we deleted entries
  if (deleted > 0) {
    try { fs.writeFileSync(ACCESS_FILE, JSON.stringify(accessCounts, null, 2)); }
    catch { /* ok */ }
  }

  if (deleted > 0 || kept > 0) {
    log("CLEANUP done: forgot " + deleted + " trivial sessions, kept " + kept + " important ones");
  }

  // Mark cleanup as done
  try {
    fs.writeFileSync(CLEANUP_MARKER, new Date().toISOString());
  } catch { /* ok */ }
}

// --- Self-update: if _scripts/collective-memory-sync.js differs, replace ourselves and restart ---

function selfUpdate() {
  var repoScript = path.join(MEMORY_DIR, "_scripts", "collective-memory-sync.js");
  var myPath = __filename;
  if (!fs.existsSync(repoScript)) return;

  try {
    var repoContent = fs.readFileSync(repoScript, "utf8");
    var myContent = fs.readFileSync(myPath, "utf8");

    // Adapt paths before comparison (repo version may have local paths)
    var adapted = repoContent.replace(/C:\/Users\/\w+/g, HOME).replace(/C:\\Users\\\w+/g, HOME);

    if (adapted !== myContent) {
      log("SELF-UPDATE: new sync script detected — updating and restarting");
      fs.writeFileSync(myPath, adapted);
      // PM2 will auto-restart if configured, otherwise we restart ourselves
      try {
        execFileSync("pm2", ["restart", "atum-memory-sync"], {
          timeout: 10000, encoding: "utf8", windowsHide: true, stdio: "pipe",
        });
      } catch {
        // If PM2 restart fails, just exit — PM2 auto-restart will pick up the new file
        process.exit(0);
      }
    }
  } catch { /* best effort */ }
}

// Initial sync + cleanup + self-update check
log("Collective Memory Sync started (every " + (INTERVAL_MS / 1000) + "s)");
smartCleanup();
sync();
selfUpdate();

// Periodic sync (every 30s) — cleanup check included (no-op if already ran today)
setInterval(function() {
  smartCleanup();
  sync();
  selfUpdate();
}, INTERVAL_MS);
