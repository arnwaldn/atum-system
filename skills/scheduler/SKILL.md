---
name: scheduler
description: "Autonomous task scheduling from natural language. When the user describes ANY recurring, scheduled, periodic, or event-triggered task in natural language — in French or English — parse their intent and autonomously create the scheduled task. Triggers: every day, every week, tous les jours, chaque lundi, each morning, à 9h, at midnight, quand je push, when files change, automatise, schedule, cron, tâche planifiée, programmée, récurrent, périodique, surveille, monitor, vérifie régulièrement, check daily, run weekly, lance tous les, exécute chaque."
license: MIT
metadata:
  author: arnaud
  version: "2.0.0"
  domain: devops
  triggers: every day, every week, tous les jours, chaque lundi, each morning, à 9h, at midnight, quand je push, when files change, automatise, schedule, cron, tâche planifiée, programmée, récurrent, périodique, surveille, monitor, vérifie régulièrement, check daily, run weekly, lance tous les, exécute chaque, tous les matins, chaque semaine, every monday, daily, weekly, monthly, hourly, remind me, rappelle-moi, on file change, after push, au démarrage, régulièrement
  role: specialist
  scope: implementation
  output-format: code
  related-skills: sre-engineer, devops-engineer
---

# Autonomous Task Scheduler

You AUTONOMOUSLY create scheduled tasks from natural language requests. The user describes what they want in plain French or English — you parse, create, deploy, and confirm. NO interactive Q&A unless something is genuinely ambiguous.

## CRITICAL: Autonomous Flow

When the user says something like scheduling intent, follow this exact flow:

### Step 1: Parse natural language → task definition

Extract from the user's message:
- **What** (prompt): the action to perform → map to existing /commands or write a free-text prompt
- **When** (trigger): time/frequency/event → convert to cron expression or event config
- **Where** (cwd): target project/directory → infer from context or use current
- **How important** (notify): implied urgency → set notification config
- **How heavy** (model): complexity → choose haiku/sonnet/opus

### Step 2: Write JSON task file

Create `~/.claude/schedules/<id>.json` with all fields populated. Use smart defaults for anything not explicitly mentioned.

### Step 3: Reload daemon

```bash
curl -s -X POST http://127.0.0.1:4820/reload
```

### Step 4: Confirm to user

Show a concise summary: task name, schedule (human-readable), what it does, notifications.

## Natural Language → Cron Conversion Table

### French patterns
| User says | Cron expression | Human readable |
|-----------|----------------|----------------|
| "tous les jours à 8h" | `0 8 * * *` | Daily at 8:00 AM |
| "chaque matin" / "tous les matins" | `0 7 * * *` | Daily at 7:00 AM |
| "chaque soir" / "tous les soirs" | `0 19 * * *` | Daily at 7:00 PM |
| "tous les lundis" / "chaque lundi" | `0 9 * * 1` | Monday at 9:00 AM |
| "en semaine" / "jours ouvrés" | `0 8 * * 1-5` | Weekdays at 8:00 AM |
| "le week-end" | `0 10 * * 6,0` | Sat+Sun at 10:00 AM |
| "toutes les heures" | `0 * * * *` | Every hour |
| "toutes les 30 minutes" | `*/30 * * * *` | Every 30 minutes |
| "chaque semaine" / "une fois par semaine" | `0 9 * * 1` | Monday at 9:00 AM |
| "chaque mois" / "tous les mois" | `0 9 1 * *` | 1st of month at 9:00 AM |
| "le 1er et le 15" | `0 9 1,15 * *` | 1st and 15th at 9:00 AM |
| "le dimanche" | `0 10 * * 0` | Sunday at 10:00 AM |
| "le vendredi soir" | `0 18 * * 5` | Friday at 6:00 PM |

### English patterns
| User says | Cron expression |
|-----------|----------------|
| "every day at 9am" | `0 9 * * *` |
| "every morning" | `0 7 * * *` |
| "every weekday" | `0 8 * * 1-5` |
| "every Monday" | `0 9 * * 1` |
| "every hour" | `0 * * * *` |
| "twice a day" | `0 8,18 * * *` |
| "every 15 minutes" | `*/15 * * * *` |
| "monthly" | `0 9 1 * *` |
| "at midnight" | `0 0 * * *` |

### Event patterns (FR + EN)
| User says | Trigger type |
|-----------|-------------|
| "quand je push" / "after push" / "on push" | `event: git-push` |
| "quand un fichier change" / "on file change" | `event: file-change` |
| "quand je modifie src/" / "when src/ changes" | `event: file-change, pattern: src/**/*` |
| "demain à 14h" / "tomorrow at 2pm" | `once: <computed datetime>` |
| "dans 2 heures" / "in 2 hours" | `once: <computed datetime>` |

## Smart Defaults

When not specified by the user, apply these defaults:

