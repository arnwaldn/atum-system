---
description: "Search and analyze session history — find past work, stats, patterns"
allowed-tools: Read, Bash, Grep, Glob
argument-hint: "[search <keyword> | list [N] | stats | files <path>]"
---

# Session Analyzer: $ARGUMENTS

Analyze session memory files saved by the session-memory hook.

## Session Files Location

Session summaries are stored in:
- **Project-specific**: `~/.claude/projects/<project>/memory/sessions/*.md`
- **Global**: `~/.claude/memory/sessions/*.md`

Scan both locations. Each file is a markdown summary with structured sections:
- Header: date, time, session ID, duration, call count, error count
- Tools: most-used tools
- Files Modified: list of files changed
- Files Read: list of files consulted
- Context: project, stop reason

## Commands

### `search <keyword>` (default if just a keyword is given)
Search across ALL session files for the keyword using Grep.
- Search in file content (not just filenames)
- Show matching sessions with date, relevant excerpt
- Sort by most recent first

### `list [N]`
List the N most recent sessions (default: 10).
- Use Glob to find all session files, sort by date
- For each: show date, duration, tool calls, files modified count
- Format as a compact table

### `stats`
Aggregate statistics across all sessions:
- Total sessions saved
- Date range (oldest → newest)
- Average duration and tool calls per session
- Most frequently modified files (across all sessions)
- Most used tools (across all sessions)
- Error rate (sessions with errors / total)

### `files <path-fragment>`
Find all sessions where a specific file was modified or read.
- Search for the path fragment in "Files Modified" and "Files Read" sections
- Show session date and context for each match

## Output Format

```
SESSION HISTORY — [command]
═══════════════════════════════
[Results formatted as table or list]
═══════════════════════════════
Total: [X sessions found] | Scanned: [Y files]
```

## Notes

- If no sessions are found, explain that the session-memory hook needs to run first
- Session files are auto-generated at session end (Stop hook)
- Files older than 30 days are auto-cleaned
- The hook only saves sessions with 3+ tool calls
