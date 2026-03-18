#!/usr/bin/env node
/**
 * post-tool-failure-logger.js
 * PostToolUseFailure hook — logs failures AND injects recovery strategies.
 *
 * Instead of just logging, analyzes the failure type and returns
 * additionalContext with a concrete recovery strategy so Claude
 * can auto-recover instead of asking the user or giving up.
 *
 * Matcher: * (fires only on tool errors)
 * ALWAYS exits 0 (never blocks)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const LOG_FILE = path.join(os.tmpdir(), 'claude-tool-failures.json');

const RECOVERY_STRATEGIES = {
  // ── Write / Edit failures ──
  'Edit': [
    {
      pattern: /old_string.*not found|not unique|no match/i,
      strategy: 'RECOVERY: The file content changed since you last read it. Read the file again with the Read tool, then retry the Edit with the correct old_string. Do NOT guess — use the exact text from the fresh read.'
    },
    {
      pattern: /permission denied|access denied|EPERM|EACCES/i,
      strategy: 'RECOVERY: File is read-only or locked. Check if another process holds a lock. On Windows, try: python -c "import os,stat; os.chmod(path, stat.S_IWRITE)" then retry.'
    },
    {
      pattern: /no such file|ENOENT/i,
      strategy: 'RECOVERY: File does not exist at this path. Use Glob to find the correct path, or use Write to create the file instead of Edit.'
    }
  ],
  'Write': [
    {
      pattern: /permission denied|access denied|EPERM|EACCES/i,
      strategy: 'RECOVERY: Cannot write to this path. Check directory permissions. If the parent directory does not exist, create it first with Bash: mkdir -p "parent/dir"'
    },
    {
      pattern: /ENOSPC|no space/i,
      strategy: 'RECOVERY: Disk is full. Alert the user — this requires manual intervention to free space.'
    }
  ],
  // ── Bash failures ──
  'Bash': [
    {
      pattern: /timed? ?out|timeout|ETIMEDOUT/i,
      strategy: 'RECOVERY: Command timed out. Break it into smaller steps, or increase timeout with the timeout parameter. For long-running builds, use run_in_background: true.'
    },
    {
      pattern: /command not found|is not recognized/i,
      strategy: 'RECOVERY: Tool not installed. Check if it needs to be installed (winget/npm/pip). Check ~/bin/ for wrappers. Try `which <command>` or `where <command>` to locate it.'
    },
    {
      pattern: /permission denied|EACCES|access is denied/i,
      strategy: 'RECOVERY: Permission denied on command. Do NOT use sudo (it is in the deny list). Check file permissions, or use an alternative approach that does not require elevation.'
    },
    {
      pattern: /ECONNREFUSED|connection refused/i,
      strategy: 'RECOVERY: Service not running. Check if the target service/server needs to be started first (e.g., Docker Desktop, dev server, database).'
    },
    {
      pattern: /MODULE_NOT_FOUND|Cannot find module/i,
      strategy: 'RECOVERY: Missing Node.js module. Run npm install or check if the import path is correct. For global tools, use npx instead.'
    },
    {
      pattern: /flutter|pub get|dart/i,
      strategy: 'RECOVERY: Flutter/Dart error. Try: flutter pub get, flutter clean, then flutter pub get again. Check pubspec.yaml for version conflicts.'
    },
    {
      pattern: /pip|venv|virtualenv|ModuleNotFoundError/i,
      strategy: 'RECOVERY: Python environment error. Activate the virtual environment first, or create one: python -m venv .venv && source .venv/bin/activate (or .venv/Scripts/activate on Windows). Then pip install -r requirements.txt.'
    },
    {
      pattern: /go mod|go build|cannot find package/i,
      strategy: 'RECOVERY: Go module error. Try: go mod tidy, then go mod download. If the module is missing, check go.mod for the correct import path.'
    }
  ],
  // ── Read failures ──
  'Read': [
    {
      pattern: /no such file|ENOENT|does not exist/i,
      strategy: 'RECOVERY: File not found. Use Glob with a pattern to find the correct path. The file may have a different name or be in a different directory.'
    }
  ],
  // ── MCP tool failures ──
  'mcp__': [
    {
      pattern: /ECONNREFUSED|connection refused|server not running/i,
      strategy: 'RECOVERY: MCP server is not running or unreachable. Check if the server process is alive. Try restarting Claude Code if the MCP server should be auto-started.'
    },
    {
      pattern: /auth|unauthorized|403|401|token expired/i,
      strategy: 'RECOVERY: Authentication failed for MCP server. The token or credentials may have expired. Ask the user to re-authenticate or check the MCP server configuration.'
    },
    {
      pattern: /rate limit|429|too many requests/i,
      strategy: 'RECOVERY: Rate limited by external service. Wait a moment before retrying, or use an alternative tool/approach to get the same information.'
    },
    {
      pattern: /MCP error -32602|invalid params/i,
      strategy: 'RECOVERY: Invalid parameters sent to MCP tool. Re-read the tool description carefully and correct the input format. Check required vs optional parameters.'
    }
  ]
};

// ── Circular fix detection (Jaccard similarity) ──

const CIRCULAR_FIX_CONFIG = {
  windowSize: 3,        // Compare last N attempts
  similarityThreshold: 0.3, // 30% keyword overlap = circular
  minSimilarCount: 2,   // Need 2 of 3 similar to trigger
  maxAttemptsPerError: 5
};

function extractKeywords(text) {
  if (!text) return new Set();
  const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
    'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'shall', 'can', 'to', 'of', 'in', 'for', 'on', 'with',
    'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after',
    'and', 'but', 'or', 'nor', 'not', 'no', 'so', 'if', 'then', 'than', 'that', 'this']);
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/);
  return new Set(words.filter(w => w.length > 2 && !stopWords.has(w)));
}

function jaccardSimilarity(set1, set2) {
  if (set1.size === 0 && set2.size === 0) return 1;
  if (set1.size === 0 || set2.size === 0) return 0;
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return intersection.size / union.size;
}

function detectCircularFix(entries, toolName) {
  const recentForTool = entries
    .filter(e => e.tool === toolName)
    .slice(-CIRCULAR_FIX_CONFIG.windowSize);

  if (recentForTool.length < CIRCULAR_FIX_CONFIG.minSimilarCount) return false;

  const keywordSets = recentForTool.map(e => extractKeywords(e.error));
  let similarPairs = 0;

  for (let i = 0; i < keywordSets.length; i++) {
    for (let j = i + 1; j < keywordSets.length; j++) {
      if (jaccardSimilarity(keywordSets[i], keywordSets[j]) >= CIRCULAR_FIX_CONFIG.similarityThreshold) {
        similarPairs++;
      }
    }
  }

  return similarPairs >= CIRCULAR_FIX_CONFIG.minSimilarCount;
}

function findRecoveryStrategy(toolName, errorMsg) {
  // Try exact tool name match first
  const strategies = RECOVERY_STRATEGIES[toolName];
  if (strategies) {
    for (const s of strategies) {
      if (s.pattern.test(errorMsg)) return s.strategy;
    }
  }

  // Try prefix match (for MCP tools like mcp__github__create_issue)
  for (const [prefix, strategies] of Object.entries(RECOVERY_STRATEGIES)) {
    if (toolName.startsWith(prefix) && prefix !== toolName) {
      for (const s of strategies) {
        if (s.pattern.test(errorMsg)) return s.strategy;
      }
    }
  }

  // Generic fallback for repeated failures
  return null;
}

function getRepeatCount(entries, toolName, errorPattern) {
  if (!entries.length) return 0;
  let count = 0;
  // Count recent consecutive failures of the same tool
  for (let i = entries.length - 1; i >= Math.max(0, entries.length - 5); i--) {
    if (entries[i].tool === toolName) count++;
    else break;
  }
  return count;
}

function main() {
  try {
    const raw = fs.readFileSync(0, 'utf8');
    if (!raw.trim()) process.exit(0);

    const data = JSON.parse(raw);
    const toolError = data.error || data.tool_error || '';
    if (!toolError || toolError.trim() === '') process.exit(0);

    const toolInput = data.tool_input || {};
    const toolName = data.tool_name || 'unknown';
    const filePath = toolInput.file_path || toolInput.command || null;

    // ── Log the failure ──
    const entry = {
      timestamp: new Date().toISOString(),
      tool: toolName,
      error: toolError.substring(0, 500),
      file_path: filePath,
      session_id: process.env.CLAUDE_SESSION_ID || null
    };

    let entries = [];
    if (fs.existsSync(LOG_FILE)) {
      try {
        entries = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
        if (!Array.isArray(entries)) entries = [];
      } catch { entries = []; }
    }
    if (entries.length >= 500) entries = entries.slice(-400);
    entries.push(entry);
    fs.writeFileSync(LOG_FILE, JSON.stringify(entries, null, 2), 'utf8');

    // ── Find recovery strategy ──
    const strategy = findRecoveryStrategy(toolName, toolError);
    const repeatCount = getRepeatCount(entries, toolName, toolError);

    let context = '';

    // ── Check for circular fix pattern ──
    const isCircular = detectCircularFix(entries, toolName);

    if (isCircular) {
      context = `[CIRCULAR FIX DETECTED] Tool "${toolName}" keeps failing with similar errors. The same approach has been tried ${repeatCount}+ times with 30%+ keyword overlap. STOP retrying. Change strategy entirely — use a DIFFERENT tool, DIFFERENT approach, or ask the user. Do NOT retry the same pattern.`;
    } else if (repeatCount >= 3) {
      context = `CRITICAL: Tool "${toolName}" has failed ${repeatCount} times consecutively. STOP retrying the same approach. Change strategy entirely — use a different tool, different path, or ask the user for guidance.`;
    } else if (strategy) {
      context = strategy;
    } else {
      context = `Tool "${toolName}" failed. Error: ${toolError.substring(0, 200)}. Analyze the error, fix the root cause, then retry. If this fails again, try an alternative approach.`;
    }

    // Add file context if available
    if (filePath && !context.includes(filePath)) {
      context += ` | File: ${filePath}`;
    }

    // ── Return recovery context ──
    const output = {
      hookSpecificOutput: {
        hookEventName: 'PostToolUseFailure',
        additionalContext: context
      }
    };
    console.log(JSON.stringify(output));

  } catch {
    // Never fail
  }
  process.exit(0);
}

main();