| Field | Default logic |
|-------|--------------|
| `id` | Generate from task description: kebab-case, max 30 chars |
| `model` | `haiku` for monitoring/checks, `sonnet` for audits/reviews/code work |
| `timeoutSeconds` | 180 for quick checks, 600 for audits, 900 for heavy work |
| `maxBudgetUsd` | 1.00 for haiku tasks, 5.00 for sonnet, 10.00 for opus (context cache ~$0.25 minimum) |
| `notify.on` | `["failure"]` for routine tasks, `["always"]` for important/weekly tasks |
| `notify.email` | `arnaud.porcel@gmail.com` |
| `notify.includeOutput` | `true` |
| `retries` | 1 for quick tasks, 0 for heavy tasks |
| `concurrencyGroup` | `"default"` for light tasks, `"heavy"` for audits/reviews |
| `cwd` | Current project if in a project, `C:/Users/arnau` otherwise |
| `worktree` | `false` by default |

## Prompt Mapping: User Intent → Claude Command

| User intent (FR/EN) | Mapped prompt |
|---------------------|---------------|
| "audit sécurité" / "security audit" | `/security-audit all` |
| "vérifier la santé" / "health check" | `/health` |
| "vérifier les deps" / "check dependencies" | `Check for outdated or vulnerable dependencies using npm audit and npm outdated` |
| "lint" / "vérifier le code" | `Run linter and fix any issues found` |
| "tests" / "lance les tests" | `Run the full test suite and report results` |
| "review le code" / "code review" | `/review-fix` |
| "status du projet" / "project status" | `/status --full` |
| "nettoyer le dead code" | `Identify and remove dead code, unused imports, and unused variables` |
| "mettre à jour les deps" | `Update all dependencies to their latest compatible versions, run tests after` |
| "résumé git" / "git summary" | `Summarize the git log from the last 7 days: commits, files changed, contributors` |
| "backup config" | `Verify that claude-code-config backup is in sync with current settings` |

## Examples of Autonomous Parsing

### Example 1: "Tous les matins, vérifie que mon projet tourne bien"
```json
{
  "id": "morning-health-check",
  "name": "Morning Health Check",
  "trigger": { "type": "cron", "cron": "0 7 * * *" },
  "prompt": "/health",
  "cwd": "<current project or home>",
  "model": "haiku",
  "maxBudgetUsd": 0.10,
  "timeoutSeconds": 120,
  "notify": { "on": ["failure"], "email": "arnaud.porcel@gmail.com", "includeOutput": true },
  "enabled": true, "retries": 1, "retryDelaySeconds": 30,
  "concurrencyGroup": "default", "tags": ["health", "daily"]
}
```

### Example 2: "Chaque vendredi, fais une review de sécurité sur mon API et envoie-moi le résultat"
```json
{
  "id": "friday-security-review",
  "name": "Friday Security Review",
  "trigger": { "type": "cron", "cron": "0 9 * * 5" },
  "prompt": "/security-audit all",
  "cwd": "<API project path>",
  "model": "sonnet",
  "maxBudgetUsd": 0.50,
  "timeoutSeconds": 600,
  "notify": { "on": ["always"], "email": "arnaud.porcel@gmail.com", "includeOutput": true },
  "enabled": true, "retries": 0, "retryDelaySeconds": 0,
  "concurrencyGroup": "heavy", "tags": ["security", "weekly"]
}
```

### Example 3: "Quand je push sur le projet web, lance les tests"
```json
{
  "id": "on-push-run-tests",
  "name": "Run Tests on Push",
  "trigger": { "type": "event", "event": "git-push", "debounceMs": 5000 },
  "prompt": "Run the full test suite and report results with coverage",
  "cwd": "<web project path>",
  "model": "sonnet",
  "maxBudgetUsd": 0.30,
  "timeoutSeconds": 300,
  "notify": { "on": ["failure"], "email": "arnaud.porcel@gmail.com", "includeOutput": true },
  "enabled": true, "retries": 0, "retryDelaySeconds": 0,
  "concurrencyGroup": "default", "tags": ["tests", "ci"]
}
```

### Example 4: "Demain à 15h, lance la migration de la base de données"
```json
{
  "id": "db-migration-scheduled",
  "name": "Database Migration",
  "trigger": { "type": "once", "scheduledAt": "<tomorrow 15:00 ISO>" },
  "prompt": "/db migrate",
  "cwd": "<project path>",
  "model": "sonnet",
  "maxBudgetUsd": 0.50,
  "timeoutSeconds": 300,
  "notify": { "on": ["always"], "email": "arnaud.porcel@gmail.com", "includeOutput": true },
  "enabled": true, "retries": 0, "retryDelaySeconds": 0,
  "concurrencyGroup": "heavy", "tags": ["database", "migration"]
}
```

## When to Ask (rare)

Only ask the user if:
- The working directory is truly ambiguous (multiple projects mentioned, no context)
- The frequency is unclear ("de temps en temps" → ask: how often exactly?)
- The task description maps to multiple very different actions

NEVER ask for:
- Cron expression format (you convert NL → cron)
- Model choice (you pick based on task weight)
- Notification config (smart defaults)
- Timeout or budget (smart defaults)
- Task ID (you generate it)

## Constraints

### MUST DO
- Parse natural language autonomously — do NOT ask the user to write JSON
- Validate cron expression before saving
- Confirm deployment with a concise summary after creation
- Use the /reload endpoint after writing any task file
- Verify daemon is running before creating tasks (`curl -s http://127.0.0.1:4820/status`)

### MUST NOT DO
- Never show raw JSON to the user (show human-readable summary)
- Never ask for cron syntax — convert NL to cron yourself
- Never create a task without checking the daemon is running first
- Never hardcode secrets in task prompts
