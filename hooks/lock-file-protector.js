#!/usr/bin/env node
/**
 * Lock File Protector Hook (PreToolUse: Write|Edit)
 * Blocks direct modifications to dependency lock files.
 * Lock files should only be modified by package managers (npm, yarn, pip, etc.).
 */

const fs = require('fs');
const path = require('path');

const LOCK_FILES = new Set([
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'poetry.lock',
  'Pipfile.lock',
  'Cargo.lock',
  'go.sum',
  'composer.lock',
  'Gemfile.lock',
  'bun.lockb',
  'bun.lock',
  'flake.lock',
  'pubspec.lock',
  'shrinkwrap.yaml',
]);

let data;
try {
  data = JSON.parse(fs.readFileSync(0, 'utf8'));
} catch {
  process.exit(0);
}

const filePath = data.tool_input?.file_path || '';
if (!filePath) {
  process.exit(0);
}

const basename = path.basename(filePath);

if (LOCK_FILES.has(basename)) {
  const manager = {
    'package-lock.json': 'npm install',
    'yarn.lock': 'yarn install',
    'pnpm-lock.yaml': 'pnpm install',
    'poetry.lock': 'poetry lock',
    'Pipfile.lock': 'pipenv lock',
    'Cargo.lock': 'cargo build',
    'go.sum': 'go mod tidy',
    'composer.lock': 'composer install',
    'Gemfile.lock': 'bundle install',
    'bun.lockb': 'bun install',
    'bun.lock': 'bun install',
    'flake.lock': 'nix flake update',
    'pubspec.lock': 'flutter pub get',
    'shrinkwrap.yaml': 'pnpm install',
  }[basename] || 'the appropriate package manager';

  process.stderr.write(`\n🔒 BLOCKED: Lock file protection\n\n`);
  process.stderr.write(`File: ${basename}\n`);
  process.stderr.write(`Lock files must only be modified by their package manager.\n\n`);
  process.stderr.write(`To update this file, run: ${manager}\n`);
  process.stderr.write(`To add/remove a dependency, use the package manager CLI.\n\n`);
  process.exit(2);
}

process.exit(0);
