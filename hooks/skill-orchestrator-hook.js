#!/usr/bin/env node
/**
 * Skill Orchestrator Hook (UserPromptSubmit)
 *
 * Replaces autonomous-router-hook.js with a proper additionalContext-based
 * skill injection system. Deterministically loads 3-5 relevant skills per turn.
 *
 * Two phases:
 *   A) Command routing — preserves existing 29 slash command routes
 *   B) Skill matching — scores skills against prompt, loads top matches
 *
 * Output: hookSpecificOutput.additionalContext with matched skill content
 *
 * Hook type: UserPromptSubmit
 * Input: {"user_prompt": "..."} on stdin
 */
'use strict';

const fs = require('fs');
const path = require('path');

const os = require('os');

const PLUGIN_ROOT = process.env.CLAUDE_PLUGIN_ROOT || path.resolve(__dirname, '..');
const MANIFESTS_PATH = path.join(PLUGIN_ROOT, 'data', 'skill-manifests.json');
const SKILLS_DIR = path.join(PLUGIN_ROOT, 'skills');
const REPUTATION_PATH = path.join(os.homedir(), '.claude', 'skill-reputation.json');

const MAX_STDIN = 1024 * 1024;
const MAX_SKILLS = 5;
const TOKEN_BUDGET = 5000; // ~20KB chars
const CHAR_BUDGET = TOKEN_BUDGET * 4;
const MAX_SKILL_CHARS = 4800; // ~1200 tokens per skill

// ─── Skill content cache ───
const skillCache = new Map();
const CACHE_MAX = 50;

// ─── Skill reputation system ───
// Tracks how useful each skill is across sessions.
// loaded_count: how many times the skill was injected
// Each injection without explicit user rejection = neutral (no penalty).
// Skills are penalized by external feedback or by auto-deprecation logic.
let reputationData = null;

function loadReputation() {
  if (reputationData) return reputationData;
  try {
    reputationData = JSON.parse(fs.readFileSync(REPUTATION_PATH, 'utf8'));
  } catch {
    reputationData = {};
  }
  return reputationData;
}

