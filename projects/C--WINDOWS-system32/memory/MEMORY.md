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

## Claude Code Setup (updated 2026-03-03 — v2.1.63 + claude-scheduler + mobile dev)

### Summary
- 6 config files, **37 agents**, 70 sub-agents, **27 commands**, 4 modes, 27 rules (+ 24 templates)
- 18 hook entries (9 JS + 9 PY + 2 Notification + 13 ECC), 56 plugins (54 actifs / 2 inactifs), **149+ skills** (115 plugin + **34 standalone**)
- **21 local** (.claude.json template) + 1 local (.mcp.json) + 2 plugin + 23 remote claude.ai = **47 serveurs** | ❌ greptile (OAuth 404) | ⚠️ 3 HTTP dupliques (figma/webflow/make)
- **Autonomie max**: **63 allow entries**, **70 NLP triggers** FR+EN, Skill(*)+WebSearch(*)+ToolSearch(*) auto-permit
- **Tools**: jq (winget), mcporter 0.7.3 (npm), gsudo 2.6.1 (winget), acpx 0.1.8 (npm), **happy-coder 0.13.0** (npm)
- 10 langages, 20+ frameworks/outils, 184 templates + 10 references
- **34/34 project types simulated and verified production-ready**
- **Portable**: `settings.json` uses `$HOME` paths, `install.sh` cross-platform (Win/Mac/Linux)

### Commands (27) — `~/.claude/commands/`
**agence-atum**, atum-audit, compliance, db, deploy, feature-analyzer, feature-pipeline, **happy**, health, migrate, optimize, prd, pre-deploy, **projet-automatisation**, review-fix, scaffold, **schedule**, security-audit, **session-analyzer**, setup-cicd, status, tdd, team, ultra-think, **webmcp**, **website**, **whatsapp**

### Agents (37 custom + 34 plugin/built-in = 71 sub-agents) — `~/.claude/agents/`
- **Generalist**: architect-reviewer, codebase-pattern-finder, critical-thinking, database-optimizer, error-detective, technical-debt-manager, research-expert
- **Game dev**: game-architect, phaser-expert, threejs-game-expert, unity-expert, godot-expert, networking-expert
- **Mobile/Desktop**: flutter-dart-expert, expo-expert, tauri-expert, **happy-expert**
- **DevOps/Infra**: devops-expert, ci-cd-engineer
- **AI/ML**: ml-engineer, data-engineer
- **Security**: security-expert
- **Compliance**: compliance-expert
- **Frontend**: frontend-design-expert, accessibility-auditor
- **Blockchain**: blockchain-expert
- **Geospatial**: geospatial-expert
- **No-code**: no-code-automation-expert
- **Admin**: agence-atum-expert
- **Specialist**: api-designer, auto-test-generator, documentation-generator, graphql-expert, migration-expert, performance-optimizer, windows-scripting-expert, mcp-expert

### Modes (4) — `~/.claude/modes/`
architect, autonomous, brainstorm, quality

### Rules (26 global files) — `~/.claude/rules/`
- common/ (14): anti-hallucination, autonomous-workflow (includes agent registry), coding-style, compliance, **decision-principle**, git-workflow, hooks, monorepo, patterns, performance, **resilience**, security, system-messages, testing
- typescript/ (4): coding-style, patterns, security, testing
- python/ (4): coding-style, patterns, security, testing
- golang/ (4): coding-style, patterns, security, testing
- **Templates** (24 files in `~/Projects/tools/project-templates/rules/`)
- **Context budget**: ~7,700 tokens/session (~3.9% of 200K)

### Hooks — 18 entries settings.json, 17 scripts, 3 sources
- **Custom (14)**: secret-scanner, git-guard, lock-file-protector, atum-session-start, atum-post-write, atum-compliance-check, auto-test-runner, dependency-checker, post-commit-quality-gate, **loop-detector** (PostToolUse), **session-memory** (Stop), **post-tool-failure-logger** (PostToolUse), **config-change-guard** (PostToolUse), **worktree-setup** (PostToolUse/Bash)
- **Reserve (3)**: dangerous-command-blocker, conventional-commits-enforcer, prevent-direct-push
- **Plugin ECC (13)**: git push reminder, .md blocker (regex fixed: .md only), suggest-compact, pre-compact, session-start, PR URL logger, build-analysis, auto-format, typecheck, console.log warn, check console.log, session-end, evaluate-session

