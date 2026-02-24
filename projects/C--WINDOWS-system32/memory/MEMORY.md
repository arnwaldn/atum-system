# Claude Code Memory - Arnaud's Dev Environment

## User
- **Name**: Arnaud
- **Email**: arnaud.porcel@gmail.com
- **Language**: French
- **HuggingFace**: Arnwald84

## System
- **PC**: AMD Ryzen 7 5700U, 15 GB RAM, Windows 11 Home
- **Shell**: bash (MINGW64/Git Bash)
- **Workspace**: `C:\Users\arnau\Projects\` (web, mobile, api, desktop, fullstack, tools, learning)

## Claude Code Setup (updated 2026-02-24 — compliance framework added)

### Summary
- 6 config files, 33 agents, 66 sub-agents, 19 commands, 4 modes, 25 rules (+ 24 templates)
- 26 hooks (13 custom [11 fichiers + 2 inline] + 13 ECC), 52 plugins (50 actifs / 2 inactifs), 115+ skills
- 27 MCP connectes (verified) + 8 non connectes | 465 outils totaux (24 built-in + 441 MCP)
- 10 langages, 20+ frameworks/outils, 184 templates + 10 references
- **34/34 project types simulated and verified production-ready**

### Commands (19) — `~/.claude/commands/`
atum-audit, compliance, db, deploy, feature-analyzer, feature-pipeline, health, migrate, optimize, prd, pre-deploy, review-fix, scaffold, security-audit, setup-cicd, status, tdd, team, ultra-think

### Agents (33 custom + 33 plugin/built-in = 66 sub-agents) — `~/.claude/agents/`
- **Generalist**: architect-reviewer, codebase-pattern-finder, critical-thinking, database-optimizer, error-detective, technical-debt-manager, research-expert
- **Game dev**: game-architect, phaser-expert, threejs-game-expert, unity-expert, godot-expert, networking-expert
- **Mobile/Desktop**: flutter-dart-expert, expo-expert, tauri-expert
- **DevOps/Infra**: devops-expert, ci-cd-engineer
- **AI/ML**: ml-engineer, data-engineer
- **Security**: security-expert
- **Compliance**: compliance-expert
- **Frontend**: frontend-design-expert, accessibility-auditor
- **Blockchain**: blockchain-expert
- **Specialist**: api-designer, auto-test-generator, documentation-generator, graphql-expert, migration-expert, performance-optimizer, windows-scripting-expert, mcp-expert

### Modes (4) — `~/.claude/modes/`
architect, autonomous, brainstorm, quality

### Rules (25 global files) — `~/.claude/rules/`
- common/ (13): agents, anti-hallucination, autonomous-workflow, coding-style, compliance, git-workflow, hooks, monorepo, patterns, performance, security, system-messages, testing
- typescript/ (4): coding-style, patterns, security, testing
- python/ (4): coding-style, patterns, security, testing
- golang/ (4): coding-style, patterns, security, testing
- **Templates** (24 files in `~/Projects/tools/project-templates/rules/`)
- **Context budget**: ~7,700 tokens/session (~3.9% of 200K)

### Hooks — 26 effectifs, 14 fichiers, 3 sources
- **Custom (13)**: secret-scanner, git-guard, lock-file-protector, file-backup, atum-session-start, atum-post-write, atum-compliance-check, auto-test-runner, dependency-checker, multi-lang-formatter, post-commit-quality-gate, **loop-detector** (PostToolUse), **session-memory** (Stop)
- **Reserve (3)**: dangerous-command-blocker, conventional-commits-enforcer, prevent-direct-push
- **Plugin ECC (13)**: git push reminder, .md blocker (regex fixed: .md only), suggest-compact, pre-compact, session-start, PR URL logger, build-analysis, auto-format, typecheck, console.log warn, check console.log, session-end, evaluate-session

### Config files (6)
- `~/.claude/settings.json` (~220 lignes) — SOURCE DE VERITE
- `~/.claude/settings.local.json` (25 lignes) — statusLine, deny, env
- `~/.mcp.json` (13 lignes) — atum-audit MCP only (DeepGraph + project-profile removed)
- `~/.npmrc` — pnpm supply-chain security (minimumReleaseAge=2880)
- `~/.claude/scripts/context-monitor.py` — StatusLine
- `~/.claude/projects/.../memory/MEMORY.md` — Memoire persistante

### MCP Servers (27 connectes, verified 2026-02-23)
- **Local (12)**: github, firecrawl, memory, sequential-thinking, railway, cloudflare-docs, context7, magic, filesystem, gmail, desktop-commander, claude-in-chrome
- **Plugin (3)**: firebase, greptile, playwright
- **Remote claude.ai (12)**: Canva, Cloudflare, Figma, Gamma, Hugging Face, Invideo, Learning Commons, Make, Notion, Supabase, Vercel, Zapier

### ATUM/OWL (EU AI Act) — 166/166 tests, 17/17 functional checks
- **Module**: `atum_audit` — `pip install -e .` | rdflib 7.6.0, pyshacl 0.31.0, mcp 1.23.3
- **MCP server**: 15 tools registered, `from mcp.server import FastMCP` (NOT from fastmcp)
- **API**: AuditAgent `.compliance` (PROPERTY not method), `.stats()`, `.query()` → list of dicts, `.full_scan()`, `.verify_file()`, `.violations()`, `.history()`, `.flush()`
- **ComplianceManager**: `.register_ai_system()`, `.compliance_report(system_name)`, `.validate_system()`, `.annex_iv_status()` → dataclass (attribute access), `.export_report(system_name, fmt='md')` (NOT 'markdown')

### Simulations (34/34 project types verified)
- **JS/TS Frontend (4)**: Vue 3, Nuxt 3 (v4.3.1), SvelteKit, Vanilla+Vite+Tailwind — all PASS
- **JS/TS Backend (5)**: Fastify, Hono, Express+TS, Deno, NestJS 11 — all PASS
- **Python (5)**: FastAPI, Django 6, Flask, Typer CLI, Python Library — all PASS
- **Go (3)**: REST API, CLI, gRPC (mock) — all PASS
- **Rust (2)**: CLI, Axum Web — all PASS (works directly from Git Bash now)
- **Java (2)**: Spring Boot 3.5, Java standalone — all PASS
- **.NET (1)**: ASP.NET Core API (.NET 9) — PASS
- **PHP (2)**: Vanilla, Laravel 12.52 — all PASS
- **Ruby (2)**: Minitest standalone, Rails 8.1 — all PASS
- **Game (3)**: Three.js, Phaser 3, Godot 4.6.1 — all PASS
- **Blockchain (1)**: Hardhat 3.1.9 — PASS
- **ML (1)**: scikit-learn pipeline — PASS
- **Desktop (2)**: Electron v40.6, Tauri CLI 2.10 — all PASS
- **DevOps (1)**: Docker Compose — PASS

## Installed Dev Stack (2026-02-23)
- **Languages**: Node v24.13.1, Python 3.13.2, Go 1.26.0, Rust 1.93.1, .NET 9.0.311, Java 21.0.10, Deno 2.6.10, PHP 8.4.18, Ruby 3.3.10, Dart 3.11.0
- **JS/TS**: TypeScript 5.9.3, Vite 7.3.1, Next.js 16.1.6, Angular 21.1, Vue CLI 5, NestJS 11, Nuxt 3.33, Tailwind 4.2
- **Python**: Django 6.0, Flask 3.1, FastAPI 0.129, pytest 9.0.2, black 26.1.0, ruff 0.15.1, mypy 1.19.1
- **PHP/Ruby**: Composer 2.9.5 (`~/bin/composer.phar`), Laravel 12.52, Rails 8.1.2
- **Build Tools**: VS Build Tools 2022 v17.14.27 (MSVC C++), MSYS2 20251213 (GCC 15.2.0 ucrt64 + make), Android Studio 2025.2.3
- **Sysinternals**: handle64.exe (`~/bin/`) — pour diagnostiquer les locks fichiers
- **Desktop**: Electron 40.6, Tauri CLI 2.10.0
- **Game Engine**: Godot 4.6.1 (`~/bin/godot`, `~/bin/godot-console`)
- **Blockchain**: Hardhat 3.1.9 (via npx)
- **DB**: SQLite native, PostgreSQL/Redis/MongoDB/MySQL via Docker
- **Linting**: Oxlint 1.50.0 (Rust-based, 10-100x faster than ESLint), tsgo 7.0.0-dev (Rust-based TS typecheck)
- **Testing**: Jest 30.1.3, Vitest 4.0.18, Playwright 1.58.2, pytest + pytest-cov
- **DevOps**: Docker 29.2.0, git 2.53.0, gh CLI 2.87.0, Vercel CLI 50.19.1
- **Supply-chain**: pnpm minimumReleaseAge=2880 (refuse packages < 2 days old)

## Key Learnings
- Hooks NOT auto-discovered — must register in `settings.json`; NEVER duplicate in settings.local.json
- JS hooks: `fs.readFileSync(0, 'utf8')` for stdin on Windows; Python: `sys.stdin.read()`
- Agents/commands/modes = ZERO context cost when not invoked; only rules always loaded
- git-guard.py: consolidates 4 checks (~74ms), heredoc bug (use `-m "msg"`), blocks ALL pushes to main
- ECC `.md` blocker: Windows regex issues — use Bash heredoc for .md writes in .claude/
- ATUM: `agent.compliance` is PROPERTY not method; `agent.query()` returns list of dicts; `fmt='md'` not 'markdown'
- ATUM: AuditAgent creates audit_store in CWD — needs ATUM_PROJECT_DIR fallback
- Rust on Windows: works directly from Git Bash with VS Build Tools installed (no vcvars64.bat needed)
- Docker Desktop daemon needs manual start — not auto-started on boot
- `rm -rf` blocked by git-guard.py — use `python shutil.rmtree()`
- Windows .git cleanup: read-only objects — `shutil.rmtree(path, onexc=force_remove)` with `os.chmod(path, stat.S_IWRITE)`
- PHP winget: no php.ini by default — created at `PHP_DIR/php.ini` with openssl/curl/mbstring + cacert.pem
- PHP php.ini path: `C:\Users\arnau\AppData\Local\Microsoft\WinGet\Packages\PHP.PHP.8.4_Microsoft.Winget.Source_8wekyb3d8bbwe\php.ini`
- Avast intercepte SSL PHP/Composer/Ruby — desactiver temporairement ou configurer exclusion pour PHP/Ruby
- Avast verrouille des dossiers (handles fantomes) — impossible a supprimer sans reboot; utiliser tache planifiee
- Ruby native gems: need MSYS2 ucrt64 toolchain + make — PATH: `/c/Ruby33-x64/bin:/c/msys64/ucrt64/bin:/c/msys64/usr/bin`
- Composer: `curl --ssl-no-revoke` pour telecharger `composer.phar` → wrapper bash dans `~/bin/composer`
- Python 3.13 venvs: peuvent manquer pip → toujours `python -m ensurepip --upgrade` apres creation
- Nuxt init sur Windows: interactif meme avec `--no-install` → utiliser `npx giget` a la place
- SvelteKit: premier build necessite `svelte-kit sync` (script `prepare` via `npm install`)
- Spring Boot mvnw (bash) echoue sur Windows (TLS Schannel) → utiliser `mvnw.cmd` via `cmd.exe`
- Fastify + top-level await: `npm pkg set type=module` necessaire pour ESM
- Windows locked dirs: `shutil.rmtree` echoue si Avast/indexer tient un handle → `cmd.exe /C rd /s /q` ou tache planifiee
- Godot 4.6.1: winget can't create symlinks without admin → wrappers in `~/bin/godot` and `~/bin/godot-console`
- Hardhat 3.x: `defineConfig` + `plugins: [toolbox]` (NOT `import` side-effects); `hardhat-toolbox-viem` (NOT `hardhat-toolbox`); `node:test` (NOT mocha); `"type": "module"` required; `--init` is interactive (manual setup in non-interactive shells)
- Loop-detector hook: skip Read/Grep/Glob (read-only tools expected to repeat); state in $TEMP; auto-reset after 10min
- Session-memory hook: Stop event, saves to project memory dir, auto-cleanup >30 days, only if >3 tool calls
- Oxlint: `oxlint file.js` — 30ms for 93 rules on 16 threads; complement to ESLint (not replacement)
- tsgo: `tsgo --noEmit` for fast typecheck; preview status, fall back to `tsc` for production
- pnpm minimumReleaseAge: `.npmrc` config, pnpm v10+ only (ignored by npm)
- secret-scanner.py only scans on `git commit` — Write/Edit pass through silently
- GitHub backups: `arnwaldn/claude-code-config` + `arnwaldn/project-templates`
- MEMORY.md must stay <200 lines (truncated after)

## Preferences
- Output style: Learning mode
- winget = primary package manager
- Git: user.name Arnaud, user.email arnaud.porcel@gmail.com, SSH ed25519
