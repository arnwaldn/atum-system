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

const PLUGIN_ROOT = process.env.CLAUDE_PLUGIN_ROOT || path.resolve(__dirname, '..');
const MANIFESTS_PATH = path.join(PLUGIN_ROOT, 'data', 'skill-manifests.json');
const SKILLS_DIR = path.join(PLUGIN_ROOT, 'skills');

const MAX_STDIN = 1024 * 1024;
const MAX_SKILLS = 5;
const TOKEN_BUDGET = 5000; // ~20KB chars
const CHAR_BUDGET = TOKEN_BUDGET * 4;
const MAX_SKILL_CHARS = 4800; // ~1200 tokens per skill

// ─── Skill content cache ───
const skillCache = new Map();
const CACHE_MAX = 20;

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

    // ATUM SAS admin
    { patterns: [/\b(agence atum|atum sas|soci..t..?|la bo..te)\b/i], command: '/agence-atum' },
    { patterns: [/\b(facture|devis|facturer)\b/i], command: '/agence-atum' },

    // Scheduling
    { patterns: [/\b(tous les jours|chaque lundi|every day|every morning|schedule|cron|planifi)\b/i], command: 'atum-system:scheduler' },

    // Memory
    { patterns: [/\b(souviens[- ]?toi|remember|m..moire collective|sauvegarder.*info)\b/i], command: 'atum-system:memoire' },

    // Onboarding
    { patterns: [/\b(bienvenue|comment ca marche|je commence|getting started|premier jour)\b/i], command: 'atum-system:bienvenue' },
  ];

  for (const route of routes) {
    for (const pattern of route.patterns) {
      const match = prompt.match(pattern);
      if (match) {
        return { command: route.command, trigger: match[0] };
      }
    }
  }
  return null;
}

// ─── Phase B: Skill matching ───
function tokenizePrompt(prompt) {
  return prompt.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 2);
}

function scoreSkill(promptWords, promptLower, manifest) {
  let score = 0;
  const activation = manifest.activation;

  // Keyword matching (weight 3)
  for (const kw of activation.onKeyword) {
    const kwLower = kw.toLowerCase();
    // Exact word match
    if (promptWords.includes(kwLower)) {
      score += 3;
    }
    // Substring match for compound keywords
    else if (kwLower.includes(' ') && promptLower.includes(kwLower)) {
      score += 4;
    }
    // Partial match (keyword is substring of a prompt word)
    else if (kwLower.length >= 4 && promptWords.some(w => w.includes(kwLower) || kwLower.includes(w))) {
      score += 1;
    }
  }

  // Intent matching (weight 5)
  for (const intent of activation.onIntent) {
    if (promptLower.includes(intent)) {
      score += 5;
    }
    // Partial intent match (check if most words of intent appear in prompt)
    else {
      const intentWords = intent.split(/\s+/).filter(w => w.length >= 3);
      const matchCount = intentWords.filter(w => promptLower.includes(w)).length;
      if (intentWords.length > 0 && matchCount / intentWords.length >= 0.6) {
        score += 2;
      }
    }
  }

  // File type detection from prompt (weight 4)
  for (const ft of activation.onFileType) {
    if (promptLower.includes(`.${ft}`) || promptLower.includes(ft)) {
      score += 4;
    }
  }

  return score;
}

function scoreAllSkills(prompt) {
  const data = loadManifests();
  if (!data) return [];

  const promptWords = tokenizePrompt(prompt);
  const promptLower = prompt.toLowerCase();

  const scored = [];
  for (const [skillId, manifest] of Object.entries(data.skills)) {
    const score = scoreSkill(promptWords, promptLower, manifest);
    if (score > 0) {
      scored.push({ id: skillId, score, tokenCost: manifest.token_cost, path: manifest.path });
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
      // No match — pass through unchanged
      process.stdout.write(data);
    }
  } catch (err) {
    console.error(`[skill-orchestrator] Error: ${err.message}`);
    process.stdout.write(data);
  }
  process.exit(0);
});
