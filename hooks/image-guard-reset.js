#!/usr/bin/env node
/**
 * image-guard-reset.js — Resets image counter on session events
 *
 * Used as a companion to image-guard.js.
 * Called on Stop hook to clean up counter files.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const COUNTER_DIR = path.join(os.homedir(), '.claude', 'tmp');

function main() {
  // Clean up all image counter files (session cleanup)
  try {
    if (fs.existsSync(COUNTER_DIR)) {
      const files = fs.readdirSync(COUNTER_DIR);
      for (const file of files) {
        if (file.startsWith('image-count-')) {
          fs.unlinkSync(path.join(COUNTER_DIR, file));
        }
      }
    }
  } catch {
    // Silent — cleanup is best-effort
  }

  // Auto-cleanup tracked test screenshots (end of session)
  const cleanupFile = path.join(COUNTER_DIR, 'screenshot-cleanup.txt');
  try {
    if (fs.existsSync(cleanupFile)) {
      const content = fs.readFileSync(cleanupFile, 'utf8');
      const filesToClean = [...new Set(content.split('\n').filter(Boolean))]; // deduplicate
      for (const f of filesToClean) {
        try {
          if (fs.existsSync(f)) fs.unlinkSync(f);
        } catch { /* skip locked files */ }
      }
      fs.unlinkSync(cleanupFile); // Remove the tracking file itself
    }
  } catch {
    // Silent — cleanup is best-effort
  }

  // Stop hooks don't use 'decision' — no output needed for cleanup-only hooks
}

main();
