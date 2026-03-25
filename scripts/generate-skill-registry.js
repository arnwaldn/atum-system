#!/usr/bin/env node
/**
 * Generate Skill Registry
 *
 * Scans all 167 skills SKILL.md files, extracts frontmatter and content
 * metadata, and produces two JSON files:
 *
 *   data/skill-registry.json   — Layer 1 compact index (~2500 tokens)
 *   data/skill-manifests.json  — Layer 2 activation manifests for the router
 *
 * Usage: node scripts/generate-skill-registry.js
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SKILLS_DIR = path.join(ROOT, 'skills');
const DATA_DIR = path.join(ROOT, 'data');

// Stop words for keyword extraction (EN + FR)
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'shall', 'can', 'this', 'that',
  'these', 'those', 'it', 'its', 'not', 'no', 'all', 'each', 'every',
  'any', 'some', 'such', 'when', 'where', 'how', 'what', 'which', 'who',
  'whom', 'than', 'then', 'if', 'else', 'as', 'so', 'up', 'out', 'about',
  'into', 'through', 'during', 'before', 'after', 'above', 'below',
  'between', 'under', 'again', 'further', 'once', 'here', 'there', 'both',
  'few', 'more', 'most', 'other', 'only', 'own', 'same', 'too', 'very',
  'just', 'because', 'also', 'use', 'using', 'used', 'like', 'including',
  'based', 'you', 'your', 'we', 'our', 'they', 'them', 'their', 'my',
  'me', 'he', 'she', 'him', 'her', 'must', 'need', 'make', 'get',
  // FR
  'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'et', 'ou', 'mais',
  'dans', 'sur', 'pour', 'par', 'avec', 'est', 'sont', 'etre', 'avoir',
  'faire', 'pas', 'ne', 'ce', 'cette', 'ces', 'qui', 'que', 'quoi',
  'dont', 'tout', 'tous', 'toute', 'toutes', 'plus', 'moins', 'bien',
  'aussi', 'encore', 'deja', 'tres', 'trop', 'peu', 'si', 'car', 'donc',
]);

// LOW-SIGNAL keywords that match too many skills and pollute routing.
// These are filtered from onKeyword but kept in compound terms.
const LOW_SIGNAL_KEYWORDS = new Set([
  'patterns', 'user', 'code', 'skill', 'design', 'claude',
  'practices', 'create', 'best', 'add', 'development', 'asks',
  'project', 'system', 'applications', 'skills', 'wants',
  'coverage', 'test', 'model', 'implementation', 'structured',
  'writing', 'building', 'review', 'run', 'setup', 'help',
  'file', 'files', 'new', 'command', 'output', 'tool',
  'something', 'asked', 'real', 'needs', 'guidance', 'structure',
  // Cross-domain terms that match too broadly on their own.
  // They remain useful in compounds (e.g. "api-design", "security-review").
  'api', 'testing', 'security', 'data', 'architecture',
]);

// Domain category mappings inferred from skill name patterns
// Domain inference patterns — ordered by specificity (most specific first).
// Uses word boundaries (\b) to prevent false matches (e.g. "doc" in "docker").
const DOMAIN_PATTERNS = [
  // Specific frameworks/tools first (before generic language patterns)
  { pattern: /\bbackend[-_]pattern/, domain: 'backend' },
  { pattern: /\bhugging[-_]?face\b|\bhf-/, domain: 'ai' },
  { pattern: /\binvestor\b|\bmarket[-_]?research\b|\bpitch\b|\bfundraising\b/, domain: 'business' },
  { pattern: /\bagence\b|\bbusiness[-_]?plan\b/, domain: 'business' },
  { pattern: /\bflask\b|\bdjango\b|\bpytest\b|\bpyproject\b/, domain: 'python' },
  { pattern: /\bspringboot\b|\bspring[-_]?boot\b|\bjpa\b/, domain: 'java' },
  { pattern: /\breact\b|\bnextjs\b|\btailwind\b|\bsvelte\b|\bvue\b/, domain: 'frontend' },
  { pattern: /\bgolang\b|\bgo[-_]build\b|\bgo[-_]test\b|\bgo[-_]review\b/, domain: 'golang' },
  { pattern: /\bswiftui\b|\bswift[-_]/, domain: 'swift' },
  { pattern: /\bflutter\b|\bdart\b|\bexpo\b/, domain: 'mobile' },
  { pattern: /\bdocker\b|\bkubernetes\b|\bk8s\b|\bterraform\b/, domain: 'infrastructure' },
  { pattern: /\bsentry\b|\bposthog\b|\bobserv/, domain: 'monitoring' },
  { pattern: /\bcompliance\b|\baudit\b|\blegal\b|\bgdpr\b|\brgpd\b/, domain: 'compliance' },
  // Agent/plugin tooling (before generic patterns)
  { pattern: /\bagent\b|\bplugin\b|\bskill[-_]|\bhook[-_]|\bmcp\b|\bcommand[-_]/, domain: 'tooling' },
  // Generic language patterns
  { pattern: /\bpython\b|\bpip\b/, domain: 'python' },
  { pattern: /\btypescript\b|\bjavascript\b|\bnode\b|\bnpm\b/, domain: 'frontend' },
  { pattern: /\bjava\b(?!script)/, domain: 'java' },
  { pattern: /\bswift\b|\bios\b/, domain: 'swift' },
  // Generic domain patterns (least specific)
  { pattern: /\bapi[-_]design\b|\brest[-_]|\bgraphql\b|\bgrpc\b/, domain: 'api' },
  { pattern: /\btdd\b|\btest[-_]driven\b|\be2e[-_]test/, domain: 'quality' },
  { pattern: /\bsecurity[-_]\b|\boauth\b|\bjwt\b|\bencryption\b/, domain: 'security' },
  { pattern: /\bdatabase\b|\bsql\b|\bmongo\b|\bredis\b|\bpostgres\b|\bclickhouse\b/, domain: 'data' },
  { pattern: /\bci[-_]cd\b|\bgithub[-_]action/, domain: 'devops' },
  { pattern: /\bdeploy\b|\binfra\b|\bdevops\b/, domain: 'infrastructure' },
  { pattern: /\bui[-_]ux\b|\bdesign[-_]|\bcss\b|\baccessibility\b|\brefactoring[-_]ui\b/, domain: 'design' },
  { pattern: /\bml\b|\bai[-_]\b|\bllm\b|\bembedding\b|\brag\b/, domain: 'ai' },
  { pattern: /\barticle\b|\bwriting\b|\bdocx?\b|\bpdf\b|\bpptx?\b|\bxlsx?\b/, domain: 'documentation' },
  { pattern: /\barchitect\b|\bclean[-_]arch|\bdomain[-_]driven\b|\bsystem[-_]design\b/, domain: 'architecture' },
  { pattern: /\bgit[-_]\b|\bworktree\b|\bbranch\b/, domain: 'vcs' },
  { pattern: /\bschedul\b|\bcron\b|\bautomat/, domain: 'automation' },
  { pattern: /\bbrainstorm\b|\bideation\b/, domain: 'workflow' },
];

// File extension to skill mapping for onFileType
const FILE_TYPE_SKILLS = {
  'api-design': ['openapi', 'swagger', 'api'],
  'docker': ['dockerfile', 'docker-compose'],
  'terraform': ['tf', 'tfvars'],
  'kubernetes': ['yaml', 'yml'],
  'react-patterns': ['tsx', 'jsx'],
  'python-patterns': ['py'],
  'flask-patterns': ['py'],
  'django-patterns': ['py'],
  'golang-patterns': ['go'],
  'golang-testing': ['go'],
  'swift-patterns': ['swift'],
  'typescript-patterns': ['ts', 'tsx'],
};

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const yaml = match[1];
  const result = {};

  // Simple YAML parser for flat + nested metadata
  let currentKey = null;
  let inMetadata = false;

  for (const line of yaml.split('\n')) {
    const topLevel = line.match(/^(\w[\w-]*)\s*:\s*(.*)$/);
    if (topLevel) {
      const [, key, value] = topLevel;
      if (key === 'metadata') {
        inMetadata = true;
        result.metadata = result.metadata || {};
        continue;
      }
      inMetadata = false;
      // Remove surrounding quotes
      result[key] = value.replace(/^["']|["']$/g, '').trim();
      continue;
    }

    if (inMetadata) {
      const nested = line.match(/^\s{2,}(\w[\w-]*)\s*:\s*(.*)$/);
      if (nested) {
        const [, key, value] = nested;
        result.metadata[key] = value.replace(/^["']|["']$/g, '').trim();
      }
    }
  }

  return result;
}

function extractActivationSection(content) {
  // Look for "When to Activate", "When to Use", "Activation" sections
  const pattern = /##\s+(?:When to (?:Activate|Use)|Activation|Use Cases|Quand utiliser)\s*\n([\s\S]*?)(?=\n##\s|\n---|\z)/i;
  const match = content.match(pattern);
  if (match) {
    const bullets = match[1].match(/^[-*]\s+(.+)$/gm) || [];
    if (bullets.length > 0) {
      return bullets.map(b => b.replace(/^[-*]\s+/, '').trim().toLowerCase());
    }
  }

  // FALLBACK: Extract intents from other common sections when "When to Activate" is missing.
  // Try "Examples", "Usage", "Overview" sections for bullet points with action verbs.
  const fallbackSections = [
    /##\s+(?:Examples?|Usage|Exemples?)\s*\n([\s\S]*?)(?=\n##\s|\n---|\z)/i,
    /##\s+(?:Overview|Aper[cç]u|Description)\s*\n([\s\S]*?)(?=\n##\s|\n---|\z)/i,
  ];

  for (const fp of fallbackSections) {
    const fm = content.match(fp);
    if (!fm) continue;
    const bullets = fm[1].match(/^[-*]\s+(.+)$/gm) || [];
    if (bullets.length > 0) {
      return bullets
        .map(b => b.replace(/^[-*]\s+/, '').trim().toLowerCase())
        .filter(b => b.length >= 10 && b.length <= 150)
        .slice(0, 5);
    }
  }

  // LAST RESORT: Synthesize intents from frontmatter description
  // by splitting on common delimiters (commas, semicolons, "or")
  return [];
}

/**
 * Truncate description at a sentence boundary, not mid-word.
 * Prefers to end at a period, closing paren, or exclamation mark.
 */
