#!/usr/bin/env node
/**
 * worktree-setup.js
 * PostToolUse hook — sets up worktree environment after creation
 * Matcher: Bash
 * Detects "git worktree add" commands or worktree mentions in output
 * ALWAYS exits 0 (never blocks)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Generate a deterministic port (3000-9999) from worktree name
 */
function portFromName(name) {
  const hash = crypto.createHash('md5').update(name).digest('hex');
  const num = parseInt(hash.substring(0, 8), 16);
  return 3000 + (num % 7000); // Range: 3000-9999
}

/**
 * Try to extract worktree path from command or output
 */
function extractWorktreePath(command, output) {
  // Match: git worktree add <path> [branch]
  const addMatch = command.match(/git\s+worktree\s+add\s+(?:--[^\s]+\s+)*"?([^\s"]+)"?/);
  if (addMatch) {
    return addMatch[1];
  }

  // Check output for worktree path
  if (output) {
    const outputMatch = output.match(/Preparing worktree.*?['"]([^'"]+)['"]/);
    if (outputMatch) {
      return outputMatch[1];
    }
  }

  return null;
}

function main() {
  try {
    const raw = fs.readFileSync(0, 'utf8');
    if (!raw.trim()) {
      process.exit(0);
    }

    const data = JSON.parse(raw);
    const toolInput = data.tool_input || {};
    const command = toolInput.command || '';
    const toolOutput = data.tool_output || '';

    // Check if this is a worktree operation
    const isWorktreeCommand = /git\s+worktree\s+add/.test(command);
    const isWorktreeOutput = /worktree/.test(toolOutput);

    if (!isWorktreeCommand && !isWorktreeOutput) {
      process.exit(0);
    }

    const worktreePath = extractWorktreePath(command, toolOutput);
    if (!worktreePath) {
      process.exit(0);
    }

    const worktreeName = path.basename(worktreePath);
    const setupInfo = [];

    setupInfo.push(`[worktree-setup] Worktree detected: ${worktreeName}`);

    // Check for .env.example → copy to .env
    const envExample = path.join(worktreePath, '.env.example');
    const envFile = path.join(worktreePath, '.env');
    if (fs.existsSync(envExample) && !fs.existsSync(envFile)) {
      try {
        fs.copyFileSync(envExample, envFile);
        setupInfo.push(`[worktree-setup] Copied .env.example -> .env`);
      } catch {
        setupInfo.push(`[worktree-setup] WARNING: Failed to copy .env.example -> .env`);
      }
    }

    // Check for package.json → suggest npm install
    const packageJson = path.join(worktreePath, 'package.json');
    if (fs.existsSync(packageJson)) {
      setupInfo.push(`[worktree-setup] package.json found — run: npm install`);
    }

    // Assign deterministic port
    const port = portFromName(worktreeName);
    setupInfo.push(`[worktree-setup] Assigned port: ${port} (based on worktree name hash)`);

    // Output setup info to stderr
    process.stderr.write(setupInfo.join('\n') + '\n');
  } catch {
    // Never fail — silently exit
  }

  process.exit(0);
}

main();