function saveReputation() {
  if (!reputationData) return;
  try {
    const dir = path.dirname(REPUTATION_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(REPUTATION_PATH, JSON.stringify(reputationData, null, 2));
  } catch {}
}

function getReputationScore(skillId) {
  const rep = loadReputation();
  if (!rep[skillId]) return 0; // No data = neutral
  const r = rep[skillId];
  // Score = (positive - negative) / total, scaled to [-3, +3]
  const total = (r.positive || 0) + (r.negative || 0) + (r.neutral || 0);
  if (total === 0) return 0;
  const ratio = ((r.positive || 0) - (r.negative || 0)) / total;
  return Math.round(ratio * 3 * 10) / 10; // -3 to +3, 1 decimal
}

function recordSkillInjection(skillId) {
  const rep = loadReputation();
  if (!rep[skillId]) rep[skillId] = { positive: 0, negative: 0, neutral: 0, lastInjected: null };
  rep[skillId].neutral = (rep[skillId].neutral || 0) + 1;
  rep[skillId].lastInjected = new Date().toISOString();
}

// ─── Multi-turn skill memory ───
// Tracks which skills were injected in recent turns for momentum scoring.
// Skills used in the last 3 turns get a boost (decaying: +2, +1.5, +1).
// Also defines workflow successors: after code-gen → pre-warm test skill, etc.
const SESSION_ID = process.env.CLAUDE_SESSION_ID || 'default';
const SKILL_MEMORY_PATH = path.join(
  process.env.TEMP || process.env.TMPDIR || '/tmp',
  `atum-skill-memory-${SESSION_ID}.json`
);

// Workflow successors: loaded from manifest data (populated by generate-skill-registry.js).
// Fallback to hardcoded map if manifest doesn't have successors field yet.
let workflowSuccessorsCache = null;

function getWorkflowSuccessors() {
  if (workflowSuccessorsCache) return workflowSuccessorsCache;

  const data = loadManifests();
  workflowSuccessorsCache = {};

  if (data && data.skills) {
    for (const [skillId, manifest] of Object.entries(data.skills)) {
      if (manifest.successors && manifest.successors.length > 0) {
        workflowSuccessorsCache[skillId] = manifest.successors;
      }
    }
  }

  // Fallback for skills without declared successors
  const fallbacks = {
    'django-patterns': ['django-tdd', 'django-verification'],
    'react-patterns': ['e2e-testing'],
    'flask-patterns': ['python-testing'],
    'api-design': ['e2e-testing', 'security-review'],
    'security-review': ['deploy'],
    'security-scan': ['deploy'],
  };
  for (const [k, v] of Object.entries(fallbacks)) {
    if (!workflowSuccessorsCache[k]) workflowSuccessorsCache[k] = v;
  }

  return workflowSuccessorsCache;
}

function loadSkillMemory() {
  try {
    const data = JSON.parse(fs.readFileSync(SKILL_MEMORY_PATH, 'utf8'));
    // Discard if stale (>2 hours)
    if (Date.now() - (data.lastUpdate || 0) > 7200000) return { turns: [] };
    return data;
  } catch {
    return { turns: [] };
  }
}

function saveSkillMemory(memory) {
  memory.lastUpdate = Date.now();
  try { fs.writeFileSync(SKILL_MEMORY_PATH, JSON.stringify(memory)); } catch {}
}

/**
 * Calculate momentum boost for a skill based on recent turn history.
 * Returns 0 to +2 points.
 */
function getMomentumBoost(skillId, memory) {
  const turns = memory.turns || [];
  if (turns.length === 0) return 0;

  // Check last 3 turns with decaying boost
  const boosts = [2.0, 1.5, 1.0]; // most recent → oldest
  let totalBoost = 0;

  for (let i = 0; i < Math.min(3, turns.length); i++) {
    const turn = turns[turns.length - 1 - i];
    if (turn && turn.includes(skillId)) {
      totalBoost += boosts[i];
      break; // Count once, from most recent appearance
    }
  }

  // Check workflow successors: if a predecessor was used recently,
  // boost the successor skill
  for (const [predecessor, successors] of Object.entries(getWorkflowSuccessors())) {
    if (successors.includes(skillId)) {
      // Check if predecessor was used in the last 2 turns
      for (let i = 0; i < Math.min(2, turns.length); i++) {
        const turn = turns[turns.length - 1 - i];
        if (turn && turn.includes(predecessor)) {
          totalBoost += 1.5; // Workflow successor boost
          break;
        }
      }
    }
  }

  return Math.min(totalBoost, 3.0); // Cap at +3
}

// ─── Load manifests (cached on first call) ───
let manifests = null;
function loadManifests() {
  if (manifests) return manifests;
  try {
    manifests = JSON.parse(fs.readFileSync(MANIFESTS_PATH, 'utf8'));
    return manifests;
  } catch (err) {
    console.error(`[skill-orchestrator] Failed to load manifests: ${err.message}`);
    return null;
  }
}

// ─── Diacritics normalization for fuzzy matching ───
// "crée-moi" → "cree-moi", "déployer" → "deployer"
function removeDiacritics(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Simple Levenshtein distance for short strings (used for typo tolerance).
 * Only used for keyword matching, not full prompt comparison.
 */
function levenshtein(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + (b[i - 1] === a[j - 1] ? 0 : 1)
      );
    }
  }
  return matrix[b.length][a.length];
}

// ─── Fuzzy keyword matching for commands ───
// Maps common misspellings/variants to canonical forms.
const KEYWORD_ALIASES = {
  // French accent variants
  'deployer': 'déployer', 'deploiement': 'déploiement', 'deploie': 'déploie',
  'creemoi': 'crée-moi', 'cree-moi': 'crée-moi', 'creemoi': 'crée-moi',
  'faismoi': 'fais-moi', 'fais-moi': 'fais-moi',
  'construismoi': 'construis-moi', 'construis-moi': 'construis-moi',
  'securite': 'sécurité', 'securité': 'sécurité',
  'verifier': 'vérifier', 'verifie': 'vérifie',
  // English typos
  'deply': 'deploy', 'depoy': 'deploy', 'deploiy': 'deploy',
  'commti': 'commit', 'comit': 'commit',
  'scafflod': 'scaffold', 'scafold': 'scaffold',
  'reviw': 'review', 'reveiw': 'review',
};

