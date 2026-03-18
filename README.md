# ATUM SYSTEM

Complete Claude Code environment with full autonomy — hooks, commands, agents, skills, modes, rules, MCP servers, permissions, scheduler, and tooling.

## Install as Plugin (Recommended)

```bash
# Add the marketplace
/plugin marketplace add arnwaldn/atum-system

# Install the plugin
/plugin install atum-system@arnwaldn-atum-system

# Reload
/reload-plugins
```

Works on **all Claude Code surfaces**: Terminal, VS Code, JetBrains, Desktop app, Browser.

## Full Install (advanced — includes permissions, scheduler, MCP secrets)

```bash
git clone https://github.com/arnwaldn/atum-system.git
cd atum-system
bash install.sh
```

**Prerequisites**: Node.js, Python 3, Git, [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code)

## Plugin vs Full Install

| Feature | Plugin | Full Install |
|---------|--------|-------------|
| 40 agents | Yes | Yes |
| 45 skills | Yes | Yes |
| 31 commands | Yes | Yes |
| 31 hooks | Yes | Yes |
| 4 modes | Yes | Yes |
| 6 MCP servers (no secrets) | Yes | Yes |
| 27 rules | Via skills | Yes |
| 14 MCP servers (with secrets) | No | Yes |
| Permissions (full autonomy) | No | Yes |
| Scheduler daemon (PM2) | No | Yes |
| Collective memory sync | No | Yes |
| Bin wrappers (Windows) | No | Yes |

## What's Included

| Category | Count | Description |
|----------|-------|-------------|
| Hooks | 31 | File guard, anti-rationalization, secret scanner, git guard, loop detector, session-to-graph, graph-queue-loader, dashboard sync, etc. |
| Commands | 31 | `/scaffold`, `/security-audit`, `/tdd`, `/deploy`, `/happy`, `/whatsapp`, `/schedule`, `/dashboard-atum`, `/projet`, `/compliance`, `/atum-audit`, etc. |
| Agents | 40 | 10 Opus (security, compliance, architecture, migration) + 26 Sonnet (dev, DevOps, ML, game) + 2 Haiku (search, docs) |
| Skills | 45 | PDF, DOCX, DDD, RAG, Mermaid, scheduler, compliance-routing, fresh-execute, autonomous-routing (108 NLP triggers), etc. |
| Modes | 4 | architect, autonomous, brainstorm, quality |
| Rules | 27 | Coding style, security, testing, decision principle, autonomous-workflow (33 auto-detect blocks), anti-hallucination, pedagogie |
| MCP Servers | 20+ | Memory, Context7, Magic, Desktop Commander, SkillSync + GitHub, Google Workspace, WhatsApp, ATUM Audit, etc. |
| Plugins | 57 | ECC, Superpowers, Playwright, Firebase, Figma, Stripe, Linear, Pinecone, etc. |

## Autonomy Model

Claude Code executes any action **without permission prompts** — Write, Edit, Bash, Task (subagents), MCP tools are all pre-approved. Safety is maintained through **hooks** (not permissions):

| Hook | Protection |
|------|-----------|
| file-guard.js | Blocks access to 195+ sensitive file patterns (SSH keys, .env, wallets, etc.) |
| anti-rationalization.js | Detects premature completion, vague language, deferred follow-ups |
| secret-scanner.js | Blocks hardcoded tokens/keys before git commit |
| git-guard.js | Blocks push to main, force-push, enforces conventional commits |
| lock-file-protector.js | Blocks direct modification of lock files |
| loop-detector.js | Detects repeated identical tool calls and ping-pong patterns |
| session-to-graph.js | Extracts knowledge graph entities from sessions |
| config-change-guard.js | Warns when config files modified during session |

## NLP Auto-Routing (108 triggers)

The system auto-detects user intent from natural language and invokes the right tool/agent — **108 triggers** (FR+EN).

Examples:
- "Create a PDF" -> `/atum-system:pdf`
- "Audit RGPD" -> compliance-expert agent + ATUM Audit MCP
- "EU AI Act compliance" -> `mcp__atum-audit__compliance_status`
- "Quick website" -> B12 MCP
- "Deploy on Render" -> `/atum-system:deploy`

## Agent Model Strategy

| Tier | Count | Purpose |
|------|-------|---------|
| Opus 4.6 | 10 | Critical decisions, deep reasoning |
| Sonnet 4.6 | 26 | Development, DevOps, specialized domains |
| Haiku 4.5 | 2 | Fast, frequent tasks |

## Supported Platforms

- Windows (Git Bash / MSYS2 / WSL)
- macOS
- Linux

## Post-Install (Full Install only)

1. **Restart Claude Code** to load the new config
2. **Set env vars** in `~/.bashrc`:
   ```bash
   export GITHUB_PERSONAL_ACCESS_TOKEN="$(gh auth token 2>/dev/null)"
   export ATUM_USER="your-name"
   ```
3. **Configure remote MCP** in claude.ai settings: Figma, Notion, Supabase, Vercel, Canva, Stripe, Gamma, etc.

## Languages & Frameworks Covered

Rules and agents cover: TypeScript, Python, Go, Rust, Java, .NET, PHP, Ruby, Dart, Solidity.
Frameworks: Next.js, Vue, Svelte, FastAPI, Django, Flask, Express, NestJS, Spring Boot, Laravel, Rails, Flutter, Tauri, Electron, Phaser, Three.js, Godot, Hardhat.

## License

MIT
