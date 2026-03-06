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

// Initial sync
log("Collective Memory Sync started (every " + (INTERVAL_MS / 1000) + "s)");
sync();

// Periodic sync
setInterval(sync, INTERVAL_MS);