function truncateDescription(description, maxLen) {
  if (!description || description.length <= maxLen) return description;

  // Find the last sentence boundary before maxLen
  const truncated = description.slice(0, maxLen);
  const lastPeriod = truncated.lastIndexOf('.');
  const lastExcl = truncated.lastIndexOf('!');
  const lastParen = truncated.lastIndexOf(')');
  const bestCut = Math.max(lastPeriod, lastExcl, lastParen);

  if (bestCut > maxLen * 0.5) {
    // Good sentence boundary found in the second half
    return description.slice(0, bestCut + 1);
  }

  // No good boundary: cut at last space to avoid mid-word truncation
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > maxLen * 0.6) {
    return description.slice(0, lastSpace) + '...';
  }

  return truncated + '...';
}

function extractKeywords(text) {
  if (!text) return [];
  // Split on non-alphanumeric, filter stop words, deduplicate
  const words = text.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 3 && !STOP_WORDS.has(w));
  return [...new Set(words)];
}

function extractCompoundTerms(text) {
  if (!text) return [];
  const lower = text.toLowerCase();
  // Extract meaningful multi-word terms
  const terms = [];
  const patterns = [
    /\b(\w+[-\s]\w+(?:[-\s]\w+)?)\b/g, // hyphenated/spaced compounds
  ];
  for (const p of patterns) {
    let m;
    while ((m = p.exec(lower)) !== null) {
      const term = m[1].trim();
      if (term.length >= 5 && !STOP_WORDS.has(term)) {
        // Skip compounds containing stop words (e.g. "use this when", "asked to test")
        const hasStopWord = term.split(/\s+/).some(w => STOP_WORDS.has(w));
        if (!hasStopWord) {
          terms.push(term);
        }
      }
    }
  }
  return [...new Set(terms)];
}

