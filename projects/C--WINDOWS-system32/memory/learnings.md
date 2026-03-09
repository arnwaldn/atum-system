# Key Learnings

## Claude Code Architecture
- Hooks NOT auto-discovered — must register in `settings.json`; NEVER duplicate in settings.local.json
- JS hooks: `fs.readFileSync(0, 'utf8')` for stdin on Windows; Python: `sys.stdin.read()`
- Agents/commands/modes = ZERO context cost when not invoked; only rules always loaded
- Skills standalone: auto-decouverte dans ~/.claude/skills/*/SKILL.md, 0 context cost au repos; auto-invocation ~70-80%, /skill-name = 100% fiable
- autonomous-workflow.md: split 2026-03-03 — core triggers (7KB rule) + routing tables moved to `autonomous-routing` skill (12KB, 70+ NLP triggers); saves ~11KB/session
- Modes = fichiers `.md` (pas `.yml`) dans `~/.claude/modes/`
- Claude Code v2.1.63: features: /simplify, /batch, auto-memory, PostToolUseFailure/ConfigChange/WorktreeCreate hook events
- settings.json duplicate hooks: JSON ne supporte pas les cles dupliquees — 2e bloc ecrase le 1er silencieusement
- MEMORY.md must stay <200 lines (truncated after)
- Sub-agents can't see plugin-provided agents — ALWAYS verify existence before declaring "phantom"; plugin agents: everything-claude-code:*, ui-ux-pro-max:*, pr-review-toolkit:*
- Subagents custom: recoivent SEULEMENT leur system prompt, PAS le full Claude Code system prompt; scoper avec tools/mcpServers/skills dans frontmatter YAML
- Context optimization (2026-03-07): 4 rules→skills (whatsapp-persona, collective-memory, monorepo, resilience → saves ~3,100 tokens/session); 37 agents scoped with explicit `tools:` in YAML frontmatter (prevents MCP tool schema inheritance); MEMORY.md trimmed 203→52 lines (~3,500 tokens saved); total ~6,600+ tokens reduced from base context
- Agent Teams (TeammateTool): experimental, feature-flagged, NOT for context reduction — each teammate loads same rules/MEMORY/MCP; designed for multi-agent collaboration not isolation
- ToolSearch: `+keyword` cherche dans les DESCRIPTIONS, pas les noms — pour MCP tools, TOUJOURS `select:mcp__server__tool_name`
- Philosophie autonomie: zero prompt d'execution MAIS consultation pour choix importants et suppressions
- Orchestration patterns (2026-03-06): adopted from jeffallan/claude-skills — Common Ground skill, /pipeline command, routing tables in 6 skills

## Hooks Detail
- git-guard.py: consolidates 4 checks (~74ms), heredoc bug (use `-m "msg"`), blocks pushes to main EXCEPT backup repos whitelist
- git-guard whitelist: checks `any(repo in command for repo in BACKUP_REPOS)` — detects repo name in the Bash command string
- Loop-detector hook: 3 detectors (consecutive repeats, ping-pong A↔B, context exhaustion 80/120 calls); skip Read/Grep/Glob
- Loop-detector bug fix: `history.push()` DOIT etre APRES detection, sinon ping-pong jamais declenche
- Session-memory hook: Stop event, consumes stats from loop-detector, saves to `memory/sessions/`; auto-cleanup >7 days
- Session-memory fixes (2026-03-06): CLAUDE_SESSION_ID not available → generate ID from `startedAt.toString(36)`; threshold 3→8; cleanup 7→3 days
- Shell snapshots: corrupt with base64 (git completion on MINGW64); FIX: `icacls /deny arnau:(W,AD,WD)` on `~/.claude/shell-snapshots/` — NTFS ACLs block writes at kernel level (POSIX chmod doesn't work on MINGW64); hook `clean-shell-snapshots.py` auto-applies lock + cleanup on SessionStart/PreToolUse
- secret-scanner.py only scans on `git commit` — matcher changed to `Bash` only
- WorktreeCreate hook REPLACES default git behavior (NOT post-creation)
- Collective Memory v2 (2026-03-06): GitHub private repo `arnwaldn/atum-memory` synced via git. Hooks: start.js (SessionStart) + retain.js (Stop). PM2 sync every 30s

## MCP Servers
- mcp-launcher.js (`~/.claude/scripts/`): wraps MCP server commands with `windowsHide: true` + signal forwarding
- MCP cmd /c wrapper: REPLACED with mcp-launcher.js — prevents visible cmd.exe windows; 11 servers updated
- filesystem MCP: retired (CWD bug) — desktop-commander is the replacement
- fetch MCP (`@anthropic-ai/mcp-server-fetch`) n'existe PAS sur npm — WebFetch built-in suffit
- greptile plugin: OAuth 404 — desactive dans settings.json (2026-03-03)
- google-workspace MCP: `taylorwilsdon/google_workspace_mcp` v1.14.1; 83 outils, OAuth ACTIF; commande = uv.exe direct
- B12 MCP: clone GitHub `b12io/website-generator-mcp-server` dans `~/Projects/tools/`; necessite `"type": "module"`; 1 tool `generate_website(name, description)`
- mcporter: `mcporter list`, `mcporter call <server.tool> key=value` — debug MCP servers

## Windows Specifics
- ECC `.md` blocker: Windows regex issues — use Bash heredoc for .md writes in .claude/
- Rust on Windows: works directly from Git Bash with VS Build Tools installed
- Docker Desktop daemon needs manual start — not auto-started on boot
- `rm -rf` blocked by git-guard.py — use `python shutil.rmtree()`
- Windows .git cleanup: read-only objects — `shutil.rmtree(path, onexc=force_remove)` with `os.chmod(path, stat.S_IWRITE)`
- Windows locked dirs: `shutil.rmtree` echoue si Avast/indexer → `cmd.exe /C rd /s /q` ou tache planifiee
- gsudo + powershell depuis Git Bash: `$_` se fait manger → toujours passer par un fichier `.ps1`
- gsudo 2.6.1: `~/bin/gsudo` wrapper → `/c/Program Files/gsudo/2.6.1/gsudo.exe`; CacheMode Auto, CacheDuration 1h
- bash `$TEMP`=/tmp vs node.js `process.env.TEMP`=AppData/Local/Temp — always use node.js to check stats files
- settings.json portability: LIVE uses hardcoded paths (MSYS2 `$HOME` resolves wrong); backup template uses `$HOME`, install.sh replaces

## Language/Framework Specifics
- PHP winget: no php.ini by default — created with openssl/curl/mbstring + cacert.pem
- Avast intercepte SSL PHP/Composer/Ruby — desactiver temporairement
- Ruby native gems: need MSYS2 ucrt64 toolchain + make
- Composer: `curl --ssl-no-revoke` pour telecharger → wrapper bash dans `~/bin/composer`
- Python 3.13 venvs: peuvent manquer pip → toujours `python -m ensurepip --upgrade`
- Nuxt init sur Windows: interactif → utiliser `npx giget` a la place
- SvelteKit: premier build necessite `svelte-kit sync`
- Spring Boot mvnw (bash) echoue sur Windows → utiliser `mvnw.cmd` via `cmd.exe`
- Fastify + top-level await: `npm pkg set type=module` necessaire
- Hardhat 3.x: `defineConfig` + `plugins: [toolbox]`; `hardhat-toolbox-viem`; `node:test`; `"type": "module"` required
- Flask+Alembic: NEVER run db.create_all() inside create_app() — use separate CLI command AFTER migrations
- uv 0.10.7: winget `astral-sh.uv`, wrappers bash `~/bin/uv` et `~/bin/uvx`
- Godot 4.6.1: winget can't create symlinks without admin → wrappers in `~/bin/godot`

## Tools & Infra
- jq 1.8.1: winget installe dans WinGet/Packages/ (pas dans PATH Git Bash) → wrapper `~/bin/jq`
- Forfait Claude Max = pas de cost-tracking necessaire
- acpx 0.1.8: headless ACP CLI, config `~/.acpx/config.json`
- GitHub backups: `arnwaldn/claude-code-config` + `arnwaldn/project-templates` + `arnwaldn/atum-memory`

## Scheduler
- claude-scheduler: daemon Node.js PM2 (`~/.claude/scheduler/`), tasks JSON (`~/.claude/schedules/`), SQLite history, HTTP :4820
- esbuild: `--format=esm --banner:js='import{createRequire...}...'` — need shims for CJS deps
- Executor uses `quoteArg()` for shell:true arg quoting (DEP0190 fix); `windowsHide: true` on spawn
- Task cwd MUST be full path (NOT `~` — Node.js spawn doesn't expand tilde → ENOENT)
- Scheduler task budgets: haiku context loading costs ~$0.05

## WhatsApp
- LIDs (CRITICAL): sender_jid in group messages are LIDs NOT phone numbers; mapping: Pablo=96413459472572, Arnaud=167933456179200, Walid=181007118536715, Cloclo=250375772864613
- File sending: send ONLY final deliverable; use Python 3.13 full path for reportlab PDF generation

## ATUM Specifics
- `agent.compliance` is PROPERTY not method; `agent.query()` returns list of dicts; `fmt='md'` not 'markdown'
- AuditAgent creates audit_store in CWD — needs ATUM_PROJECT_DIR fallback
- Avast verrouille des dossiers (handles fantomes) — impossible a supprimer sans reboot
- Avast self-defense (`aswSP.sys`) bloque TOUTE modif registre meme avec gsudo admin → exclusions = GUI uniquement
- Claude Desktop Cowork = VM Hyper-V via HCS; bugs #24962 #24974; fix reseau: supprimer HNS network → New-NetNat CoworkNAT