// ─── Phase A: Command routing (migrated from autonomous-router-hook.js) ───
function matchCommandRoute(prompt) {
  const routes = [
    // Autopilot (non-coder project creation)
    { patterns: [/\b(cree[- ]?moi|build me|construis[- ]?moi|fais[- ]?moi)\b/i, /\b(autopilot|pilote auto)/i, /\b(de l.id..e au produit|from idea to product)\b/i], command: '/autopilot' },

    // Project definition
    { patterns: [/\b(nouveau projet|new project|definir.* projet|start a project)\b/i, /\b(j.ai une id..e|j.ai un projet|I want to build)\b/i], command: '/projet' },

    // Document processing
    { patterns: [/\.(pdf)\b/i], command: '/pdf' },
    { patterns: [/\.(docx?)\b|document word/i], command: '/docx' },
    { patterns: [/\.(xlsx?)\b|excel|spreadsheet|tableur/i], command: '/xlsx' },
    { patterns: [/\.(pptx?)\b|powerpoint|presentation|slides/i], command: '/pptx' },

    // Compliance & legal
    { patterns: [/\b(rgpd|gdpr|conformit..? rgpd|audit rgpd)\b/i], command: '/compliance' },
    { patterns: [/\b(eu ai act|syst..?me ia|ai compliance)\b/i], command: '/atum-audit' },
    { patterns: [/\b(pci[- ]?dss|s..curit..? paiement)\b/i], command: '/compliance pci' },

    // Deploy & infrastructure
    { patterns: [/\b(deploy|d..ployer|mettre en ligne|go live|mise en prod)\b/i], command: '/deploy' },
    { patterns: [/\b(pre[- ]?deploy|avant.*prod|checklist.*prod)\b/i], command: '/pre-deploy' },

    // Code quality
    { patterns: [/\b(review.*(code|pr)|code review|revoir le code)\b/i], command: '/code-review' },
    { patterns: [/\b(fix.*build|erreur.*build|build.*error|corriger.*build)\b/i], command: '/build-fix' },
    { patterns: [/\b(v..rifi|verify|check everything|tout v..rifier)\b/i], command: '/verify' },
    { patterns: [/\b(test coverage|couverture.*test)\b/i], command: '/test-coverage' },

    // Git workflow
    { patterns: [/\b(commit.*push.*pr|push.*cr..er.*pr|ouvrir.*pr)\b/i], command: '/commit-push-pr' },
    { patterns: [/\b(git commit|commit.*change|commiter)\b/i], command: '/commit' },

    // Project management
    { patterns: [/\b(status|statut.*projet|..tat du projet)\b/i], command: '/status' },
    { patterns: [/\b(health|diagnostic|check.*config|sant..? du syst)\b/i], command: '/health' },

    // Debug & analysis
    { patterns: [/\b(ultra[- ]?think|analyse.*profond|deep analysis|pense.*profond)\b/i], command: '/ultra-think' },
    { patterns: [/\b(debug|pourquoi.*marche pas|ca plante|investigate.*error)\b/i], command: 'atum-system:systematic-debugging' },

    // Brainstorming
    { patterns: [/\b(brainstorm|id..es|explore.*options|let.s think)\b/i], command: 'atum-system:brainstorming' },

    // Website & scaffold
    { patterns: [/\b(site.*web|website|site vitrine|landing page)\b/i], command: '/website' },
    { patterns: [/\b(scaffold|structure.*projet|g..n..rer.*projet)\b/i], command: '/scaffold' },

    // No-code
    { patterns: [/\b(no[- ]?code|make\.com|automatisation|scenario make)\b/i], command: 'atum-system:no-code-maestro' },

  ];

  // Normalize prompt: remove diacritics for broader matching.
  // "crée-moi un site" → "cree-moi un site" — matches regex "cree[- ]?moi"
  const normalizedPrompt = removeDiacritics(prompt);

  // Apply keyword aliases for common typos
  let correctedPrompt = normalizedPrompt;
  for (const [typo, canonical] of Object.entries(KEYWORD_ALIASES)) {
    if (correctedPrompt.includes(typo)) {
      correctedPrompt = correctedPrompt.replace(new RegExp(typo, 'gi'), removeDiacritics(canonical));
    }
  }

  // Try matching on both original and corrected prompts
  for (const route of routes) {
    for (const pattern of route.patterns) {
      // Try original first (preserves accented regex matches)
      const match = prompt.match(pattern) || normalizedPrompt.match(pattern) || correctedPrompt.match(pattern);
      if (match) {
        return { command: route.command, trigger: match[0] };
      }
    }
  }
  return null;
}

