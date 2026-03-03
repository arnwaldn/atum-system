# Claude Code Config

Complete Claude Code environment with full autonomy — hooks, commands, agents, skills, modes, rules, MCP servers, permissions, scheduler, and tooling.

## Quick Install

```bash
git clone https://github.com/arnwaldn/claude-code-config.git
cd claude-code-config
bash install.sh
```

**Prerequisites**: Node.js, Python, Git, [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code)

## What's Included

| Category | Count | Description |
|----------|-------|-------------|
| Hooks | 20 | Secret scanner, git guard, loop detector, auto-formatter, dashboard sync, hindsight retain, etc. |
| Commands | 27 | `/scaffold`, `/security-audit`, `/tdd`, `/deploy`, `/happy`, `/whatsapp`, `/schedule`, etc. |
| Agents | 37 | Architect, phaser-expert, ml-engineer, happy-expert, geospatial, compliance, etc. |
| Skills | 34 | PDF, DOCX, DDD, RAG, Mermaid, agent-browser, terminal-emulator, scheduler, etc. |
| Modes | 4 | architect, autonomous, brainstorm, quality |
| Rules | 27 | Coding style, security, testing, resilience, whatsapp-persona (common + TS/Python/Go) |
| Scripts | 5 | Context monitor, seed-hindsight, seed-workspace, hindsight-export, hindsight-health-check |
| MCP Servers | 22 | GitHub, Memory, Railway, Cloudflare, B12, WebMCP, WhatsApp, Hindsight, etc. |
| Plugins | 56 | ECC, Superpowers, Playwright, Firebase, Figma, Stripe, Linear, Pinecone, etc. |
| Permissions | 63 | Full autonomy — Write, Edit, Task, Bash, Skill, WebSearch, all MCP auto-approved |
| Scheduler | 9 tasks | claude-scheduler daemon (PM2) with cron+event scheduled tasks |
| Data | 16 JSON | Agence ATUM data store (societe, actionnariat, facturation, RGPD, etc.) |
| Tools | 6 | gsudo, jq, uv, uvx, composer, acpx |

## Autonomy Model

Claude Code executes any action **without permission prompts** — Write, Edit, Bash, Task (subagents), MCP tools are all pre-approved. Safety is maintained through **hooks** (not permissions):

| Hook | Protection |
|------|-----------|
| secret-scanner.py | Blocks hardcoded tokens/keys before git commit (Bash only) |
| git-guard.py | Blocks push to main, rm -rf, force-push, enforces conventional commits |
| lock-file-protector.js | Blocks direct modification of lock files |
| loop-detector.js | Detects repeated identical tool calls and ping-pong patterns |
| post-tool-failure-logger.js | Logs tool failures to structured JSON |
| config-change-guard.js | Warns when config files modified during session |
| atum-dashboard-sync.js | Syncs dev events to ATUM Dashboard on session end |
| hindsight-session-retain.js | Saves session summary to Hindsight shared memory |
| session-memory.js | Writes session summary to local memory files |
| worktree-setup.js | Auto-setup worktree (.env copy, npm install, deterministic port) |
| auto-format.sh | Auto-formats files (Prettier, Black, gofmt, rustfmt) on write |

**Philosophy**: Zero execution friction, but Claude still consults the user for important design decisions and before deletions.

## Structure

```
hooks/              PreToolUse/PostToolUse/PostToolUseFailure/ConfigChange/Stop/SessionStart hooks (20 files)
commands/           Slash commands (/scaffold, /tdd, /deploy, /happy, /whatsapp, etc.)
agents/             Specialized agents (37 domain experts)
skills/             On-demand skills (34: pdf, docx, DDD, RAG, agent-browser, etc.)
modes/              Custom modes (architect, autonomous, brainstorm, quality)
rules/              Global rules (27 files: common/, typescript/, python/, golang/)
scripts/            Helper scripts (context-monitor, seed-hindsight, hindsight-export, etc.)
bin/                Tool wrappers for Git Bash (gsudo, jq, uv, uvx, composer)
acpx/               acpx headless session config
data/               Agence ATUM data store (16 JSON files + 13 templates)
scheduler/          claude-scheduler daemon source (TypeScript)
schedules/          Scheduled tasks (9 JSON: health check, security audit, ATUM obligations)
projects/           Memory templates
plugins.txt         Plugin registry (56 plugins, 54 active)
settings.json       Main config — hooks, plugins, permissions (SOURCE OF TRUTH)
settings.local.json Local overrides — statusline, env vars, deny list
claude.json.template  MCP server configs (replace PAT/path placeholders)
```

