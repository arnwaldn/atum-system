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
  if (!match) return [];

  // Extract bullet points
  const bullets = match[1].match(/^[-*]\s+(.+)$/gm) || [];
  return bullets.map(b => b.replace(/^[-*]\s+/, '').trim().toLowerCase());
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

  // Build keywords from multiple sources (skill name parts first for priority)
  const skillNameParts = skillId.split('-').filter(w => w.length >= 3 && !STOP_WORDS.has(w));
  const keywordSources = [
    ...skillNameParts,
    ...extractKeywords(explicitTriggers),
    ...extractKeywords(description),
  ];

  // Extract intent phrases from activation section
  const intents = activationBullets.slice(0, 10); // Cap at 10

  // Add compound terms from description
  const compounds = extractCompoundTerms(description);

  // Deduplicate and limit keywords
  const allKeywords = [...new Set([...keywordSources, ...compounds])].slice(0, 20);

  // Token cost estimate
  const tokenCost = Math.ceil(content.length / 4);

  // File types this skill is relevant for
  const fileTypes = inferFileTypes(skillId);

  return {
    id: skillId,
    name,
    description: description.slice(0, 200), // Cap description length
    domain,
    keywords: allKeywords,
    intents,
    fileTypes,
    tokenCost,
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

  console.error(`\n[generate-skill-registry] Summary:`);
  console.error(`  Total skills: ${skills.length}`);
  console.error(`  Skipped: ${skipped}`);
  console.error(`  With rich keywords (>3): ${withTriggers}`);
  console.error(`  With activation intents: ${withIntents}`);
  console.error(`  Total SKILL.md tokens: ~${totalTokens}`);
  console.error(`  Registry size: ${Math.ceil(JSON.stringify(registry).length / 4)} tokens`);
  console.error(`  Manifests size: ${Math.ceil(JSON.stringify(manifests).length / 4)} tokens`);
}

main();