// ─── Phase B: Skill matching ───

// Words too generic to be useful for skill name matching
const LOW_SIGNAL = new Set([
  'test', 'testing', 'app', 'code', 'project', 'build', 'run',
  'fix', 'error', 'create', 'add', 'update', 'check', 'setup',
  'config', 'make', 'deploy', 'use', 'implement', 'write', 'read',
  'patterns', 'design', 'expert', 'guide', 'workflow', 'verification',
  'standards', 'best', 'practices', 'common', 'general',
  'the', 'and', 'for', 'with', 'from', 'into', 'that', 'this',
]);

// Domain detection: identify technologies explicitly mentioned in prompt
const DOMAIN_DETECTORS = [
  { pattern: /\bdjango\b/i, domains: ['python'], antiDomains: ['golang', 'frontend', 'swift', 'java'] },
  { pattern: /\bflask\b/i, domains: ['python'], antiDomains: ['golang', 'frontend', 'swift', 'java'] },
  { pattern: /\bpython\b|\bpytest\b|\bpip\b|\bpyproject\b/i, domains: ['python'], antiDomains: ['golang', 'swift', 'java'] },
  { pattern: /\breact\b|\bnext\.?js\b|\btailwind\b|\bvue\b|\bsvelte\b/i, domains: ['frontend'], antiDomains: ['python', 'golang', 'swift', 'java'] },
  { pattern: /\bgo\b|\bgolang\b/i, domains: ['golang'], antiDomains: ['python', 'frontend', 'swift', 'java'] },
  { pattern: /\bswift\b|\bswiftui\b|\bios\b/i, domains: ['swift'], antiDomains: ['python', 'golang', 'frontend', 'java'] },
  { pattern: /\bspring\b|\bjava\b(?!script)/i, domains: ['java'], antiDomains: ['python', 'golang', 'frontend', 'swift'] },
  { pattern: /\bflutter\b|\bdart\b/i, domains: ['mobile'], antiDomains: ['python', 'golang', 'java'] },
  { pattern: /\bexpress\b|\bnode\b|\bnpm\b|\btypescript\b/i, domains: ['frontend'], antiDomains: ['python', 'golang', 'swift', 'java'] },
  { pattern: /\bsql\b|\bpostgres\b|\bmongo\b|\bdatabase\b|\bredis\b/i, domains: ['data'], antiDomains: [] },
  { pattern: /\bdocker\b|\bk8s\b|\brender\b|\bvercel\b|\brailway\b/i, domains: ['infrastructure'], antiDomains: [] },
  { pattern: /\bsecurity\b|\bauth\b|\bvuln\b|\bsecurit/i, domains: ['security'], antiDomains: [] },
];

function tokenizePrompt(prompt) {
  return prompt.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 2);
}

function detectDomains(promptLower) {
  const detected = { domains: new Set(), antiDomains: new Set() };
  for (const d of DOMAIN_DETECTORS) {
    if (d.pattern.test(promptLower)) {
      for (const dom of d.domains) detected.domains.add(dom);
      for (const anti of d.antiDomains) detected.antiDomains.add(anti);
    }
  }
  return detected;
}

