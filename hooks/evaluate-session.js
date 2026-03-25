#!/usr/bin/env node
/**
 * Session Evaluator Hook (Stop)
 *
 * Extracts learnable patterns from session data and persists them
 * as instincts in ~/.claude/instincts/.
 *
 * Patterns extracted:
 *   1. Workflow patterns — repeated tool sequences (e.g. Read→Edit→Bash)
 *   2. Error recovery patterns — error followed by successful fix
 *   3. Tool preference patterns — which tools are used most for which file types
 *
 * Each pattern gets a confidence score (0-1). Only patterns >= 0.6 are persisted.
 * Duplicates are detected by content hash.
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const TEMP = process.env.TEMP || process.env.TMPDIR || '/tmp';
const STATS_FILE = path.join(TEMP, 'claude-session-stats.json');
const INSTINCTS_DIR = path.join(os.homedir(), '.claude', 'instincts');
const ERRORS_LOG = path.join(os.homedir(), '.claude', 'atum-learning-errors.log');
const MIN_SESSION_CALLS = 8;
const MIN_CONFIDENCE = 0.6;

function ensureDir(dir) {
  try { fs.mkdirSync(dir, { recursive: true }); } catch {}
}

function loadStats() {
  try {
    return JSON.parse(fs.readFileSync(STATS_FILE, 'utf8'));
  } catch { return null; }
}

function loadExistingInstincts() {
  try {
    const hashes = new Set();
    for (const file of fs.readdirSync(INSTINCTS_DIR)) {
      if (!file.endsWith('.json')) continue;
      try {
        const data = JSON.parse(fs.readFileSync(path.join(INSTINCTS_DIR, file), 'utf8'));
        if (data.contentHash) hashes.add(data.contentHash);
      } catch {}
    }
    return hashes;
  } catch { return new Set(); }
}

function hashContent(content) {
  return crypto.createHash('sha256').update(JSON.stringify(content)).digest('hex').slice(0, 16);
}

function logError(message) {
  try {
    const ts = new Date().toISOString();
    fs.appendFileSync(ERRORS_LOG, `${ts}: ${message}\n`);
  } catch {}
}

// ─── Pattern Extraction ───

/**
 * Extract workflow patterns from tool usage.
 * A workflow pattern is a sequence of tools used frequently together.
 */
function extractWorkflowPatterns(stats) {
  const patterns = [];
  const commands = stats.bashCommands || [];
  const toolCounts = stats.toolCounts || {};

  // Detect dominant workflow: what's the most common tool sequence?
  const tools = Object.entries(toolCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (tools.length >= 2) {
    const totalCalls = stats.totalCalls || 1;
    const topToolRatio = tools[0][1] / totalCalls;

    // If one tool dominates (>40%), it's a workflow signal
    if (topToolRatio > 0.4) {
      patterns.push({
        type: 'workflow',
        name: `dominant-tool-${tools[0][0].toLowerCase()}`,
        description: `This project heavily uses ${tools[0][0]} (${tools[0][1]}/${totalCalls} calls, ${Math.round(topToolRatio * 100)}%).`,
        data: { dominantTool: tools[0][0], ratio: topToolRatio, topTools: tools.map(t => t[0]) },
        confidence: Math.min(0.5 + topToolRatio, 0.95),
      });
    }
  }

  // Detect TDD pattern: test commands interleaved with edits
  const testCommands = commands.filter(c =>
    /\b(vitest|jest|pytest|cargo test|go test|npm test|pnpm test)\b/.test(c)
  );
  const editCount = toolCounts['Edit'] || 0;
  if (testCommands.length >= 3 && editCount >= 3) {
    const tddRatio = testCommands.length / Math.max(editCount, 1);
    if (tddRatio >= 0.3) {
      patterns.push({
        type: 'workflow',
        name: 'tdd-active',
        description: `TDD workflow detected: ${testCommands.length} test runs for ${editCount} edits.`,
        data: { testCommands: testCommands.length, edits: editCount, ratio: tddRatio },
        confidence: Math.min(0.6 + tddRatio * 0.3, 0.95),
      });
    }
  }

  return patterns;
}

/**
 * Extract error recovery patterns.
 * An error recovery is: error detected → subsequent fix succeeds.
 */
function extractErrorRecoveryPatterns(stats) {
  const patterns = [];
  const errors = stats.errorDetails || [];
  const totalErrors = stats.errors || 0;
  const totalCalls = stats.totalCalls || 1;

  if (errors.length === 0) return patterns;

  // Error rate pattern
  const errorRate = totalErrors / totalCalls;
  if (errorRate > 0.15) {
    patterns.push({
      type: 'error_recovery',
      name: 'high-error-rate',
      description: `High error rate (${Math.round(errorRate * 100)}%). Most common: ${errors[0].message.slice(0, 80)}`,
      data: { errorRate, totalErrors, topError: errors[0].message.slice(0, 150) },
      confidence: Math.min(0.5 + errorRate, 0.85),
    });
  }

  // Group errors by tool to find problematic tools
  const errorsByTool = {};
  for (const e of errors) {
    errorsByTool[e.tool] = (errorsByTool[e.tool] || 0) + 1;
  }
  const problematicTools = Object.entries(errorsByTool)
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1]);

  for (const [tool, count] of problematicTools) {
    patterns.push({
      type: 'error_recovery',
      name: `frequent-errors-${tool.toLowerCase()}`,
      description: `${tool} produced ${count} errors this session. Review usage patterns.`,
      data: { tool, errorCount: count },
      confidence: Math.min(0.5 + count * 0.1, 0.8),
    });
  }

  return patterns;
}

