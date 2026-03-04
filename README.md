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
| Hooks | 22 | Secret scanner, git guard, typecheck, loop detector, auto-formatter, dashboard sync, hindsight retain, etc. |
| Commands | 29 | `/scaffold`, `/security-audit`, `/tdd`, `/deploy`, `/happy`, `/whatsapp`, `/schedule`, `/dashboard-atum`, `/projet`, etc. |
| Agents | 37 | Architect, phaser-expert, ml-engineer, happy-expert, geospatial, compliance, etc. |
| Skills | 35 | PDF, DOCX, DDD, RAG, Mermaid, agent-browser, terminal-emulator, scheduler, release-notes, etc. |
| Modes | 4 | architect, autonomous, brainstorm, quality |
| Rules | 27 | Coding style, security, testing, resilience, whatsapp-persona (common + TS/Python/Go) |
| Scripts | 5 | Context monitor, seed-hindsight, seed-workspace, hindsight-export, hindsight-health-check |
| MCP Servers | 22 | GitHub, Memory, Railway, Cloudflare, B12, WebMCP, WhatsApp, Hindsight, Google Workspace, etc. |
| Plugins | 56 | ECC, Superpowers, Playwright, Firebase, Figma, Stripe, Linear, Pinecone, etc. |
| Permissions | 63 | Full autonomy — Write, Edit, Task, Bash, Skill, WebSearch, all MCP auto-approved |
| Scheduler | 12 tasks | claude-scheduler daemon (PM2) with cron+event scheduled tasks |
| Data | 17 JSON | Agence ATUM data store (societe, actionnariat, facturation, RGPD, etc.) |
| Tools | 6 | gsudo, jq, uv, uvx, composer, acpx |

## Autonomy Model

Claude Code executes any action **without permission prompts** — Write, Edit, Bash, Task (subagents), MCP tools are all pre-approved. Safety is maintained through **hooks** (not permissions):

| Hook | Protection |
|------|-----------|
| secret-scanner.py | Blocks hardcoded tokens/keys before git commit (Bash only) |
| git-guard.py | Blocks push to main, rm -rf, force-push, enforces conventional commits |
| lock-file-protector.js | Blocks direct modification of lock files |
| typecheck.sh | TypeScript type-check (tsc/tsgo --noEmit) after editing .ts/.tsx files |
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
hooks/              PreToolUse/PostToolUse/PostToolUseFailure/ConfigChange/Stop/SessionStart hooks (22 files)
commands/           Slash commands (/scaffold, /tdd, /deploy, /happy, /whatsapp, /dashboard-atum, etc.)
agents/             Specialized agents (37 domain experts)
skills/             On-demand skills (35: pdf, docx, DDD, RAG, release-notes, etc.)
modes/              Custom modes (architect, autonomous, brainstorm, quality)
rules/              Global rules (27 files: common/, typescript/, python/, golang/)
scripts/            Helper scripts (context-monitor, seed-hindsight, hindsight-export, etc.)
bin/                Tool wrappers for Git Bash (gsudo, jq, uv, uvx, composer)
acpx/               acpx headless session config
data/               Agence ATUM data store (17 JSON files + 13 templates)
scheduler/          claude-scheduler daemon source (TypeScript)
schedules/          Scheduled tasks (12 JSON: health check, security audit, ATUM obligations)
projects/           Memory templates
atum-projects.json  Central project registry (for SessionStart maturity scanner)
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
2. **Set env vars** in `~/.bashrc` (or `~/.zshrc` on macOS):

   ```bash
   # MCP servers
   export GITHUB_PERSONAL_ACCESS_TOKEN="$(gh auth token 2>/dev/null)"
   export GOOGLE_OAUTH_CLIENT_SECRET="your-secret"
   export OPENAPI_MCP_HEADERS='{"Authorization":"Bearer your-notion-token","Notion-Version":"2022-06-28"}'
   export AIRTABLE_API_KEY="your-airtable-pat"

   # Hindsight shared memory
   export HINDSIGHT_API_KEY="your-hindsight-api-key"
   export ATUM_USER="your-name"  # arnaud, pablo, or wahid
   export GROQ_API_KEY="your-groq-key"

   # ATUM Dashboard auto-sync
   export ATUM_DASHBOARD_KEY="your-dashboard-api-key"
   export ATUM_SUPABASE_SERVICE_KEY="your-supabase-service-role-key"
   ```

3. **Configure remote MCP** in claude.ai settings:
   Figma, Notion, Supabase, Vercel, Canva, Stripe, Gamma, Make, Zapier, etc.
4. **Build scheduler**: `cd ~/.claude/scheduler && npm install && npm run build`
5. **For ATUM Dashboard**: create API key at `atum-dashboard.netlify.app/settings`
6. **First gsudo use** (Windows) will trigger one UAC prompt, then cached for 1 hour

## Skills (35)

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
- `install.sh` auto-converts `cmd /c npx` wrappers to direct `npx` calls on macOS/Linux
- The install script backs up any existing config before overwriting
- gsudo and bin wrappers installed only on Windows; skipped on macOS/Linux
- Line endings normalized to LF via `.gitattributes`

## Supported Platforms

- Windows (Git Bash / MSYS2 / WSL)
- macOS
- Linux

## Languages & Frameworks Covered

Rules and agents cover: TypeScript, Python, Go, Rust, Java, .NET, PHP, Ruby, Dart, Solidity.
Frameworks: Next.js, Vue, Svelte, FastAPI, Django, Flask, Express, NestJS, Spring Boot, Laravel, Rails, Flutter, Tauri, Electron, Phaser, Three.js, Godot, Hardhat.