function scoreSkill(promptWordSet, promptLower, manifest, skillId, domainCtx) {
  let score = 0;
  const activation = manifest.activation;

  // 1. Skill name matching (weight 8) — strongest signal
  const nameParts = skillId.split('-').filter(w => w.length >= 3 && !LOW_SIGNAL.has(w));
  for (const part of nameParts) {
    if (promptWordSet.has(part)) {
      score += 8;
      break; // Count once only
    }
  }

  // 2. Keyword matching — exact only (weight 3)
  for (const kw of activation.onKeyword) {
    const kwLower = kw.toLowerCase();
    if (promptWordSet.has(kwLower)) {
      score += 3;
    }
    // Compound keyword match (multi-word exact substring)
    else if (kwLower.includes(' ') && promptLower.includes(kwLower)) {
      score += 4;
    }
    // NO partial matching — it generates 97% noise (583 false positives per prompt)
  }

  // 3. Intent matching (weight 5)
  for (const intent of activation.onIntent) {
    if (promptLower.includes(intent)) {
      score += 5;
    } else {
      const intentWords = intent.split(/\s+/).filter(w => w.length >= 3);
      const matchCount = intentWords.filter(w => promptLower.includes(w)).length;
      if (intentWords.length > 0 && matchCount / intentWords.length >= 0.6) {
        score += 2;
      }
    }
  }

  // 4. File type detection from prompt (weight 4)
  for (const ft of activation.onFileType) {
    if (promptLower.includes(`.${ft}`) || promptLower.includes(ft)) {
      score += 4;
    }
  }

  // 5. Domain boost/penalty — only when prompt explicitly mentions a technology
  if (domainCtx.domains.size > 0) {
    const skillDomain = manifest.category;
    if (domainCtx.domains.has(skillDomain)) {
      score += 6; // Boost: skill matches detected technology domain
    } else if (domainCtx.antiDomains.has(skillDomain)) {
      score -= 5; // Penalty: skill is from a competing technology domain
    }
  }

  // 6. Reputation adjustment — skills that proved useful get boosted,
  //    skills that were consistently ignored get penalized.
  //    Range: -3 to +3 points.
  score += getReputationScore(skillId);

  return score;
}

function scoreAllSkills(prompt) {
  const data = loadManifests();
  if (!data) return [];

  const promptWords = tokenizePrompt(prompt);
  const promptLower = prompt.toLowerCase();
  const domainCtx = detectDomains(promptLower);

  // Pre-compute a Set of prompt words for O(1) lookups in scoreSkill
  const promptWordSet = new Set(promptWords);

  // Load multi-turn memory for momentum scoring
  const memory = loadSkillMemory();

  const scored = [];
  let highScoreCount = 0;

  for (const [skillId, manifest] of Object.entries(data.skills)) {
    let score = scoreSkill(promptWordSet, promptLower, manifest, skillId, domainCtx);

    // 7. Multi-turn momentum: boost skills used in recent turns
    //    and workflow successors of recently used skills.
    score += getMomentumBoost(skillId, memory);

    if (score >= 4) {
      scored.push({ id: skillId, score, tokenCost: manifest.token_cost, path: manifest.path });
      if (score >= 10) highScoreCount++;
      if (highScoreCount >= MAX_SKILLS * 2) break;
    }
  }

  // Sort by score descending, then by token cost ascending (prefer lighter skills)
  scored.sort((a, b) => b.score - a.score || a.tokenCost - b.tokenCost);
  return scored;
}

