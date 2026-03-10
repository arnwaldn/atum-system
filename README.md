# Claude Code Config

Complete Claude Code environment with full autonomy — hooks, commands, agents, skills, modes, rules, MCP servers, permissions, scheduler, and tooling.

## Quick Install

```bash
git clone https://github.com/arnwaldn/claude-code-config.git
cd claude-code-config
bash install.sh
```

**Prerequisites**: Node.js, Python 3, Git, [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code)

## What's Included

| Category | Count | Description |
|----------|-------|-------------|
| Hooks | 32 | File guard, anti-rationalization, secret scanner, git guard, loop detector, session-to-graph, graph-queue-loader, dashboard sync, etc. |
| Commands | 30 | `/scaffold`, `/security-audit`, `/tdd`, `/deploy`, `/happy`, `/whatsapp`, `/schedule`, `/dashboard-atum`, `/projet`, `/compliance`, `/atum-audit`, etc. |
| Agents | 38 | 10 Opus (security, compliance, architecture, migration) + 26 Sonnet (dev, DevOps, ML, game) + 2 Haiku (search, docs) |
| Skills | 44 | PDF, DOCX, DDD, RAG, Mermaid, scheduler, compliance-routing, fresh-execute, autonomous-routing (108 NLP triggers), etc. |
| Modes | 4 | architect, autonomous, brainstorm, quality |
| Rules | 23 | Coding style, security, testing, decision principle, autonomous-workflow (32 auto-detect blocks), anti-hallucination, pedagogie |
| Scripts | 14 | Context monitor, collective-memory-sync, migrate-hindsight, session-to-graph, etc. |
| MCP Servers | 20+ | GitHub, Memory, Railway, Cloudflare, B12, WebMCP, WhatsApp, ATUM Audit (EU AI Act), Google Workspace, etc. |
| Plugins | 56 | ECC, Superpowers, Playwright, Firebase, Figma, Stripe, Linear, Pinecone, etc. |
| Permissions | 60 | Full autonomy — Write, Edit, Task, Bash, Skill, WebSearch, all MCP auto-approved |
| Scheduler | 13 tasks | claude-scheduler daemon (PM2) with cron+event scheduled tasks |
| Data | 30 JSON | Agence ATUM data store (societe, actionnariat, facturation, RGPD, templates, etc.) |

## Autonomy Model

Claude Code executes any action **without permission prompts** — Write, Edit, Bash, Task (subagents), MCP tools are all pre-approved. Safety is maintained through **hooks** (not permissions):

| Hook | Protection |
|------|-----------|
| file-guard.py | Blocks access to 195+ sensitive file patterns (SSH keys, .env, wallets, etc.) |
| anti-rationalization.js | Detects premature completion, vague language, deferred follow-ups |
| secret-scanner.py | Blocks hardcoded tokens/keys before git commit |
| git-guard.py | Blocks push to main, force-push, enforces conventional commits |
| lock-file-protector.js | Blocks direct modification of lock files |
| loop-detector.js | Detects repeated identical tool calls and ping-pong patterns |
| session-to-graph.js | Extracts knowledge graph entities from sessions |
| graph-queue-loader.js | Loads queued knowledge into MCP memory at session start |
| config-change-guard.js | Warns when config files modified during session |
| atum-dashboard-sync.js | Syncs dev events to ATUM Dashboard on session end |

**Philosophy**: Zero execution friction, but Claude still consults the user for important design decisions and before destructive actions.

## Structure

```
hooks/              32 hooks (PreToolUse, PostToolUse, PostToolUseFailure, ConfigChange, Stop, SessionStart, PreCompact, Notification)
commands/           30 slash commands (/scaffold, /tdd, /deploy, /compliance, /atum-audit, etc.)
agents/             38 specialized agents (10 Opus, 26 Sonnet, 2 Haiku)
skills/             44 on-demand skills (zero context cost at rest)
modes/              4 custom modes (architect, autonomous, brainstorm, quality)
rules/              23 rules (common/, typescript/, python/, golang/)
scripts/            14 helper scripts
bin/                Tool wrappers for Git Bash (gsudo, jq, uv, uvx, composer)
acpx/               acpx headless session config
data/               Agence ATUM data store (30 JSON files)
scheduler/          claude-scheduler daemon source (TypeScript)
schedules/          13 scheduled tasks (health check, security audit, ATUM obligations)
projects/           Memory templates (per-project MEMORY.md)
atum-projects.json  Central project registry
plugins.txt         Plugin registry (56 plugins)
settings.json       Main config — hooks, plugins, permissions (portable with $HOME_PLACEHOLDER)
settings.local.json Local overrides — statusline, env vars
claude.json.template  MCP server configs (replace PAT/path placeholders)
install.sh          Cross-platform installer (Windows/macOS/Linux)
```

