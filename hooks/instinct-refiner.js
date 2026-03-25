#!/usr/bin/env node
/**
 * Instinct Refiner Module
 *
 * Applies Bayesian confidence updates to learned instincts based on
 * observed outcomes. Instincts that prove reliable get boosted;
 * instincts that fail get penalized or archived.
 *
 * Storage: ~/.claude/instincts/*.json (modified in place)
 * Archive: ~/.claude/instincts/archived/ (deprecated instincts)
 *
 * Usage as module:
 *   const { refineInstinct, archiveStale, mergeRelated } = require('./instinct-refiner');
 *
 * Usage as CLI:
 *   node instinct-refiner.js reinforce <instinct-name> [strength=1]
 *   node instinct-refiner.js penalize <instinct-name> [strength=1]
 *   node instinct-refiner.js audit    — review all instincts, archive stale ones
 *   node instinct-refiner.js report   — show confidence scores
 */
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const INSTINCTS_DIR = path.join(os.homedir(), '.claude', 'instincts');
const ARCHIVE_DIR = path.join(INSTINCTS_DIR, 'archived');
const ARCHIVE_THRESHOLD = 0.40;   // Below this → archive
const MERGE_SIMILARITY = 0.70;    // Content hash prefix match ratio for merge candidates

function ensureDir(dir) {
  try { fs.mkdirSync(dir, { recursive: true }); } catch {}
}

// ─── Load instincts ───

function loadAllInstincts() {
  const instincts = [];
  try {
    for (const file of fs.readdirSync(INSTINCTS_DIR)) {
      if (!file.endsWith('.json')) continue;
      const fp = path.join(INSTINCTS_DIR, file);
      try {
        const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
        data._filename = file;
        data._filepath = fp;
        instincts.push(data);
      } catch {}
    }
  } catch {}
  return instincts;
}

function saveInstinct(instinct) {
  try {
    const fp = instinct._filepath;
    const data = { ...instinct };
    delete data._filename;
    delete data._filepath;
    fs.writeFileSync(fp, JSON.stringify(data, null, 2));
  } catch {}
}

// ─── Bayesian update ───

/**
 * Update confidence using a simplified Bayesian approach.
 * Each reinforcement/penalty adjusts the confidence toward 1.0 or 0.0,
 * with diminishing returns as confidence approaches the extremes.
 *
 * @param {number} currentConfidence - Current confidence (0-1)
 * @param {string} direction - 'reinforce' or 'penalize'
 * @param {number} strength - How strong the signal (default 1, range 0.5-3)
 * @returns {number} Updated confidence (0-1)
 */
function bayesianUpdate(currentConfidence, direction, strength = 1) {
  const alpha = 0.15 * strength; // Learning rate scaled by strength

  if (direction === 'reinforce') {
    // Move toward 1.0 with diminishing returns
    return currentConfidence + alpha * (1.0 - currentConfidence);
  } else {
    // Move toward 0.0 with diminishing returns
    return currentConfidence - alpha * currentConfidence;
  }
}

// ─── Refine ───

function refineInstinct(namePattern, direction, strength = 1) {
  const instincts = loadAllInstincts();
  const matches = instincts.filter(i =>
    i.name && i.name.includes(namePattern)
  );

  if (matches.length === 0) {
    return { updated: 0, message: `No instinct matching "${namePattern}"` };
  }

  let updated = 0;
  for (const instinct of matches) {
    const oldConf = instinct.confidence || 0.5;
    instinct.confidence = Math.round(bayesianUpdate(oldConf, direction, strength) * 1000) / 1000;

    // Track refinement history
    if (!instinct.refinements) instinct.refinements = [];
    instinct.refinements.push({
      direction,
      strength,
      oldConfidence: oldConf,
      newConfidence: instinct.confidence,
      ts: new Date().toISOString(),
    });
    // Keep last 20 refinements
    if (instinct.refinements.length > 20) {
      instinct.refinements = instinct.refinements.slice(-20);
    }

    saveInstinct(instinct);
    updated++;
  }

  return { updated, matches: matches.map(i => ({ name: i.name, confidence: i.confidence })) };
}

// ─── Archive stale instincts ───