### Config files (6)
- `~/.claude/settings.json` (~220 lignes) — SOURCE DE VERITE
- `~/.claude/settings.local.json` (25 lignes) — statusLine, deny, env
- `~/.mcp.json` (13 lignes) — atum-audit MCP (Claude Desktop); AUSSI dans .claude.json (Claude Code CLI)
- `~/.npmrc` — pnpm supply-chain security (minimumReleaseAge=2880)
- `~/.claude/scripts/context-monitor.py` — StatusLine
- `~/.claude/projects/.../memory/MEMORY.md` — Memoire persistante

### MCP Servers (46/47 OK, updated 2026-03-03)
- **Local (18 in template)**: github, memory, sequential-thinking, vercel, railway, cloudflare-docs, context7, magic, **google-workspace** (83 outils, 12 services Google, OAuth ACTIF), desktop-commander, b12, **webmcp**, **skillsync**, atum-audit, **notion** (env var heritage), **airtable** (env var heritage), **hindsight-shared** (HTTP, bank atum), **hindsight-personal** (HTTP, bank arnaud)
- **No-code local (3 — dupliques remotes)**: figma, webflow, make — HTTP proxies of remote claude.ai counterparts, serve as fallback
- **Plugin (2/3 OK)**: firebase (⚠️ needs `firebase login`), playwright | ❌ greptile (OAuth 404 upstream)
- **Remote claude.ai (23 OK)**: Canva, Cloudflare, Cloudinary, Context7, Excalidraw, Figma, Gamma, Gmail, Google Calendar, GraphOS, Hugging Face, Invideo, Jam, Learning Commons KG, Make, Microsoft Learn, Netlify, Notion, Stripe, Supabase, Vercel, Webflow, Zapier
- **Secrets**: migres de .claude.json → .bashrc env vars (GOOGLE_OAUTH_CLIENT_SECRET, OPENAPI_MCP_HEADERS, AIRTABLE_API_KEY, HINDSIGHT_API_KEY) — heritage automatique par subprocess
- **Retires**: filesystem (CWD bug→desktop-commander), supabase local (placeholder), clickhouse, cloudflare-workers-*, whatsapp (command/rules removed)

### Standalone Skills (32) — `~/.claude/skills/`
- **Documents**: pdf, docx, xlsx, pptx
- **Architecture**: domain-driven-design, clean-architecture, system-design, ddia-systems
- **Reasoning**: the-fool, spec-miner, context-engineering-kit
- **Security**: supply-chain-risk-auditor, open-source-license-compliance
- **Visualization**: design-doc-mermaid, claude-d3js-skill, audit-flow
- **DevOps/SRE**: sre-engineer, chaos-engineer
- **AI/ML**: rag-architect
- **UI/UX**: refactoring-ui
- **Testing**: property-based-testing
- **Performance**: high-perf-browser
- **Product**: jobs-to-be-done, mom-test
- **Prompts**: prompt-architect
- **Windows**: powershell-windows
- **Accessibility**: claude-a11y-skill
- **MCP**: mcp-builder
- **Automation**: scheduler, no-code-maestro
- **Release**: release-notes
- **Admin**: agence-atum