## Tools

### gsudo (Windows only)

[gsudo](https://github.com/gerardog/gsudo) — `sudo` equivalent for Windows. Installed via `winget`, with credential caching (1 hour).

### acpx

[acpx](https://github.com/openclaw/acpx) — Headless CLI for Agent Client Protocol. Run Claude Code sessions without a terminal.

### Bin Wrappers

Shell wrappers in `~/bin/` for tools installed in non-standard locations (Windows WinGet paths):
- `gsudo` — Windows admin elevation
- `jq` — JSON processor
- `uv`, `uvx` — Python package manager (astral-sh)
- `composer` — PHP Composer

## Post-Install

1. **Restart Claude Code** to load the new config
2. **Set env vars** in `~/.bashrc`:
   - `GITHUB_PERSONAL_ACCESS_TOKEN` (via `gh auth token`)
   - `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_CLIENT_ID`
   - `OPENAPI_MCP_HEADERS` (Notion token)
   - `AIRTABLE_API_KEY`, `HINDSIGHT_API_KEY`
3. **Configure remote MCP** in claude.ai settings:
   Figma, Notion, Supabase, Vercel, Canva, Stripe, Gamma, Make, Zapier, etc.
4. **Build scheduler**: `cd ~/.claude/scheduler && npm install && npm run build`
5. **First gsudo use** (Windows) will trigger one UAC prompt, then cached for 1 hour

## Skills (34)

On-demand skills loaded into context only when triggered (zero cost when idle):

| Domain | Skills |
|--------|--------|
| Documents | pdf, docx, xlsx, pptx |
| Architecture | domain-driven-design, clean-architecture, system-design, ddia-systems |
| Visualization | design-doc-mermaid, claude-d3js-skill, audit-flow |
| Security | supply-chain-risk-auditor, open-source-license-compliance |
| ML/AI | rag-architect |
| DevOps | sre-engineer, chaos-engineer, high-perf-browser |
| Product | jobs-to-be-done, mom-test |
| Analysis | spec-miner, the-fool, prompt-architect |
| UI/A11y | refactoring-ui, claude-a11y-skill |
| Testing | property-based-testing |
| Tooling | mcp-builder, powershell-windows, context-engineering-kit |
| Automation | scheduler, agent-browser, terminal-emulator |
| Routing | autonomous-routing (NLP trigger reference tables) |
| Admin | agence-atum, no-code-maestro, release-notes |

## NLP Auto-Routing

The system auto-detects user intent and invokes the right tool — 75+ triggers (FR+EN) defined in `rules/common/autonomous-workflow.md`.

Examples: "Create a PDF" -> `/pdf` | "Bounded context" -> `domain-driven-design` | "Make a diagram" -> `design-doc-mermaid` | "Audit dependencies" -> `supply-chain-risk-auditor` | "Quick website" -> B12 MCP | "Happy doctor" -> `/happy` | "Envoie sur WhatsApp" -> `/whatsapp`

## Portability

- `settings.json` uses `$HOME` for hook paths — works on any machine
- Hooks use `$HOME`, `$TEMP`, `$CLAUDE_TOOL_FILE_PATH` — no hardcoded paths
- Commands, agents, modes, rules, skills are pure Markdown — fully portable
- The install script backs up any existing config before overwriting
- gsudo installed only on Windows; skipped on macOS/Linux
- `cmd /c npx` wrappers auto-converted to direct `npx` calls on macOS/Linux

## Supported Platforms

- Windows (Git Bash / MSYS2 / WSL)
- macOS
- Linux

## Languages & Frameworks Covered

Rules and agents cover: TypeScript, Python, Go, Rust, Java, .NET, PHP, Ruby, Dart, Solidity.
Frameworks: Next.js, Vue, Svelte, FastAPI, Django, Flask, Express, NestJS, Spring Boot, Laravel, Rails, Flutter, Tauri, Electron, Phaser, Three.js, Godot, Hardhat.
