#!/usr/bin/env node
/**
 * image-guard.js — PreToolUse hook for screenshot-producing tools
 *
 * Tracks screenshot count per session and:
 * 1. Reminds Claude to resize browser before screenshots
 * 2. Warns about image accumulation after 3+ screenshots
 * 3. Blocks after 6+ screenshots without compact
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Session-scoped counter file
const SESSION_ID = process.env.CLAUDE_SESSION_ID || 'default';
const COUNTER_DIR = path.join(os.homedir(), '.claude', 'tmp');
const COUNTER_FILE = path.join(COUNTER_DIR, `image-count-${SESSION_ID}.json`);

const WARN_THRESHOLD = 3;
const BLOCK_THRESHOLD = 7;

function readCounter() {
  try {
    const data = JSON.parse(fs.readFileSync(COUNTER_FILE, 'utf8'));
    return data;
  } catch {
    return { count: 0, lastCompact: 0 };
  }
}

function writeCounter(data) {
  try {
    if (!fs.existsSync(COUNTER_DIR)) {
      fs.mkdirSync(COUNTER_DIR, { recursive: true });
    }
    fs.writeFileSync(COUNTER_FILE, JSON.stringify(data));
  } catch {
    // Silent fail — tracking is best-effort
  }
}

function main() {
  let input = '';
  try {
    input = fs.readFileSync(0, 'utf8');
  } catch {
    process.stdout.write(JSON.stringify({ decision: 'allow' }));
    return;
  }

  let toolData;
  try {
    toolData = JSON.parse(input);
  } catch {
    process.stdout.write(JSON.stringify({ decision: 'allow' }));
    return;
  }

  const toolName = toolData.tool_name || '';

  // Detect screenshot-producing tools
  const screenshotTools = [
    'mcp__claude-in-chrome__browser_take_screenshot',
    'mcp__claude-in-chrome__computer',
    'mcp__claude-in-chrome__upload_image',
    'mcp__claude_ai_Figma__get_screenshot',
    'mcp__claude_ai_Canva__get-design-thumbnail',
    'mcp__claude_ai_Excalidraw__create_view',
  ];

  // Special handling for resize — reset worry about next screenshot
  if (toolName === 'mcp__claude-in-chrome__resize_window') {
    process.stdout.write(JSON.stringify({ decision: 'allow' }));
    return;
  }

  if (!screenshotTools.includes(toolName)) {
    process.stdout.write(JSON.stringify({ decision: 'allow' }));
    return;
  }

  // Increment counter
  const counter = readCounter();
  counter.count += 1;
  writeCounter(counter);

  const imagesSinceCompact = counter.count - counter.lastCompact;

  // Layer 1: Always remind to resize browser for Chrome screenshots
  const isChromeScreenshot = toolName.startsWith('mcp__claude-in-chrome__');
  let resizeReminder = '';
  if (isChromeScreenshot) {
    resizeReminder = 'IMPORTANT: Ensure browser is resized to max 1280x900 BEFORE this screenshot (call resize_window first if not already done this session). ';
  }

  // Layer 2: Warn after threshold
  if (imagesSinceCompact >= BLOCK_THRESHOLD) {
    process.stdout.write(JSON.stringify({
      decision: 'block',
      reason: `BLOCKED: ${imagesSinceCompact} images dans le contexte sans /compact. Risque eleve d'erreur "dimension limit". Execute /compact MAINTENANT avant de prendre d'autres screenshots.`
    }));
    return;
  }

  if (imagesSinceCompact >= WARN_THRESHOLD) {
    process.stdout.write(JSON.stringify({
      decision: 'allow',
      message: `${resizeReminder}WARNING: ${imagesSinceCompact} images accumulees dans le contexte. Apres ce screenshot, execute /compact pour eviter l'erreur "dimension limit for many-image requests". Prefere get_page_text ou browser_snapshot si l'information visuelle n'est pas strictement necessaire.`
    }));
    return;
  }

  // Normal case — just remind about resize
  if (resizeReminder) {
    process.stdout.write(JSON.stringify({
      decision: 'allow',
      message: resizeReminder
    }));
  } else {
    process.stdout.write(JSON.stringify({ decision: 'allow' }));
  }
}

main();