function archiveStale() {
  ensureDir(ARCHIVE_DIR);
  const instincts = loadAllInstincts();
  let archived = 0;

  for (const instinct of instincts) {
    const conf = instinct.confidence || 0.5;
    if (conf < ARCHIVE_THRESHOLD) {
      // Move to archived directory
      const destPath = path.join(ARCHIVE_DIR, instinct._filename);
      try {
        const data = { ...instinct, archivedAt: new Date().toISOString(), archivedReason: `confidence ${conf} < ${ARCHIVE_THRESHOLD}` };
        delete data._filename;
        delete data._filepath;
        fs.writeFileSync(destPath, JSON.stringify(data, null, 2));
        fs.unlinkSync(instinct._filepath);
        archived++;
      } catch {}
    }
  }

  return { archived, remaining: instincts.length - archived };
}

// ─── Merge related instincts ───

function findMergeCandidates() {
  const instincts = loadAllInstincts();
  const candidates = [];

  for (let i = 0; i < instincts.length; i++) {
    for (let j = i + 1; j < instincts.length; j++) {
      const a = instincts[i];
      const b = instincts[j];

      // Same type and similar name
      if (a.type === b.type && a.name && b.name) {
        // Check if names share a common prefix (>70% overlap)
        const shorter = Math.min(a.name.length, b.name.length);
        let common = 0;
        for (let k = 0; k < shorter; k++) {
          if (a.name[k] === b.name[k]) common++;
          else break;
        }
        if (common / shorter >= MERGE_SIMILARITY) {
          candidates.push({
            a: { name: a.name, confidence: a.confidence, file: a._filename },
            b: { name: b.name, confidence: b.confidence, file: b._filename },
            similarity: common / shorter,
          });
        }
      }
    }
  }

  return candidates;
}

// ─── Report ───

function generateReport() {
  const instincts = loadAllInstincts();
  return instincts
    .map(i => ({
      name: i.name || 'unnamed',
      type: i.type || 'unknown',
      confidence: i.confidence || 0.5,
      refinements: (i.refinements || []).length,
      extractedAt: i.extractedAt || 'unknown',
    }))
    .sort((a, b) => b.confidence - a.confidence);
}

// ─── CLI ───

if (require.main === module) {
  const [,, action, ...args] = process.argv;

  switch (action) {
    case 'reinforce': {
      const [name, strength] = args;
      if (!name) { console.error('Usage: node instinct-refiner.js reinforce <name> [strength]'); process.exit(1); }
      const result = refineInstinct(name, 'reinforce', parseFloat(strength) || 1);
      console.log(`Reinforced ${result.updated} instinct(s):`, JSON.stringify(result.matches));
      break;
    }
    case 'penalize': {
      const [name, strength] = args;
      if (!name) { console.error('Usage: node instinct-refiner.js penalize <name> [strength]'); process.exit(1); }
      const result = refineInstinct(name, 'penalize', parseFloat(strength) || 1);
      console.log(`Penalized ${result.updated} instinct(s):`, JSON.stringify(result.matches));
      break;
    }
    case 'audit': {
      const stale = archiveStale();
      const merges = findMergeCandidates();
      console.log(`Archived ${stale.archived} stale instinct(s). ${stale.remaining} remaining.`);
      if (merges.length > 0) {
        console.log(`Found ${merges.length} merge candidate(s):`);
        for (const m of merges) {
          console.log(`  ${m.a.name} (${m.a.confidence}) + ${m.b.name} (${m.b.confidence}) — ${(m.similarity * 100).toFixed(0)}% similar`);
        }
      }
      break;
    }
    case 'report': {
      const report = generateReport();
      if (report.length === 0) {
        console.log('No instincts yet.');
      } else {
        console.log('Instinct Confidence Report:');
        console.log('─'.repeat(70));
        for (const i of report) {
          const bar = '█'.repeat(Math.round(i.confidence * 10)) + '░'.repeat(10 - Math.round(i.confidence * 10));
          console.log(`  ${i.name.padEnd(35)} ${bar} ${(i.confidence * 100).toFixed(0)}% (${i.refinements} refinements)`);
        }
      }
      break;
    }
    default:
      console.error('Usage: node instinct-refiner.js <reinforce|penalize|audit|report> [args]');
      process.exit(1);
  }
}

module.exports = { refineInstinct, archiveStale, findMergeCandidates, generateReport, bayesianUpdate };
