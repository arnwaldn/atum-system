#!/usr/bin/env node
/**
 * PreToolUse Context Hook
 *
 * Injects relevant coding conventions and patterns when Claude writes/edits files,
 * based on file extension and directory path.
 *
 * Hook type: PreToolUse
 * Matcher: Write|Edit
 * Input: {"tool_name": "Write", "tool_input": {"file_path": "..."}} on stdin
 * Output: hookSpecificOutput.additionalContext with relevant skill content
 */
'use strict';

const fs = require('fs');
const path = require('path');

const PLUGIN_ROOT = process.env.CLAUDE_PLUGIN_ROOT || path.resolve(__dirname, '..');
const SKILLS_DIR = path.join(PLUGIN_ROOT, 'skills');

// Max chars to inject per skill (~500 tokens)
const MAX_CHARS_PER_SKILL = 2000;
const MAX_SKILLS = 2;

// File extension → skill mappings
const EXT_SKILLS = {
  '.py': ['python-patterns'],
  '.ts': ['coding-standards'],
  '.tsx': ['frontend-patterns'],
  '.jsx': ['frontend-patterns'],
  '.js': ['coding-standards'],
  '.go': ['golang-patterns'],
  '.swift': ['swiftui-patterns'],
  '.java': ['springboot-patterns'],
  '.kt': ['springboot-patterns'],
  '.tf': [],
  '.hcl': [],
};

// Directory path patterns → skill overrides (checked in order, first match wins)
const PATH_SKILLS = [
  { pattern: /\bflask\b|\/flask\//, skills: ['flask-patterns'] },
  { pattern: /\bdjango\b|\/django\//, skills: ['django-patterns'] },
  { pattern: /\bspring\b|\/spring\//, skills: ['springboot-patterns'] },
  { pattern: /\/api\/|\/routes\/|\/endpoints\//, skills: ['api-design'] },
  { pattern: /\/test[s]?\/|\.test\.|\.spec\.|_test\.|test_|__tests__/, skills: ['test-driven-development'] },
  { pattern: /\/component[s]?\/|\/ui\//, skills: ['frontend-patterns'] },
  { pattern: /docker|Dockerfile|compose/, skills: ['docker-patterns'] },
  { pattern: /\.swift$/, skills: ['swiftui-patterns'] },
];

// Cache loaded skill content
const cache = new Map();

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    return '{}';
  }
}

function loadSkillSummary(skillId) {
  if (cache.has(skillId)) return cache.get(skillId);

  const skillPath = path.join(SKILLS_DIR, skillId, 'SKILL.md');
  try {
    let content = fs.readFileSync(skillPath, 'utf8');

    // Take only the first section (frontmatter + key rules)
    if (content.length > MAX_CHARS_PER_SKILL) {
      const breakPoint = content.lastIndexOf('\n## ', MAX_CHARS_PER_SKILL);
      if (breakPoint > MAX_CHARS_PER_SKILL * 0.4) {
        content = content.slice(0, breakPoint) + '\n[...truncated]';
      } else {
        content = content.slice(0, MAX_CHARS_PER_SKILL) + '\n[...truncated]';
      }
    }

    cache.set(skillId, content);
    return content;
  } catch {
    return null;
  }
}

function resolveSkills(filePath) {
  if (!filePath) return [];

  const ext = path.extname(filePath).toLowerCase();
  const fullPath = filePath.toLowerCase();
  const skillIds = new Set();

  // Check path patterns first (higher priority)
  for (const { pattern, skills } of PATH_SKILLS) {
    if (pattern.test(fullPath)) {
      for (const s of skills) skillIds.add(s);
      break; // First match wins for path patterns
    }
  }

  // Then add extension-based skills
  const extSkills = EXT_SKILLS[ext];
  if (extSkills) {
    for (const s of extSkills) skillIds.add(s);
  }

  return [...skillIds].slice(0, MAX_SKILLS);
}

try {
  const stdinData = readStdin();
  const input = JSON.parse(stdinData);

  const toolInput = input.tool_input || {};
  const filePath = toolInput.file_path || toolInput.path || '';

  if (!filePath) {
    process.stdout.write('{}');
    process.exit(0);
  }

  const skillIds = resolveSkills(filePath);

  if (skillIds.length === 0) {
    process.stdout.write('{}');
    process.exit(0);
  }

  const parts = [`[PreToolUse Conventions: ${skillIds.join(', ')} for ${path.basename(filePath)}]\n`];

  for (const id of skillIds) {
    const content = loadSkillSummary(id);
    if (content) {
      parts.push(`--- ${id} ---`);
      parts.push(content);
    }
  }

  if (parts.length > 1) {
    const output = {
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        additionalContext: parts.join('\n'),
      },
    };
    process.stdout.write(JSON.stringify(output));
    console.error(`[pretool-context] Injected: ${skillIds.join(', ')} for ${path.basename(filePath)}`);
  } else {
    process.stdout.write('{}');
  }
} catch (err) {
  console.error(`[pretool-context] Error: ${err.message}`);
  process.stdout.write('{}');
}

process.exit(0);
