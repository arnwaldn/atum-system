---
description: "Manage scheduled automated tasks — create, list, run, remove, monitor"
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, AskUserQuestion
argument-hint: "[init | add | list | run <id> | logs [id] | remove <id> | enable <id> | disable <id> | status]"
---

# Scheduler: $ARGUMENTS

Manage the claude-scheduler system for automated task execution.

## Architecture

- **Daemon**: Node.js process managed by PM2 (`claude-scheduler`)
- **Tasks**: JSON files in `~/.claude/schedules/<id>.json`
- **History**: SQLite database at `~/.claude/schedules/.history/runs.db`
- **HTTP API**: `http://127.0.0.1:4820` (status, trigger, reload, webhook)

## Command Routing

Parse `$ARGUMENTS` and execute the matching phase:

### `init` — First-time setup

1. Check if `~/.claude/scheduler/` exists with `package.json`
2. If not installed:
   ```bash
   cd ~/.claude/scheduler && npm install
   ```
3. Build TypeScript:
   ```bash
   cd ~/.claude/scheduler && npm run build
   ```
4. Start with PM2:
   ```bash
   pm2 start ~/.claude/scheduler/dist/daemon.js --name claude-scheduler --cwd ~/.claude/scheduler
   pm2 save
   ```
5. Verify:
   ```bash
   curl -s http://127.0.0.1:4820/status
   ```
6. Show confirmation with task count

### `add` — Create a new scheduled task

Use AskUserQuestion to collect task details interactively:

1. **id**: kebab-case identifier (e.g., `daily-security-audit`)
2. **name**: Human-readable name
3. **trigger type**: cron / file-change / git-push / webhook / once
4. **trigger details**:
   - cron: 5-field expression (e.g., `0 8 * * 1-5` = weekdays at 8AM)
   - file-change: glob pattern + debounce (default 5s)
   - once: ISO datetime
5. **prompt**: The Claude prompt or /command to execute
6. **cwd**: Working directory (default: current)
7. **model**: opus / sonnet / haiku (default: sonnet)
8. **notifications**: on success / failure / always / never + email
9. **timeout**: seconds (default: 300)
10. **retries**: 0-5 (default: 0)

Then write the JSON file to `~/.claude/schedules/<id>.json` with the collected values plus defaults:
```json
{
  "enabled": true,
  "concurrencyGroup": "default",
  "tags": [],
  "runCount": 0,
  "lastRunAt": null,
  "lastRunStatus": null,
  "createdAt": "<now>",
  "updatedAt": "<now>"
}
```

After creation, hot-reload the daemon:
```bash
curl -s -X POST http://127.0.0.1:4820/reload
```

### `list` — Show all scheduled tasks

Read all `~/.claude/schedules/*.json` files (excluding dotfiles and .history/).
Display as a formatted table:

```
SCHEDULED TASKS
======================================================================
ID                     | Trigger       | Status  | Last Run    | Runs
-----------------------+---------------+---------+-------------+-----
daily-health-check     | 0 8 * * 1-5   | enabled | 2h ago (OK) | 47
weekly-security-audit  | 0 10 * * 0    | enabled | 3d ago (OK) | 12
on-push-lint           | file-change   | enabled | 15m ago     | 203
one-time-migration     | once (Mar 15) | disabled| -           | 0
======================================================================
Total: 4 tasks (3 enabled, 1 disabled)
```

### `run <id>` — Manually trigger a task

```bash
curl -s -X POST http://127.0.0.1:4820/trigger/<id>
```

Show the response. Then poll logs for result:
```bash
curl -s "http://127.0.0.1:4820/runs?taskId=<id>&limit=1"
```

### `logs [id]` — View execution history

If `id` provided — show last 10 runs for that task.
If no `id` — show last 20 runs across all tasks.

Query via:
```bash
curl -s "http://127.0.0.1:4820/runs?taskId=<id>&limit=10"
```

Display as table:
```
RUN HISTORY: daily-health-check
===========================================================
Time          | Status  | Duration | Triggered By
--------------+---------+----------+-------------
Mar 01 08:00  | SUCCESS | 45s      | cron
Feb 28 08:00  | SUCCESS | 52s      | cron
Feb 27 08:01  | FAILURE | 120s     | cron
Feb 27 08:30  | SUCCESS | 38s      | manual
===========================================================
```

### `remove <id>` — Delete a task

1. Confirm with user: "Delete task `<id>` (<name>)?"
2. Delete `~/.claude/schedules/<id>.json`
3. Reload daemon: `curl -s -X POST http://127.0.0.1:4820/reload`

### `enable <id>` / `disable <id>` — Toggle task

1. Read `~/.claude/schedules/<id>.json`
2. Set `"enabled": true/false` and update `"updatedAt"`
3. Save file
4. Reload daemon: `curl -s -X POST http://127.0.0.1:4820/reload`

### `status` — Daemon health

1. PM2 status:
   ```bash
   pm2 describe claude-scheduler 2>/dev/null | head -20
   ```
2. Daemon status:
   ```bash
   curl -s http://127.0.0.1:4820/status
   ```
3. Show: uptime, task count, scheduled count, port, PID

## Cron Quick Reference

| Expression     | Meaning                    |
|----------------|----------------------------|
| `* * * * *`    | Every minute               |
| `0 * * * *`    | Every hour                 |
| `0 8 * * 1-5`  | Weekdays at 8:00 AM       |
| `0 10 * * 0`   | Sunday at 10:00 AM        |
| `30 7 * * *`   | Daily at 7:30 AM          |
| `0 */6 * * *`  | Every 6 hours             |
| `0 9 1 * *`    | First day of month at 9AM |

Format: `minute hour day-of-month month day-of-week`