## NLP Auto-Routing (108 triggers)

The system auto-detects user intent from natural language and invokes the right tool/agent — **108 triggers** (FR+EN) in `skills/autonomous-routing/SKILL.md`, plus **32 auto-detect blocks** in `rules/common/autonomous-workflow.md`.

Examples:
- "Create a PDF" -> `/pdf`
- "Audit RGPD" -> compliance-expert agent + ATUM Audit MCP
- "EU AI Act compliance" -> `mcp__atum-audit__compliance_status`
- "Fresh context" -> `/fresh-execute` (atomic sub-tasks in clean context)
- "Quick website" -> B12 MCP
- "Deploy on Render" -> `/deploy`
- "TDD write tests first" -> `/tdd`

## Agent Model Strategy

| Tier | Count | Purpose | Agents |
|------|-------|---------|--------|
| Opus 4.6 | 10 | Critical decisions, deep reasoning | security-expert, compliance-expert, architect-reviewer, critical-thinking, error-detective, database-optimizer, fresh-executor, api-designer, agence-atum-expert, migration-expert |
| Sonnet 4.6 | 26 | Development, DevOps, specialized domains | All dev agents, game engines, ML, networking, etc. |
| Haiku 4.5 | 2 | Fast, frequent tasks | codebase-pattern-finder, documentation-generator |

## Compliance Integration

Built-in EU AI Act and RGPD compliance via ATUM Audit MCP (15 tools):
- `compliance_register_system` — Register AI systems
- `compliance_validate` — SHACL validation against EU AI Act
- `compliance_annex_iv` — Annex IV documentation check
- `compliance_retention_check` — Art. 12 log retention
- `compliance_export_report` — Generate compliance reports
- `audit_full_scan` — File integrity verification

## Portability

- `settings.json` uses `$HOME_PLACEHOLDER` — `install.sh` replaces with actual home path on any machine
- Hooks use portable path patterns — no hardcoded user paths
- Commands, agents, modes, rules, skills are pure Markdown — fully portable
- `install.sh` auto-converts `cmd /c npx` wrappers to direct `npx` calls on macOS/Linux
- The install script backs up any existing config before overwriting
- gsudo and bin wrappers installed only on Windows; skipped on macOS/Linux
- Line endings normalized to LF via `.gitattributes`

## Supported Platforms

- Windows (Git Bash / MSYS2 / WSL)
- macOS
- Linux

## Post-Install

1. **Restart Claude Code** to load the new config
2. **Set env vars** in `~/.bashrc` (or `~/.zshrc` on macOS):

   ```bash
   export GITHUB_PERSONAL_ACCESS_TOKEN="$(gh auth token 2>/dev/null)"
   export ATUM_USER="your-name"  # arnaud, pablo, or wahid
   ```

3. **Configure remote MCP** in claude.ai settings: Figma, Notion, Supabase, Vercel, Canva, Stripe, Gamma, etc.
4. **Build scheduler**: `cd ~/.claude/scheduler && npm install && npm run build`
5. **For ATUM Dashboard**: create API key at `atum-dashboard.netlify.app/settings`

## Languages & Frameworks Covered

Rules and agents cover: TypeScript, Python, Go, Rust, Java, .NET, PHP, Ruby, Dart, Solidity.
Frameworks: Next.js, Vue, Svelte, FastAPI, Django, Flask, Express, NestJS, Spring Boot, Laravel, Rails, Flutter, Tauri, Electron, Phaser, Three.js, Godot, Hardhat.