function inferDomain(skillId, description) {
  const combined = `${skillId} ${description}`.toLowerCase();
  for (const { pattern, domain } of DOMAIN_PATTERNS) {
    if (pattern.test(combined)) return domain;
  }
  return 'general';
}

function inferFileTypes(skillId) {
  return FILE_TYPE_SKILLS[skillId] || [];
}

// Infer what skill should logically follow this one in a workflow.
// Based on common development sequences: code → test → review → deploy.
const WORKFLOW_SUCCESSOR_RULES = [
  // Language patterns → language-specific testing
  { match: /django-patterns/, successors: ['django-tdd', 'django-verification'] },
  { match: /flask-patterns/, successors: ['python-testing'] },
  { match: /react-patterns/, successors: ['e2e-testing'] },
  { match: /golang-patterns/, successors: ['golang-testing'] },
  { match: /kotlin-patterns/, successors: ['kotlin-testing'] },
  // Testing → security review
  { match: /-tdd$|-testing$|-verification$/, successors: ['security-review'] },
  // Security → deploy
  { match: /security-review|security-scan/, successors: ['deploy'] },
  // API design → testing
  { match: /api-design/, successors: ['e2e-testing', 'security-review'] },
  // Architecture → implementation patterns
  { match: /clean-architecture|domain-driven-design|system-design/, successors: ['api-design'] },
];

