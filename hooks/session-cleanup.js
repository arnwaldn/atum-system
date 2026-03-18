#!/usr/bin/env node
/**
 * session-cleanup.js — End-of-session cleanup (Stop hook)
 *
 * Replaces: image-guard-reset.js + inline shell-snapshots cleanup
 *
 * Cleans up:
 * 1. Image counter files (~/.claude/tmp/image-count-*)
 * 2. Screenshot tracking file (~/.claude/tmp/screenshot-cleanup.txt) + tracked files
 * 3. Shell snapshot files (~/.claude/shell-snapshots/*.sh)
 * 4. Edit backup files (*.backup.* older than current session)
 */

const fs = require("fs");
const path = require("path");
const os = require("os");

const HOME = os.homedir();
const COUNTER_DIR = path.join(HOME, ".claude", "tmp");
const SNAPSHOTS_DIR = path.join(HOME, ".claude", "shell-snapshots");

function cleanImageCounters() {
  try {
    if (!fs.existsSync(COUNTER_DIR)) return;
    for (const file of fs.readdirSync(COUNTER_DIR)) {
      if (file.startsWith("image-count-")) {
        fs.unlinkSync(path.join(COUNTER_DIR, file));
      }
    }
  } catch { /* best-effort */ }
}

function cleanScreenshotTracking() {
  const cleanupFile = path.join(COUNTER_DIR, "screenshot-cleanup.txt");
  try {
    if (!fs.existsSync(cleanupFile)) return;
    const content = fs.readFileSync(cleanupFile, "utf8");
    const files = [...new Set(content.split("\n").filter(Boolean))];
    for (const f of files) {
      try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch { /* skip locked */ }
    }
    fs.unlinkSync(cleanupFile);
  } catch { /* best-effort */ }
}

function cleanShellSnapshots() {
  try {
    if (!fs.existsSync(SNAPSHOTS_DIR)) return;
    for (const file of fs.readdirSync(SNAPSHOTS_DIR)) {
      if (file.endsWith(".sh")) {
        fs.unlinkSync(path.join(SNAPSHOTS_DIR, file));
      }
    }
  } catch { /* best-effort */ }
}

function main() {
  cleanImageCounters();
  cleanScreenshotTracking();
  cleanShellSnapshots();
}

main();
