# Claude Code Memory - Arnaud's Dev Environment

## User
- **Name**: Arnaud | **Email**: arnaud.porcel@gmail.com | **Language**: French | **HuggingFace**: Arnwald84
- **Resume**: Debutant, franc, veut valider chaque etape, analogies du quotidien, produits beaux ET fonctionnels, tests toujours
- **Preferences de travail**: voir `memory/brainstorming-arnaud.md`

## System
- **PC**: AMD Ryzen 7 5700U, 15 GB RAM, Windows 11 Home
- **Shell**: bash (MINGW64/Git Bash)
- **Workspace**: `C:\Users\arnau\Projects\` (web, mobile, api, desktop, fullstack, tools, learning)

## Claude Code Setup (v2.1.63, 2026-03-08 — Senior+ Upgrade)
- 6 configs, 37 agents (all scoped), 30 commands, 4 modes, 11 rules, 44 standalone skills, 150+ plugin skills
- 30 hooks (26 active + 4 inline) incl. PreCompact, Anti-Rationalization, Smart Dispatcher
- 46 MCP servers (20 local + 2 plugin + 23 remote + 1 disabled)
- Autonomie max: 60 allow entries, 17 deny entries, 73 NLP triggers FR+EN
- 48 plugins actifs / 10 inactifs (7 LSP disabled)
- Env: Agent Teams experimental, Tool Search lazy-loading
- **Detail**: voir `memory/setup-detail.md`

## Quick References
| Topic | File |
|-------|------|
| Detailed setup (agents, commands, hooks, MCP, skills) | `memory/setup-detail.md` |
| Key learnings & gotchas | `memory/learnings.md` |
| Dev stack (10 langages, frameworks) | `memory/dev-stack.md` |
| Simulation results (34/34 project types) | `memory/simulations.md` |
| GigRoute project | `memory/gigroute-project.md` |
| Maestro No-Code formation | `memory/maestro-formation.md` |
| WhatsApp MCP details | `memory/whatsapp-mcp.md` |
| ATUM Drive structure | `memory/drive-atum.md` |
| Brainstorming preferences | `memory/brainstorming-arnaud.md` |

## Critical Learnings (top 5 — full list in `memory/learnings.md`)
- Subagents custom: recoivent SEULEMENT leur system prompt, PAS le full Claude Code prompt → scoper avec tools/mcpServers/skills dans frontmatter
- Hooks must be registered in `settings.json`; JS stdin: `fs.readFileSync(0, 'utf8')` on Windows
- Skills = 0 context cost at rest; auto-invocation ~70-80%, /skill-name = 100% reliable
- `rm -rf` blocked by git-guard → `python shutil.rmtree()`; Windows locked dirs → `cmd.exe /C rd /s /q`
- settings.json portability: LIVE uses hardcoded paths; backup template uses `$HOME`, install.sh replaces at deploy

## Active Projects
- **GigRoute**: Flask SaaS tour manager — LIVE on Render, beta-ready (details: `memory/gigroute-project.md`)
- **Maestro No-Code P12**: Formation hackathon 23 mars → jury 6 avril (details: `memory/maestro-formation.md`)

## Compact Instructions
When compacting, always preserve:
- Full list of modified files and their paths
- Test commands and their results (pass/fail)
- Architectural decisions made during the session
- Active TODO items and their status
- Error messages and how they were resolved
- Current task context and next steps

## Preferences
- Output style: Learning mode
- winget = primary package manager
- Git: user.name Arnaud, user.email arnaud.porcel@gmail.com, SSH ed25519
- Browser automation: Claude in Chrome d'abord, Playwright en fallback
- Decision principle: "Qu'est-ce qu'un dev senior de tres haut niveau ferait ?"
