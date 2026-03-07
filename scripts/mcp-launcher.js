#!/usr/bin/env node
/**
 * MCP Launcher — Spawns MCP servers with hidden console windows on Windows.
 *
 * Usage: node mcp-launcher.js <command> [args...]
 * Example: node mcp-launcher.js npx -y @modelcontextprotocol/server-memory
 *
 * On Windows, using `cmd /c npx` opens a visible cmd.exe window.
 * This launcher uses child_process.spawn with windowsHide: true
 * to keep the process invisible.
 *
 * The child process inherits stdio (stdin/stdout/stderr) so MCP
 * protocol communication works transparently.
 */

const { spawn } = require('child_process');
const path = require('path');

const args = process.argv.slice(2);
if (args.length === 0) {
  process.stderr.write('Usage: node mcp-launcher.js <command> [args...]\n');
  process.exit(1);
}

const command = args[0];
const commandArgs = args.slice(1);

// Spawn with hidden window, inheriting stdio for MCP protocol
const child = spawn(command, commandArgs, {
  stdio: 'inherit',
  shell: true,
  windowsHide: true,
  env: process.env
});

child.on('error', (err) => {
  process.stderr.write(`mcp-launcher error: ${err.message}\n`);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.exit(1);
  }
  process.exit(code || 0);
});

// Forward termination signals to child
['SIGINT', 'SIGTERM', 'SIGHUP'].forEach(sig => {
  process.on(sig, () => {
    child.kill(sig);
  });
});
