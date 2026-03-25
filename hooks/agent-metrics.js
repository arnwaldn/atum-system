#!/usr/bin/env node
/**
 * Agent Metrics Module
 *
 * Tracks agent performance silently and provides routing recommendations.
 * Used by skill-orchestrator and command hooks to prefer better-performing agents.
 *
 * Storage: ~/.claude/agent-metrics.json
 *
 * Usage as module:
 *   const { recordOutcome, getBestAgent, getAgentScore } = require('./agent-metrics');
 *
 * Usage as CLI (for commands):
 *   node agent-metrics.js record <agentId> <success|failure|timeout> [durationMs]
 *   node agent-metrics.js score <agentId>
 *   node agent-metrics.js best <capability> [agent1,agent2,...]
 *   node agent-metrics.js report
 */
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const METRICS_PATH = path.join(os.homedir(), '.claude', 'agent-metrics.json');
const MAX_HISTORY = 20; // Keep last 20 outcomes per agent

// ─── Load/Save ───

function loadMetrics() {
  try {
    return JSON.parse(fs.readFileSync(METRICS_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function saveMetrics(data) {
  try {
    const dir = path.dirname(METRICS_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(METRICS_PATH, JSON.stringify(data, null, 2));
  } catch {}
}

// ─── Record ───

function recordOutcome(agentId, outcome, durationMs) {
  const metrics = loadMetrics();

  if (!metrics[agentId]) {
    metrics[agentId] = {
      outcomes: [],
      totalSuccess: 0,
      totalFailure: 0,
      totalTimeout: 0,
      avgDurationMs: 0,
      lastUsed: null,
    };
  }

  const agent = metrics[agentId];
  const record = {
    outcome,  // 'success' | 'failure' | 'timeout'
    durationMs: durationMs || 0,
    ts: Date.now(),
  };

  agent.outcomes.push(record);
  if (agent.outcomes.length > MAX_HISTORY) {
    agent.outcomes = agent.outcomes.slice(-MAX_HISTORY);
  }

  // Update counters
  if (outcome === 'success') agent.totalSuccess++;
  else if (outcome === 'failure') agent.totalFailure++;
  else if (outcome === 'timeout') agent.totalTimeout++;

  // Update average duration (rolling)
  const durations = agent.outcomes
    .filter(o => o.durationMs > 0)
    .map(o => o.durationMs);
  agent.avgDurationMs = durations.length > 0
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : 0;

  agent.lastUsed = new Date().toISOString();

  saveMetrics(metrics);
  return agent;
}

// ─── Score ───

/**
 * Calculate a performance score for an agent (0 to 1).
 * Based on recent success rate, weighted toward recent outcomes.
 */
function getAgentScore(agentId) {
  const metrics = loadMetrics();
  const agent = metrics[agentId];
  if (!agent || agent.outcomes.length === 0) return 0.5; // No data = neutral

  // Weight recent outcomes more heavily (exponential decay)
  const outcomes = agent.outcomes;
  let weightedSuccess = 0;
  let totalWeight = 0;

  for (let i = 0; i < outcomes.length; i++) {
    const recency = (i + 1) / outcomes.length; // 0→1, most recent = 1
    const weight = Math.pow(recency, 2); // Quadratic: recent outcomes matter more
    totalWeight += weight;
    if (outcomes[i].outcome === 'success') weightedSuccess += weight;
  }

  return totalWeight > 0 ? Math.round(weightedSuccess / totalWeight * 100) / 100 : 0.5;
}

// ─── Best Agent Selection ───

/**
 * Given a list of candidate agent IDs, return the best one.
 * Considers: success rate, average duration, recency.
 */
function getBestAgent(candidates) {
  if (!candidates || candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];

  let bestId = candidates[0];
  let bestScore = -1;

  for (const agentId of candidates) {
    const score = getAgentScore(agentId);
    if (score > bestScore) {
      bestScore = score;
      bestId = agentId;
    }
  }

  return bestId;
}

// ─── Report ───

function generateReport() {
  const metrics = loadMetrics();
  const agents = Object.entries(metrics)
    .map(([id, data]) => ({
      id,
      score: getAgentScore(id),
      successRate: data.totalSuccess / Math.max(data.totalSuccess + data.totalFailure + data.totalTimeout, 1),
      total: data.outcomes.length,
      avgDuration: data.avgDurationMs,
      lastUsed: data.lastUsed,
    }))
    .sort((a, b) => b.score - a.score);

  return agents;
}

// ─── CLI interface ───

if (require.main === module) {
  const [,, action, ...args] = process.argv;

  switch (action) {
    case 'record': {
      const [agentId, outcome, duration] = args;
      if (!agentId || !outcome) {
        console.error('Usage: node agent-metrics.js record <agentId> <success|failure|timeout> [durationMs]');
        process.exit(1);
      }
      const result = recordOutcome(agentId, outcome, parseInt(duration) || 0);
      console.log(`Recorded ${outcome} for ${agentId}. Score: ${getAgentScore(agentId)}`);
      break;
    }
    case 'score': {
      const [agentId] = args;
      if (!agentId) {
        console.error('Usage: node agent-metrics.js score <agentId>');
        process.exit(1);
      }
      console.log(`${agentId}: ${getAgentScore(agentId)}`);
      break;
    }
    case 'best': {
      const candidates = args[0] ? args[0].split(',') : [];
      console.log(`Best: ${getBestAgent(candidates)}`);
      break;
    }
    case 'report': {
      const report = generateReport();
      if (report.length === 0) {
        console.log('No agent metrics yet.');
      } else {
        console.log('Agent Performance Report:');
        console.log('─'.repeat(70));
        for (const a of report) {
          const bar = '█'.repeat(Math.round(a.score * 10)) + '░'.repeat(10 - Math.round(a.score * 10));
          console.log(`  ${a.id.padEnd(30)} ${bar} ${(a.score * 100).toFixed(0)}% (${a.total} calls, avg ${a.avgDuration}ms)`);
        }
      }
      break;
    }
    default:
      console.error('Usage: node agent-metrics.js <record|score|best|report> [args]');
      process.exit(1);
  }
}

// ─── Module exports ───
module.exports = { recordOutcome, getAgentScore, getBestAgent, generateReport, loadMetrics };
