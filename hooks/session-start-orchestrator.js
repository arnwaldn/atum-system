#!/usr/bin/env node
/**
 * Session Start Orchestrator Hook
 *
 * Injects a compact Layer 1 skill index into the session context at startup.
 * Claude sees an overview of all 167 available skills without loading full definitions.
 *
 * Hook type: SessionStart
 * Input: {"source": "startup"|"resume"|"clear"} on stdin
 * Output: hookSpecificOutput with additionalContext containing the skill index
 */
'use strict';

const fs = require('fs');
const path = require('path');

const PLUGIN_ROOT = process.env.CLAUDE_PLUGIN_ROOT || path.resolve(__dirname, '..');
const REGISTRY_PATH = path.join(PLUGIN_ROOT, 'data', 'skill-registry.json');

// Max characters for the index context (~3000 tokens)
const MAX_INDEX_CHARS = 12000;

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    return '{}';
  }
}

function formatIndex(registry) {
  const lines = [`[ATUM Skill Orchestrator] ${registry.count} skills available. The orchestrator will automatically inject relevant skill definitions based on your prompts.\n`];
  lines.push('Skill index by category:\n');

  // Group by category
  const byCategory = {};
  for (const skill of registry.skills) {
    const cat = skill.category || 'general';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(skill);
  }

  // Sort categories by skill count (most popular first)
  const sortedCats = Object.entries(byCategory)
    .sort((a, b) => b[1].length - a[1].length);

  for (const [cat, skills] of sortedCats) {
    const skillList = skills.map(s => s.id).join(', ');
    lines.push(`**${cat}** (${skills.length}): ${skillList}`);
  }

  let result = lines.join('\n');

  // Enforce budget
  if (result.length > MAX_INDEX_CHARS) {
    result = result.slice(0, MAX_INDEX_CHARS) + '\n[...truncated]';
  }

  return result;
}

// ─── Cache: store formatted index to skip re-parsing on resume ───
const CACHE_PATH = path.join(
  process.env.TEMP || process.env.TMPDIR || '/tmp',
  'atum-skill-index-cache.json'
);

function getCachedIndex() {
  try {
    const registryStat = fs.statSync(REGISTRY_PATH);
    if (!fs.existsSync(CACHE_PATH)) return null;
    const cache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));
    // Validate cache is fresh (registry unchanged since last cache)
    if (cache.registryMtime === registryStat.mtimeMs && cache.index) {
      return cache.index;
    }
  } catch { /* cache miss */ }
  return null;
}

function setCachedIndex(index, registryMtime) {
  try {
    fs.writeFileSync(CACHE_PATH, JSON.stringify({ registryMtime, index }));
  } catch { /* non-critical */ }
}

try {
  const stdinData = readStdin();
  let input = {};
  try { input = JSON.parse(stdinData); } catch { /* ignore */ }

  // Load registry
  if (!fs.existsSync(REGISTRY_PATH)) {
    console.error('[session-start-orchestrator] Registry not found. Run: node scripts/generate-skill-registry.js');
    process.stdout.write('{}');
    process.exit(0);
  }

  // Try cache first (fast path for resume sessions)
  let index = getCachedIndex();
  let cacheHit = !!index;

  if (!index) {
    const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
    index = formatIndex(registry);
    const registryMtime = fs.statSync(REGISTRY_PATH).mtimeMs;
    setCachedIndex(index, registryMtime);
  }

  const output = JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: index,
    },
  });

  process.stdout.write(output);
  console.error(`[session-start-orchestrator] Injected skill index (${cacheHit ? 'cached' : 'fresh'}): ${index.length} chars`);
} catch (err) {
  console.error(`[session-start-orchestrator] Error: ${err.message}`);
  process.stdout.write('{}');
}

process.exit(0);
