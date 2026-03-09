#!/usr/bin/env node
/**
 * image-auto-resize.js — PreToolUse hook on Read
 *
 * Auto-resizes images > 1800px BEFORE they enter the conversation context.
 * This is the DEFINITIVE fix for "dimension limit for many-image requests (2000px)".
 *
 * Strategy:
 *   - Fast path: non-image files → instant allow (0ms)
 *   - Fast path: PNG with dimensions ≤ 1800px → allow after 24-byte header read (~1ms)
 *   - Fast path: PNG > 1800px (any file size) → resize via PowerShell (~1-2s)
 *   - Fast path: non-PNG small files (<100KB) → instant allow (0ms)
 *   - Slow path: non-PNG large image → PowerShell check + resize (~1-2s, only when necessary)
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const MAX_DIM = 1800;
const MIN_FILE_SIZE = 100000; // 100KB — below this, image is almost certainly ≤ 1800px
const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp']);

const HOME = process.env.HOME || process.env.USERPROFILE || '';
const RESIZE_SCRIPT = path.join(HOME, '.claude', 'scripts', 'resize-image.ps1');
// Append-only format: one path per line (safe for concurrent writes)
const CLEANUP_FILE = path.join(HOME, '.claude', 'tmp', 'screenshot-cleanup.txt');

// Patterns that identify test/debug screenshot artifacts (not project assets)
const TEST_SCREENSHOT_PATTERNS = [
  /screenshot_/i, /screen_/i, /^screen\./i, /test_\d/i, /beta[_-]/i,
  /emulator_/i, /capture[_-]/i, /debug[_-]/i, /^D\d+[_-]/i, /^E\d+[_-]/i,
  /^F\d+[_-]/i, /flow\d/i, /adb[_-]/i,
];
const TEST_DIR_PATTERNS = [
  /screenshots\//i, /beta_test/i, /test_captures/i, /debug_images/i,
];

/**
 * Track a test screenshot for later cleanup (on compact or session end).
 * Uses append-only file (one path per line) — safe for concurrent writes.
 */
function trackForCleanup(filePath) {
  try {
    const dir = path.dirname(CLEANUP_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const normalized = filePath.replace(/\\/g, '/');
    fs.appendFileSync(CLEANUP_FILE, normalized + '\n');
  } catch {
    // Best-effort tracking
  }
}

/**
 * Check if a file path looks like a test screenshot (not a project asset).
 * Only matches files with explicit test/debug naming patterns.
 * Does NOT match generic filenames like "logo.png" even if in TEMP.
 */
function isTestScreenshot(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  const basename = path.basename(normalized);

  // Check directory patterns (directories dedicated to test screenshots)
  if (TEST_DIR_PATTERNS.some(p => p.test(normalized))) return true;

  // Check filename patterns (explicit test/debug naming)
  if (TEST_SCREENSHOT_PATTERNS.some(p => p.test(basename))) return true;

  return false;
}

function allow(message) {
  const out = { decision: 'allow' };
  if (message) out.message = message;
  process.stdout.write(JSON.stringify(out));
}

/**
 * Read PNG dimensions from IHDR chunk (bytes 16-23).
 * Returns { width, height } or null if not a valid PNG.
 */
function readPngDimensions(filePath) {
  try {
    const fd = fs.openSync(filePath, 'r');
    const buf = Buffer.alloc(24);
    fs.readSync(fd, buf, 0, 24, 0);
    fs.closeSync(fd);

    // PNG signature: 89 50 4E 47 0D 0A 1A 0A
    if (buf[0] !== 0x89 || buf[1] !== 0x50 || buf[2] !== 0x4E || buf[3] !== 0x47) {
      return null;
    }

    return {
      width: buf.readUInt32BE(16),
      height: buf.readUInt32BE(20),
    };
  } catch {
    return null;
  }
}

/**
 * Resize image using PowerShell script with execFileSync (no shell injection risk).
 */
function resizeWithPowerShell(filePath) {
  try {
    const normalizedPath = filePath.replace(/\//g, '\\');
    const result = execFileSync('powershell', [
      '-NoProfile',
      '-ExecutionPolicy', 'Bypass',
      '-File', RESIZE_SCRIPT,
      '-Path', normalizedPath,
      '-MaxDim', String(MAX_DIM)
    ], { timeout: 8000, encoding: 'utf8' }).trim();

    if (result.startsWith('RESIZED:')) {
      return result;
    }
    return null;
  } catch {
    return null;
  }
}

function main() {
  let input;
  try {
    input = JSON.parse(fs.readFileSync(0, 'utf8'));
  } catch {
    allow();
    return;
  }

  const filePath = (input.tool_input || {}).file_path || '';
  const ext = path.extname(filePath).toLowerCase();

  // Fast path: not an image
  if (!IMAGE_EXTS.has(ext)) {
    allow();
    return;
  }

  // Check file exists
  try {
    fs.statSync(filePath);
  } catch {
    allow();
    return;
  }

  // Track test screenshots for auto-cleanup (on compact / session end)
  if (isTestScreenshot(filePath)) {
    trackForCleanup(filePath);
  }

  // PNG fast path: ALWAYS read header regardless of file size (~1ms).
  // A solid-color PNG can be 15KB at 1080x2400 — file size is NOT a reliable proxy.
  if (ext === '.png') {
    const dims = readPngDimensions(filePath);
    if (dims && dims.width <= MAX_DIM && dims.height <= MAX_DIM) {
      allow(); // Dimensions OK — no resize needed
      return;
    }
    if (dims && (dims.width > MAX_DIM || dims.height > MAX_DIM)) {
      // Dimensions exceed limit — resize needed (regardless of file size)
      if (fs.existsSync(RESIZE_SCRIPT)) {
        const result = resizeWithPowerShell(filePath);
        if (result) {
          allow(`Image auto-redimensionnee (${result}) pour respecter la limite API de ${MAX_DIM}px.`);
        } else {
          allow('WARNING: resize echoue — image may exceed 2000px limit.');
        }
      } else {
        allow('WARNING: resize-image.ps1 not found — image may exceed 2000px limit.');
      }
      return;
    }
    // Couldn't read PNG header — fall through to file size check + PowerShell
  }

  // Non-PNG: use file size as heuristic (JPEG/GIF/BMP/WebP)
  // Phone screenshots in JPEG are typically >200KB, so 100KB is a safe cutoff
  try {
    const stat = fs.statSync(filePath);
    if (stat.size < MIN_FILE_SIZE) {
      allow();
      return;
    }
  } catch {
    allow();
    return;
  }

  // Slow path: resize with PowerShell
  if (!fs.existsSync(RESIZE_SCRIPT)) {
    allow('WARNING: resize-image.ps1 not found — image may exceed 2000px limit.');
    return;
  }

  const result = resizeWithPowerShell(filePath);
  if (result) {
    allow(`Image auto-redimensionnee (${result}) pour respecter la limite API de ${MAX_DIM}px.`);
  } else {
    allow();
  }
}

main();
