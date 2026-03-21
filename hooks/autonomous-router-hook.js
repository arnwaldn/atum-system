#!/usr/bin/env node
/**
 * Autonomous Router Hook (UserPromptSubmit)
 *
 * Analyzes user input BEFORE Claude responds and injects routing hints
 * when a known intent is detected. This makes the autonomous-routing
 * skill's 222 triggers work at ~99% reliability instead of ~70-80%.
 *
 * How it works:
 * - Reads user prompt from stdin JSON
 * - Matches against high-value trigger patterns
 * - If match found: appends a [System] hint to stdout JSON
 * - If no match: passes through unchanged
 */
'use strict';

const MAX_STDIN = 1024 * 1024;
let data = '';

process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => {
  if (data.length < MAX_STDIN) data += chunk.substring(0, MAX_STDIN - data.length);
});

process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);
    const prompt = String(input.user_prompt || input.content || '').toLowerCase().trim();

    if (!prompt || prompt.length < 3) {
      process.stdout.write(data);
      process.exit(0);
    }

    // Skip if user is already using a slash command
    if (prompt.startsWith('/')) {
      process.stdout.write(data);
      process.exit(0);
    }

    const route = matchRoute(prompt);

    if (route) {
      // Inject routing hint into the prompt context
      const hint = `\n[System: User intent detected → invoke ${route.command}. Reason: "${route.trigger}" matched.]`;
      console.error(`[AutoRouter] Detected: "${route.trigger}" → ${route.command}`);

      // Append hint to user message
      if (input.user_prompt) {
        input.user_prompt += hint;
      } else if (input.content) {
        input.content += hint;
      }
      process.stdout.write(JSON.stringify(input));
    } else {
      process.stdout.write(data);
    }
  } catch {
    process.stdout.write(data);
  }
  process.exit(0);
});

function matchRoute(prompt) {
  // High-priority routes — most common non-coder intents
  // Order matters: first match wins
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