// ─── Phase C: Content loading ───
function loadSkillContent(skillId, skillPath) {
  // Check cache
  if (skillCache.has(skillId)) {
    return skillCache.get(skillId);
  }

  const fullPath = path.join(PLUGIN_ROOT, skillPath);
  try {
    let content = fs.readFileSync(fullPath, 'utf8');

    // Truncate to budget per skill
    if (content.length > MAX_SKILL_CHARS) {
      // Find a clean break point (end of section)
      const breakPoint = content.lastIndexOf('\n## ', MAX_SKILL_CHARS);
      if (breakPoint > MAX_SKILL_CHARS * 0.5) {
        content = content.slice(0, breakPoint) + '\n[...truncated]';
      } else {
        content = content.slice(0, MAX_SKILL_CHARS) + '\n[...truncated]';
      }
    }

    // Cache with LRU eviction
    if (skillCache.size >= CACHE_MAX) {
      const firstKey = skillCache.keys().next().value;
      skillCache.delete(firstKey);
    }
    skillCache.set(skillId, content);

    return content;
  } catch (err) {
    console.error(`[skill-orchestrator] Failed to load ${skillPath}: ${err.message}`);
    return null;
  }
}

function loadMatchedSkills(scored) {
  const loaded = [];
  let totalChars = 0;

  for (const s of scored) {
    if (loaded.length >= MAX_SKILLS) break;
    if (totalChars >= CHAR_BUDGET) break;

    const content = loadSkillContent(s.id, s.path);
    if (!content) continue;

    const remaining = CHAR_BUDGET - totalChars;
    const trimmed = content.length > remaining
      ? content.slice(0, remaining) + '\n[...truncated]'
      : content;

    loaded.push({ id: s.id, score: s.score, content: trimmed });
    totalChars += trimmed.length;
  }

  return loaded;
}

// ─── Main pipeline ───
let data = '';

process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => {
  if (data.length < MAX_STDIN) data += chunk.substring(0, MAX_STDIN - data.length);
});

process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);
    const prompt = String(input.user_prompt || input.content || '').trim();

    if (!prompt || prompt.length < 3) {
      process.stdout.write(data);
      process.exit(0);
    }

    // Skip slash commands — they invoke skills directly
    if (prompt.startsWith('/')) {
      process.stdout.write(data);
      process.exit(0);
    }

    const parts = [];

    // Phase A: Command routing
    const route = matchCommandRoute(prompt.toLowerCase());
    if (route) {
      parts.push(`[System: User intent detected → invoke ${route.command}. Reason: "${route.trigger}" matched.]`);
      console.error(`[skill-orchestrator] Route: "${route.trigger}" → ${route.command}`);
    }

    // Phase B: Score and select skills
    const scored = scoreAllSkills(prompt);

    if (scored.length > 0) {
      // Phase C: Load content for top matches
      const loaded = loadMatchedSkills(scored);

      if (loaded.length > 0) {
        parts.push(`\n[Skill Orchestrator: Injecting ${loaded.length} relevant skill(s): ${loaded.map(s => s.id).join(', ')}]\n`);

        for (const skill of loaded) {
          parts.push(`--- SKILL: ${skill.id} (relevance: ${skill.score}) ---`);
          parts.push(skill.content);
        }

        console.error(`[skill-orchestrator] Injected ${loaded.length} skills: ${loaded.map(s => `${s.id}(${s.score})`).join(', ')}`);

        // Track injections for reputation system
        for (const skill of loaded) {
          recordSkillInjection(skill.id);
        }
        saveReputation();

        // Record this turn's skills in multi-turn memory
        const memory = loadSkillMemory();
        memory.turns.push(loaded.map(s => s.id));
        // Keep last 10 turns max
        if (memory.turns.length > 10) memory.turns = memory.turns.slice(-10);
        saveSkillMemory(memory);
      }
    }

    // Build output
    if (parts.length > 0) {
      const output = {
        hookSpecificOutput: {
          hookEventName: 'UserPromptSubmit',
          additionalContext: parts.join('\n'),
        },
      };
      process.stdout.write(JSON.stringify(output));
    } else {
      // No match — return empty object (not raw stdin)
      process.stdout.write('{}');
    }
  } catch (err) {
    console.error(`[skill-orchestrator] Error: ${err.message}`);
    process.stdout.write(data);
  }
  process.exit(0);
});
