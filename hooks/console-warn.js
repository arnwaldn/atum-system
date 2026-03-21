#!/usr/bin/env node
/**
 * Console.log warning hook (standalone, adapted from ECC)
 * PostToolUse: warns about console.log statements in JS/TS files after edits.
 */
'use strict';
const fs = require('fs');
const MAX_STDIN = 1024 * 1024;
let data = '';

process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => {
  if (data.length < MAX_STDIN) data += chunk.substring(0, MAX_STDIN - data.length);
});

process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);
    const filePath = input.tool_input?.file_path;
    if (filePath && /\.(ts|tsx|js|jsx)$/.test(filePath)) {
      let content;
      try { content = fs.readFileSync(filePath, 'utf8'); } catch { content = null; }
      if (content) {
        const matches = [];
        content.split('\n').forEach((line, idx) => {
          if (/console\.log/.test(line)) matches.push((idx + 1) + ': ' + line.trim());
        });
        if (matches.length > 0) {
          console.error('[Hook] WARNING: console.log found in ' + filePath);
          matches.slice(0, 5).forEach(m => console.error(m));
          console.error('[Hook] Remove console.log before committing');
        }
      }
    }
  } catch {}
  process.stdout.write(data);
  process.exit(0);
});