/**
 * Extract file type preference patterns.
 * Which file types were modified most? This informs future skill routing.
 */
function extractFileTypePatterns(stats) {
  const patterns = [];
  const files = stats.filesModified || [];
  if (files.length < 3) return patterns;

  // Count extensions
  const extCounts = {};
  for (const f of files) {
    const ext = path.extname(f).toLowerCase();
    if (ext) extCounts[ext] = (extCounts[ext] || 0) + 1;
  }

  const sortedExts = Object.entries(extCounts).sort((a, b) => b[1] - a[1]);
  if (sortedExts.length > 0 && sortedExts[0][1] >= 3) {
    const [ext, count] = sortedExts[0];
    patterns.push({
      type: 'preference',
      name: `primary-language-${ext.replace('.', '')}`,
      description: `Primary language this session: ${ext} (${count}/${files.length} files modified).`,
      data: { extension: ext, count, totalFiles: files.length, allExts: sortedExts.slice(0, 5) },
      confidence: Math.min(0.6 + (count / files.length) * 0.3, 0.95),
    });
  }

  return patterns;
}

/**
 * Extract git workflow patterns from commit messages.
 */
function extractGitPatterns(stats) {
  const patterns = [];
  const commits = stats.commitMessages || [];
  if (commits.length < 2) return patterns;

  // Detect commit type distribution
  const types = {};
  for (const msg of commits) {
    const match = msg.match(/^(feat|fix|refactor|docs|test|chore|perf|ci|style|build|revert)/);
    if (match) types[match[1]] = (types[match[1]] || 0) + 1;
  }

  const dominant = Object.entries(types).sort((a, b) => b[1] - a[1])[0];
  if (dominant && dominant[1] >= 2) {
    patterns.push({
      type: 'workflow',
      name: `commit-focus-${dominant[0]}`,
      description: `Session focused on ${dominant[0]} commits (${dominant[1]}/${commits.length}).`,
      data: { commitType: dominant[0], count: dominant[1], total: commits.length },
      confidence: 0.7,
    });
  }

  return patterns;
}

// ─── Main ───

const MAX_STDIN = 1024 * 1024;
let stdinData = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => {
  if (stdinData.length < MAX_STDIN) stdinData += chunk.substring(0, MAX_STDIN - stdinData.length);
});

process.stdin.on('end', () => {
  try {
    ensureDir(INSTINCTS_DIR);

    // Load session stats accumulated by loop-detector
    const stats = loadStats();
    if (!stats || (stats.totalCalls || 0) < MIN_SESSION_CALLS) {
      process.exit(0);
    }

    // Extract patterns from all sources
    const allPatterns = [
      ...extractWorkflowPatterns(stats),
      ...extractErrorRecoveryPatterns(stats),
      ...extractFileTypePatterns(stats),
      ...extractGitPatterns(stats),
    ];

    // Filter by confidence
    const viable = allPatterns.filter(p => p.confidence >= MIN_CONFIDENCE);
    if (viable.length === 0) {
      console.error(`[evaluate-session] ${allPatterns.length} patterns found, none above confidence threshold ${MIN_CONFIDENCE}`);
      process.exit(0);
    }

    // Deduplicate against existing instincts
    const existingHashes = loadExistingInstincts();
    const newPatterns = viable.filter(p => {
      const hash = hashContent(p.data);
      p.contentHash = hash;
      return !existingHashes.has(hash);
    });

    if (newPatterns.length === 0) {
      console.error(`[evaluate-session] ${viable.length} patterns above threshold, all already known`);
      process.exit(0);
    }

    // Persist new patterns
    let saved = 0;
    for (const pattern of newPatterns) {
      const filename = `${Date.now()}-${pattern.name}.json`;
      const record = {
        ...pattern,
        extractedAt: new Date().toISOString(),
        sessionCalls: stats.totalCalls,
        sessionDuration: Date.now() - (stats.startedAt || Date.now()),
      };

      try {
        fs.writeFileSync(path.join(INSTINCTS_DIR, filename), JSON.stringify(record, null, 2));
        saved++;
      } catch (err) {
        logError(`Failed to save pattern ${pattern.name}: ${err.message}`);
      }
    }

    console.error(`[evaluate-session] Extracted ${saved} new pattern(s) from ${stats.totalCalls} tool calls`);
    if (saved > 0) {
      console.error(`[evaluate-session] Patterns: ${newPatterns.map(p => `${p.name}(${Math.round(p.confidence * 100)}%)`).join(', ')}`);
    }
  } catch (err) {
    logError(`evaluate-session error: ${err.message}`);
  }
  process.exit(0);
});
