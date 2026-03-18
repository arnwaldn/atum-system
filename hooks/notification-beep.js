#!/usr/bin/env node
/**
 * notification-beep.js — Cross-platform notification sounds
 *
 * Replaces: 2 PowerShell-only hooks in Notification
 * Supports: Windows (PowerShell Beep), macOS (afplay), Linux (paplay/bell), Git Bash
 *
 * Reads stdin JSON from Claude Code hook system.
 * Matcher in settings.json determines which event type triggers this.
 */

const { execSync } = require("child_process");
const fs = require("fs");

// Read stdin to get hook context
let input = "";
try {
  input = fs.readFileSync(0, "utf8");
} catch { /* ok — may be empty */ }

let matcher = "";
try {
  const data = JSON.parse(input);
  matcher = data.matcher || data.tool_name || "";
} catch { /* ok */ }

// Determine notification type from matcher or default
const isPermission = matcher === "permission_prompt";
const isIdle = matcher === "idle_prompt";

function beepWindows(freq1, dur1, freq2, dur2) {
  const cmd = freq2
    ? `powershell -Command "[Console]::Beep(${freq1},${dur1}); [Console]::Beep(${freq2},${dur2})"`
    : `powershell -Command "[Console]::Beep(${freq1},${dur1})"`;
  try { execSync(cmd, { stdio: "ignore", timeout: 3000 }); } catch { /* ok */ }
}

function beepMac(sound) {
  const soundFile = `/System/Library/Sounds/${sound}.aiff`;
  try { execSync(`afplay "${soundFile}"`, { stdio: "ignore", timeout: 3000 }); } catch {
    // Fallback: terminal bell
    process.stdout.write("\x07");
  }
}

function beepLinux() {
  try {
    execSync("paplay /usr/share/sounds/freedesktop/stereo/bell.oga", { stdio: "ignore", timeout: 3000 });
  } catch {
    // Fallback: terminal bell
    process.stdout.write("\x07");
  }
}

function notify() {
  const platform = process.platform;

  if (platform === "win32") {
    if (isPermission) {
      beepWindows(800, 300, 1000, 200);
    } else if (isIdle) {
      beepWindows(600, 500);
    } else {
      beepWindows(700, 300);
    }
  } else if (platform === "darwin") {
    if (isPermission) {
      beepMac("Ping");
    } else if (isIdle) {
      beepMac("Tink");
    } else {
      beepMac("Pop");
    }
  } else {
    // Linux or other
    beepLinux();
  }
}

notify();