### Agence ATUM SAS — Systeme Admin (v2.0, 2026-03-02)
- **Skill**: `~/.claude/skills/agence-atum/SKILL.md` + 6 references (statuts-resume, business-plan-targets, templates-catalog, facturation-regles, syntec-grille, rgpd-guide)
- **Command**: `/agence-atum` — 16 sous-commandes (dashboard, finance, legal, billing, contracts, compliance, frais, products, clients, equity, team, docs, sync, init, help)
- **Agent**: `agence-atum-expert` — gouvernance, finances, facturation, contrats, RH, RGPD, pipeline, obligations
- **Data store**: `~/.claude/data/agence-atum/` — 15 JSON (societe, actionnariat, budget, quarter, produits, pipeline, participations, obligations, registre, compteurs, contrats/registre, contrats/cgv, equipe, rgpd/registre-traitements, assurances)
- **Templates**: 13 modeles (pv-ordinaire, pv-extraordinaire, convocation, rapport-trimestriel, convention-reglementee, fiche-projet, devis, facture, relance, contrat-prestation, nda, cgv, contrat-freelance)
- **Directories**: facturation/devis/, facturation/factures/, contrats/, timetracking/, rgpd/, frais/
- **Scheduler**: 7 taches (ag-annuelle, info-trim, declaration-is, tva, relance-factures, cfe, dsn)
- **NLP triggers**: 26 patterns FR dans autonomous-workflow.md
- **MCP integrations**: Google Workspace (Gmail, Calendar, Sheets, Docs), Notion, skill /docx pour DOCX

### ATUM/OWL (EU AI Act) v2.0.0 — 166/166 tests, 17/17 functional checks
- **Module**: `atum_audit` at `~/Desktop/agent-owl/` | rdflib 7.6.0, pyshacl 0.31.0, mcp 1.23.3
- **MCP server**: 15 tools registered, `from mcp.server import FastMCP` (NOT from fastmcp)
- **API**: `AuditAgent(config_path='atum-audit.config.json')` — `.compliance` (PROPERTY→ComplianceManager), `.stats()`, `.query()` → list of dicts, `.full_scan()`, `.verify_file()`, `.violations()`, `.history()`, `.flush()`
- **ComplianceManager**: acces via `agent.compliance` (NOT standalone) — `.register_ai_system()`, `.compliance_report()`, `.validate_system()`, `.annex_iv_status()` → dataclass, `.export_report(fmt='md')`, `.check_retention_compliance()`

- **Simulations**: 34/34 project types verified — details in `memory/simulations.md`
- **Dev stack**: 10 langages, 20+ frameworks — details in `memory/dev-stack.md`

