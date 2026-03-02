# Claude Code Config

Complete Claude Code environment with full autonomy — hooks, commands, agents, skills, modes, rules, MCP servers, permissions, and tooling.

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
| Hooks | 17 | Secret scanner, git guard, loop detector, auto-formatter, failure logger, config guard, etc. |
| Commands | 23 | `/scaffold`, `/security-audit`, `/tdd`, `/deploy`, `/compliance`, `/website`, `/webmcp`, `/schedule`, etc. |
| Agents | 34 | Architect, phaser-expert, ml-engineer, blockchain-expert, geospatial-expert, compliance-expert, etc. |
| Skills | 29 | PDF, DOCX, XLSX, PPTX, DDD, clean-arch, RAG, Mermaid, supply-chain audit, prompt-architect, scheduler, etc. |
| Modes | 4 | architect, autonomous, brainstorm, quality |
| Rules | 26 | Coding style, security, testing, resilience, anti-hallucination, decision-principle (common + TS/Python/Go) |
| Scripts | 1 | Context monitor statusline |
| MCP Servers | 14 | GitHub, Memory, Railway, Cloudflare, Context7, Gmail, B12, ATUM, SkillSync, WebMCP, etc. |
| Plugins | 56 | ECC, Superpowers, Playwright, Firebase, Figma, Stripe, Linear, Pinecone, etc. |
| Permissions | 55 | Full autonomy — Write, Edit, Task, Bash, Skill, WebSearch, all MCP auto-approved |
| Tools | 2 | gsudo (Windows admin elevation), acpx (headless ACP sessions) |

## Autonomy Model

Claude Code executes any action **without permission prompts** — Write, Edit, Bash, Task (subagents), MCP tools are all pre-approved. Safety is maintained through **hooks** (not permissions):

| Hook | Protection |
|------|-----------|
| secret-scanner.py | Blocks hardcoded tokens/keys before git commit (Bash only) |
| git-guard.py | Blocks push to main, rm -rf, force-push, enforces conventional commits |
| lock-file-protector.js | Blocks direct modification of lock files |
| file-backup | Creates .backup before every Edit |
| loop-detector.js | Detects repeated identical tool calls |
| post-tool-failure-logger.js | Logs tool failures to structured JSON |
| config-change-guard.js | Warns when config files modified during session |
| worktree-setup.js | Auto-setup worktree (.env copy, npm install, deterministic port) |

**Philosophy**: Zero execution friction, but Claude still consults the user for important design decisions and before deletions.

## Structure

```
hooks/              PreToolUse/PostToolUse/Stop/SessionStart hooks (17 files)
commands/           Slash commands (/scaffold, /tdd, /deploy, /website, etc.)
agents/             Specialized agents (34 domain experts)
skills/             On-demand skills (29: pdf, docx, DDD, RAG, Mermaid, scheduler, etc.)
modes/              Custom modes (architect, autonomous, brainstorm, quality)
rules/              Global rules (26 files: common/, typescript/, python/, golang/)
scripts/            Helper scripts (context-monitor.py)
bin/                Tool wrappers for Git Bash (gsudo, jq, etc.)
acpx/               acpx headless session config
projects/           Memory templates
plugins.txt         Plugin registry (56 plugins, 54 active)
settings.json       Main config — hooks, plugins, permissions (SOURCE OF TRUTH)
settings.local.json Local overrides — statusline, env vars, deny list
claude.json.template  MCP server configs (replace PAT/path placeholders)
```

## Tools

### gsudo (Windows only)

[gsudo](https://github.com/gerardog/gsudo) — `sudo` equivalent for Windows. Installed via `winget`, with credential caching (1 hour). Allows Claude Code to run admin commands (`winget install`, `netsh`, `sc`, etc.) after a single UAC confirmation.

```bash
gsudo winget install <package>
gsudo netsh advfirewall firewall add rule ...
```

### acpx

[acpx](https://github.com/openclaw/acpx) — Headless CLI for Agent Client Protocol. Run Claude Code sessions without a terminal, with persistent sessions, queuing, and parallel workstreams.

```bash
acpx claude "fix the failing tests"             # persistent session
acpx claude -s backend "refactor the API"        # named session
acpx claude --approve-all "scaffold and test"    # full autonomy
acpx claude --no-wait "run test suite"           # fire-and-forget
```

Config: `~/.acpx/config.json` (defaultAgent: claude, approve-all)

## Post-Install

1. **Restart Claude Code** to load the new config
2. **Set GitHub PAT** if skipped: `export GITHUB_PERSONAL_ACCESS_TOKEN=...`
3. **Configure remote MCP** in claude.ai settings:
   Figma, Notion, Supabase, Vercel, Canva, Stripe, Gamma, Make, Zapier, etc.
4. **First gsudo use** (Windows) will trigger one UAC prompt, then cached for 1 hour

## Skills (29)

On-demand skills loaded into context only when triggered (zero cost when idle):

| Domain | Skills |
|--------|--------|
| Documents | pdf, docx, xlsx, pptx |
| Architecture | domain-driven-design, clean-architecture, system-design, ddia-systems |
| Visualization | design-doc-mermaid, claude-d3js-skill |
| Security | supply-chain-risk-auditor, open-source-license-compliance |
| ML/AI | rag-architect |
| DevOps | sre-engineer, chaos-engineer, high-perf-browser |
| Product | jobs-to-be-done, mom-test |
| Analysis | spec-miner, the-fool, prompt-architect |
| UI/A11y | refactoring-ui, claude-a11y-skill |
| Testing | property-based-testing |
| Tooling | mcp-builder, powershell-windows, context-engineering-kit, audit-flow |
| Automation | scheduler |

## NLP Auto-Routing

The system auto-detects user intent and invokes the right tool — 40 triggers (FR+EN) defined in `rules/common/autonomous-workflow.md`.

Examples: "Create a PDF" → `/pdf` | "Bounded context" → `domain-driven-design` | "Make a diagram" → `design-doc-mermaid` | "Audit dependencies" → `supply-chain-risk-auditor` | "Quick website" → B12 MCP

## Portability

- `settings.json` uses `$HOME` for hook paths — works on any machine
- Hooks use `$HOME`, `$TEMP`, `$CLAUDE_TOOL_FILE_PATH` — no hardcoded paths
- Commands, agents, modes, rules, skills are pure Markdown — fully portable
- The install script backs up any existing config before overwriting
- gsudo installed only on Windows; skipped on macOS/Linux
- acpx installed globally via npm on all platforms

## Supported Platforms

- Windows (Git Bash / MSYS2 / WSL)
- macOS
- Linux

## Languages & Frameworks Covered

Rules and agents cover: TypeScript, Python, Go, Rust, Java, .NET, PHP, Ruby, Dart, Solidity.
Frameworks: Next.js, Vue, Svelte, FastAPI, Django, Flask, Express, NestJS, Spring Boot, Laravel, Rails, Flutter, Tauri, Electron, Phaser, Three.js, Godot, Hardhat.