function inferWorkflowSuccessors(skillId, domain) {
  const successors = [];
  for (const rule of WORKFLOW_SUCCESSOR_RULES) {
    if (rule.match.test(skillId)) {
      successors.push(...rule.successors);
    }
  }
  return successors;
}

function processSkill(skillDir) {
  const skillId = path.basename(skillDir);
  const skillFile = path.join(skillDir, 'SKILL.md');

  if (!fs.existsSync(skillFile)) return null;

  const content = fs.readFileSync(skillFile, 'utf8');
  const frontmatter = parseFrontmatter(content);
  const activationBullets = extractActivationSection(content);

  // Extract name and description
  const name = frontmatter.name || skillId;
  const description = frontmatter.description || '';

  // Extract metadata
  const metadata = frontmatter.metadata || {};
  const domain = metadata.domain || inferDomain(skillId, description);
  const explicitTriggers = metadata.triggers || '';

  // Build keywords from multiple sources (skill name parts first for priority).
  // Skill name parts define identity but generic ones still cause collisions.
  // Keep the full skill ID as a compound keyword and filter generic name parts.
  const skillNameParts = skillId.split('-')
    .filter(w => w.length >= 3 && !STOP_WORDS.has(w) && !LOW_SIGNAL_KEYWORDS.has(w));
  // Always include the full skill ID as a compound term (e.g. "react-patterns")
  // — this is specific enough to not collide.
  if (skillId.includes('-')) {
    skillNameParts.unshift(skillId);
  }
  const triggerKeywords = extractKeywords(explicitTriggers)
    .filter(w => !LOW_SIGNAL_KEYWORDS.has(w));
  const descKeywords = extractKeywords(description)
    .filter(w => !LOW_SIGNAL_KEYWORDS.has(w));

  const keywordSources = [
    ...skillNameParts,
    ...triggerKeywords,
    ...descKeywords,
  ];

  // Extract intent phrases from activation section (with fallback)
  const intents = activationBullets.slice(0, 10);

  // Add compound terms from description (compounds survive low-signal filter
  // because multi-word terms like "react-patterns" are specific enough)
  const compounds = extractCompoundTerms(description);

  // Deduplicate and limit keywords
  const allKeywords = [...new Set([...keywordSources, ...compounds])].slice(0, 20);

  // Token cost estimate
  const tokenCost = Math.ceil(content.length / 4);

  // File types this skill is relevant for
  const fileTypes = inferFileTypes(skillId);

  // Workflow successors: what skill should run after this one?
  // Declared via metadata.successors in SKILL.md frontmatter,
  // or inferred from common workflows.
  const declaredSuccessors = metadata.successors
    ? metadata.successors.split(',').map(s => s.trim())
    : [];
  const inferredSuccessors = inferWorkflowSuccessors(skillId, domain);
  const successors = [...new Set([...declaredSuccessors, ...inferredSuccessors])];

  return {
    id: skillId,
    name,
    description: truncateDescription(description, 300),
    domain,
    keywords: allKeywords,
    intents,
    fileTypes,
    tokenCost,
    successors,
    relatedSkills: metadata['related-skills']
      ? metadata['related-skills'].split(',').map(s => s.trim())
      : [],
    path: `skills/${skillId}/SKILL.md`,
  };
}