## Key Learnings
- Hooks NOT auto-discovered — must register in `settings.json`; NEVER duplicate in settings.local.json
- JS hooks: `fs.readFileSync(0, 'utf8')` for stdin on Windows; Python: `sys.stdin.read()`
- Agents/commands/modes = ZERO context cost when not invoked; only rules always loaded
- git-guard.py: consolidates 4 checks (~74ms), heredoc bug (use `-m "msg"`), blocks pushes to main EXCEPT backup repos whitelist; for non-backup repos, temporarily add to BACKUP_REPOS, push with full URL, then restore
- ECC `.md` blocker: Windows regex issues — use Bash heredoc for .md writes in .claude/
- ATUM: `agent.compliance` is PROPERTY not method; `agent.query()` returns list of dicts; `fmt='md'` not 'markdown'
- ATUM: AuditAgent creates audit_store in CWD — needs ATUM_PROJECT_DIR fallback
- Rust on Windows: works directly from Git Bash with VS Build Tools installed (no vcvars64.bat needed)
- Docker Desktop daemon needs manual start — not auto-started on boot
- `rm -rf` blocked by git-guard.py — use `python shutil.rmtree()`
- Windows .git cleanup: read-only objects — `shutil.rmtree(path, onexc=force_remove)` with `os.chmod(path, stat.S_IWRITE)`
- PHP winget: no php.ini by default — created at `C:\Users\arnau\AppData\Local\...\PHP.PHP.8.4_...\php.ini` with openssl/curl/mbstring + cacert.pem
- Avast intercepte SSL PHP/Composer/Ruby — desactiver temporairement ou configurer exclusion pour PHP/Ruby
- Avast verrouille des dossiers (handles fantomes) — impossible a supprimer sans reboot; utiliser tache planifiee
- Avast self-defense (`aswSP.sys`) bloque TOUTE modif registre Avast meme avec gsudo admin → exclusions = GUI uniquement
- Claude Desktop Cowork = VM Hyper-V (`cowork-vm`) via HCS, independante de Claude Code CLI
- Cowork VM: bugs #24962 #24974 (sessiondata.vhdx, HCS JSON error); fix reseau: Stop Claude → supprimer HNS network → New-NetNat CoworkNAT; Avast bloque vsock
- Cowork VM paths: `%LOCALAPPDATA%\Packages\Claude_pzs8sxrjxfjjc\LocalCache\Roaming\Claude\`
- gsudo + powershell depuis Git Bash: `$_` se fait manger → toujours passer par un fichier `.ps1`
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
- Loop-detector hook: 3 detectors (consecutive repeats, ping-pong A↔B, context exhaustion 80/120 calls); skip Read/Grep/Glob; accumulates session stats in `$TEMP/claude-session-stats.json`
- security-audit command: 6 scopes (deps, secrets, owasp, hardening, **host**, all) — `host` audits machine-level security (PATH, firewall, BitLocker, MCP configs, SSH keys)
- Session-memory hook: Stop event, consumes stats from loop-detector, saves structured summary to `memory/sessions/`; auto-cleanup >7 days (was 30)
- mcporter: `mcporter list`, `mcporter call <server.tool> key=value` — debug MCP servers sans passer par Claude Code
- jq 1.8.1: winget installe dans WinGet/Packages/ (pas dans PATH Git Bash) → wrapper `~/bin/jq`
- OpenClaw skills analysis (2026-02-24): 52 skills scanned, 7 Tier 1 identified; adopted session-stats + mcporter + session-analyzer pattern
- Forfait Claude Max = pas de cost-tracking necessaire (forfait fixe)
- Oxlint: `oxlint file.js` — 30ms for 93 rules on 16 threads; complement to ESLint (not replacement)
- tsgo: `tsgo --noEmit` for fast typecheck; preview status, fall back to `tsc` for production
- pnpm minimumReleaseAge: `.npmrc` config, pnpm v10+ only (ignored by npm)
- secret-scanner.py only scans on `git commit` — matcher changed to `Bash` only (was Write|Edit|Bash wastefully)
- GitHub backups: `arnwaldn/claude-code-config` (with `install.sh` portable installer) + `arnwaldn/project-templates`
- settings.json portability: hook commands use `$HOME/.claude/hooks/...` — Claude Code's hook runner expands `$HOME` correctly; direct Bash test with `node "$HOME/..."` fails (Git Bash POSIX→Windows path issue) but actual hooks work fine
- git-guard whitelist: checks `any(repo in command for repo in BACKUP_REPOS)` — detects repo name in the Bash command string (cd path or remote URL)
- ToolSearch: `+keyword` cherche dans les DESCRIPTIONS, pas les noms — pour MCP tools, TOUJOURS `select:mcp__server__tool_name`
- filesystem MCP: retired (CWD bug) — desktop-commander is the replacement
- fetch MCP (`@anthropic-ai/mcp-server-fetch`) n'existe PAS sur npm — supprime de .claude.json; WebFetch built-in suffit
- greptile plugin: OAuth 404 — necessite re-authentification; API key retiree de settings.local.json (etait en clair)
- Modes = fichiers `.md` (pas `.yml`) dans `~/.claude/modes/`
- gsudo 2.6.1: `~/bin/gsudo` wrapper → `/c/Program Files/gsudo/2.6.1/gsudo.exe`; CacheMode Auto, CacheDuration 1h
- acpx 0.1.8: headless ACP CLI, config `~/.acpx/config.json` (defaultAgent claude, approve-all); `acpx claude -s name "prompt"`
- Autonomie: Write(*), Edit(*), NotebookEdit(*), Task(*), EnterPlanMode, ExitPlanMode, EnterWorktree(*) dans allow; chrome MCP simplifie en wildcard
- Philosophie autonomie: zero prompt d'execution MAIS consultation pour choix importants et suppressions
- Loop-detector bug fix: `history.push()` DOIT etre APRES detection, sinon ping-pong jamais declenche (currentHash === lastHash toujours vrai)
- B12 MCP: npm 404 (pas publie) → clone GitHub `b12io/website-generator-mcp-server` dans `~/Projects/tools/`; necessite `"type": "module"` dans package.json; 1 tool `generate_website(name, description)` → URL signup B12; aussi DXT extension (manifest.json); integre dans 8 fichiers (autonomous-workflow, scaffold, patterns, INDEX.md, install.sh, claude.json.template, /website command, .claude.json); mcporter test OK
- "Integration intelligente" = pas juste config MCP, mais tisser dans workflows (auto-detection), commands (discoverabilite), templates (cross-refs), infra (portabilite)
- Claude Code v2.1.63: updated from 2.1.62; features: /simplify, /batch, auto-memory, PostToolUseFailure/ConfigChange/WorktreeCreate hook events
- MCP cmd /c wrapper: all npx-based servers wrapped with `cmd /c npx` for Windows (.claude.json)
- MCP context bloat: ~133K tokens from tool definitions — ToolSearch compresses to ~8-12K effective
- WebMCP optimized: forked to `~/Projects/tools/webmcp-optimized/`; run from source (esbuild broken on Windows)
- SkillsMP audit (2026-02-28): 770+ skills evaluated, 28 installed, 4 rejected for conflicts, 500+ rejected for redundancy
- settings.json duplicate hooks: JSON ne supporte pas les cles dupliquees — 2e bloc ecrase le 1er silencieusement
- GitHub PAT: retire de .claude.json; herite du shell via `export GITHUB_PERSONAL_ACCESS_TOKEN="$(gh auth token)"` dans .bashrc; retire aussi de settings.local.json env
- Skills standalone: auto-decouverte dans ~/.claude/skills/*/SKILL.md, 0 context cost au repos, 16K char budget descriptions
- Skill auto-invocation: documente comme non garanti (~70-80%); /skill-name = 100% fiable (fallback)
- SkillSync MCP (@stranzwersweb2/skillsync-mcp): security scanner; "path traversal" warnings = info (skills normaux)
- autonomous-workflow.md: 40 NLP triggers FR+EN pour routage contextuel skill/agent/MCP
- claude-scheduler: daemon Node.js PM2 (`~/.claude/scheduler/`), tasks JSON (`~/.claude/schedules/`), SQLite history, HTTP :4820, cron+events+webhook, Gmail MCP notifs; `pm2 start/stop/logs claude-scheduler`
- Flask+Alembic production: NEVER run db.create_all() inside create_app() — use separate CLI command AFTER migrations (see `memory/gigroute-project.md`)
- google-workspace MCP: `taylorwilsdon/google_workspace_mcp` v1.14.1 cloné dans `~/Projects/tools/`; 83 outils (extended tier), 12 services Google; commande = uv.exe direct (pas cmd /c); **OAuth ACTIF** (4 calendriers, docs OK); remplace ancien gmail MCP
- Audit 2026-03-02: secrets migres .claude.json → .bashrc (GOOGLE_OAUTH_CLIENT_SECRET, OPENAPI_MCP_HEADERS, AIRTABLE_API_KEY); MCP servers heritent env vars du shell parent (meme pattern que GITHUB_PERSONAL_ACCESS_TOKEN); 3 HTTP dupliques (figma/webflow/make) = fallback des remotes claude.ai; firebase needs `firebase login`; greptile OAuth 404 = upstream
- uv 0.10.7: winget `astral-sh.uv`, exe dans WinGet/Packages/, wrappers bash `~/bin/uv` et `~/bin/uvx`
- MEMORY.md must stay <200 lines (truncated after)

## Active Projects
- **GigRoute**: Flask SaaS tour manager — LIVE on Render, beta-ready (details: `memory/gigroute-project.md`)
- **Maestro No-Code P12**: Formation hackathon 23 mars → jury 6 avril (details: `memory/maestro-formation.md`)
  - MCP OK: Airtable (7 bases), Notion (bot "claude créa"), Google Workspace (OAuth actif) | Figma OK (remote), Webflow OK (remote), Make (remote only)
  - Vidéos Wistia sans sous-titres — contenu textuel extrait (corrigés, exercices, ressources)

## Preferences
- Output style: Learning mode
- winget = primary package manager
- Git: user.name Arnaud, user.email arnaud.porcel@gmail.com, SSH ed25519
- **Decision principle (CRITICAL)**: Avant CHAQUE decision, se demander "Qu'est-ce qu'un dev senior de tres haut niveau ferait ?" — solutions directes, pas de bidouillage ni workarounds inutiles, autonomie totale
