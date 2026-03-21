#!/usr/bin/env node
/**
 * Session Evaluator Hook (standalone, adapted from ECC)
 * Stop: signals when a session is long enough to extract patterns.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');

const MAX_STDIN = 1024 * 1024;
let stdinData = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => {
  if (stdinData.length < MAX_STDIN) stdinData += chunk.substring(0, MAX_STDIN - stdinData.length);
});

process.stdin.on('end', () => {
  try {
    let transcriptPath = null;
    try {
      const input = JSON.parse(stdinData);
      transcriptPath = input.transcript_path;
    } catch {
      transcriptPath = process.env.CLAUDE_TRANSCRIPT_PATH;
    }

    const minSessionLength = 10;
    const learnedSkillsPath = path.join(os.homedir(), '.claude', 'instincts');
    try { fs.mkdirSync(learnedSkillsPath, { recursive: true }); } catch {}

    if (!transcriptPath || !fs.existsSync(transcriptPath)) {
      process.exit(0);
    }

    // Count user messages
    let content;
    try { content = fs.readFileSync(transcriptPath, 'utf8'); } catch { process.exit(0); }
    const messageCount = (content.match(/"type"\s*:\s*"user"/g) || []).length;

    if (messageCount < minSessionLength) {
      process.exit(0);
    }

    console.error(`[ContinuousLearning] Session has ${messageCount} messages - evaluate for extractable patterns`);
    console.error(`[ContinuousLearning] Save learned skills to: ${learnedSkillsPath}`);
  } catch {}
  process.exit(0);
});