function main() {
  console.error('[generate-skill-registry] Scanning skills...');

  // Ensure data directory exists
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // Scan all skill directories
  const skillDirs = fs.readdirSync(SKILLS_DIR)
    .map(d => path.join(SKILLS_DIR, d))
    .filter(d => fs.statSync(d).isDirectory());

  const skills = [];
  let processed = 0;
  let skipped = 0;

  for (const dir of skillDirs) {
    const skill = processSkill(dir);
    if (skill) {
      skills.push(skill);
      processed++;
    } else {
      skipped++;
      console.error(`  [SKIP] ${path.basename(dir)} — no SKILL.md`);
    }
  }

  // Sort by ID for deterministic output
  skills.sort((a, b) => a.id.localeCompare(b.id));

  // --- Layer 1: Compact Registry ---
  const registry = {
    version: '1.0.0',
    generated: new Date().toISOString(),
    count: skills.length,
    skills: skills.map(s => ({
      id: s.id,
      description: s.description,
      category: s.domain,
      keywords: s.keywords.slice(0, 8), // Compact: top 8 keywords
    })),
  };

  const registryPath = path.join(DATA_DIR, 'skill-registry.json');
  fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));
  console.error(`[generate-skill-registry] Layer 1 registry: ${registryPath} (${skills.length} skills)`);

  // --- Layer 2: Activation Manifests ---
  const manifests = {
    version: '1.0.0',
    generated: new Date().toISOString(),
    count: skills.length,
    skills: {},
  };

  for (const s of skills) {
    manifests.skills[s.id] = {
      activation: {
        onKeyword: s.keywords,
        onIntent: s.intents,
        onFileType: s.fileTypes,
        onTool: [],
        onProjectType: [],
      },
      category: s.domain,
      token_cost: s.tokenCost,
      priority: 'normal',
      dependencies: s.relatedSkills,
      successors: s.successors || [],
      path: s.path,
    };
  }

  const manifestsPath = path.join(DATA_DIR, 'skill-manifests.json');
  fs.writeFileSync(manifestsPath, JSON.stringify(manifests, null, 2));
  console.error(`[generate-skill-registry] Layer 2 manifests: ${manifestsPath}`);

  // --- Stats ---
  const withTriggers = skills.filter(s => s.keywords.length > 3).length;
  const withIntents = skills.filter(s => s.intents.length > 0).length;
  const totalTokens = skills.reduce((sum, s) => sum + s.tokenCost, 0);
  const truncatedDescs = skills.filter(s => s.description.endsWith('...'));

  console.error(`\n[generate-skill-registry] Summary:`);
  console.error(`  Total skills: ${skills.length}`);
  console.error(`  Skipped: ${skipped}`);
  console.error(`  With rich keywords (>3): ${withTriggers}`);
  console.error(`  With activation intents: ${withIntents}`);
  console.error(`  WITHOUT activation intents: ${skills.length - withIntents}`);
  console.error(`  Truncated descriptions: ${truncatedDescs.length}`);
  console.error(`  Total SKILL.md tokens: ~${totalTokens}`);
  console.error(`  Registry size: ${Math.ceil(JSON.stringify(registry).length / 4)} tokens`);
  console.error(`  Manifests size: ${Math.ceil(JSON.stringify(manifests).length / 4)} tokens`);

  // --- Keyword collision report ---
  const kwCount = {};
  for (const s of skills) {
    for (const kw of s.keywords) {
      kwCount[kw] = (kwCount[kw] || 0) + 1;
    }
  }
  const hotKeywords = Object.entries(kwCount)
    .filter(([, count]) => count >= 10)
    .sort((a, b) => b[1] - a[1]);
  if (hotKeywords.length > 0) {
    console.error(`\n  [WARN] Hot keywords (>=10 skills):`);
    hotKeywords.forEach(([kw, count]) => {
      console.error(`    ${kw.padEnd(25)} ${count} skills`);
    });
  }

  // --- Quality warnings ---
  if (skills.length - withIntents > 20) {
    console.error(`\n  [WARN] ${skills.length - withIntents} skills have NO activation intents.`);
    console.error(`         Add a "## When to Activate" section to their SKILL.md files.`);
  }
  if (truncatedDescs.length > 10) {
    console.error(`  [WARN] ${truncatedDescs.length} skills have truncated descriptions.`);
    console.error(`         Consider shorter frontmatter descriptions (<300 chars).`);
  }
}

main();
