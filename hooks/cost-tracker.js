#!/usr/bin/env node
/**
 * Cost Tracker Hook (standalone, adapted from ECC)
 * Stop: appends session usage metrics to ~/.claude/metrics/costs.jsonl
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');

const claudeDir = path.join(os.homedir(), '.claude');
const metricsDir = path.join(claudeDir, 'metrics');

function toNumber(v) { const n = Number(v); return Number.isFinite(n) ? n : 0; }

function estimateCost(model, inTok, outTok) {
  const table = {
    'haiku': { in: 0.8, out: 4.0 },
    'sonnet': { in: 3.0, out: 15.0 },
    'opus': { in: 15.0, out: 75.0 },
  };
  const norm = String(model || '').toLowerCase();
  let rates = table.sonnet;
  if (norm.includes('haiku')) rates = table.haiku;
  if (norm.includes('opus')) rates = table.opus;
  return Math.round(((inTok / 1e6) * rates.in + (outTok / 1e6) * rates.out) * 1e6) / 1e6;
}

const MAX_STDIN = 1024 * 1024;
let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => {
  if (raw.length < MAX_STDIN) raw += chunk.substring(0, MAX_STDIN - raw.length);
});

process.stdin.on('end', () => {
  try {
    const input = raw.trim() ? JSON.parse(raw) : {};
    const usage = input.usage || input.token_usage || {};
    const inTok = toNumber(usage.input_tokens || usage.prompt_tokens || 0);
    const outTok = toNumber(usage.output_tokens || usage.completion_tokens || 0);
    const model = String(input.model || process.env.CLAUDE_MODEL || 'unknown');
    const sessionId = String(process.env.CLAUDE_SESSION_ID || 'default');

    try { fs.mkdirSync(metricsDir, { recursive: true }); } catch {}
    const row = {
      timestamp: new Date().toISOString(),
      session_id: sessionId,
      model,
      input_tokens: inTok,
      output_tokens: outTok,
      estimated_cost_usd: estimateCost(model, inTok, outTok),
    };
    fs.appendFileSync(path.join(metricsDir, 'costs.jsonl'), JSON.stringify(row) + '\n');
  } catch {}
  process.stdout.write(raw);
});
