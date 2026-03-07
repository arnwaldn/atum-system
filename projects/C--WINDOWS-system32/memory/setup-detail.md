# Claude Code Setup Detail

Updated 2026-03-07 — v2.1.63 + context optimization

## Commands (30) — `~/.claude/commands/`
agence-atum, atum-audit, compliance, db, deploy, feature-analyzer, feature-pipeline, happy, health, migrate, optimize, pipeline, prd, pre-deploy, projet, projet-automatisation, review-fix, scaffold, schedule, security-audit, session-analyzer, setup-cicd, status, tdd, team, ultra-think, webmcp, website, whatsapp

## Agents (37 custom + 34 plugin/built-in, all scoped with YAML frontmatter) — `~/.claude/agents/`
- **Generalist**: architect-reviewer, codebase-pattern-finder, critical-thinking, database-optimizer, error-detective, technical-debt-manager, research-expert
- **Game dev**: game-architect, phaser-expert, threejs-game-expert, unity-expert, godot-expert, networking-expert
- **Mobile/Desktop**: flutter-dart-expert, expo-expert, tauri-expert, happy-expert
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

## Modes (4) — `~/.claude/modes/`
architect, autonomous, brainstorm, quality

## Rules — `~/.claude/rules/`
- common/ (13 after optimization): anti-hallucination, autonomous-workflow, coding-style, compliance, decision-principle, git-workflow, hooks, patterns, pedagogie, performance, security, system-messages, testing
- typescript/ (4): coding-style, patterns, security, testing
- python/ (4): coding-style, patterns, security, testing
- golang/ (4): coding-style, patterns, security, testing
- Templates (24 files in `~/Projects/tools/project-templates/rules/`)

## Hooks — 28 entries settings.json, 20 scripts
- **Custom (20)**: clean-shell-snapshots, secret-scanner, git-guard, lock-file-protector, backup, atum-session-start, atum-post-write, atum-compliance-check, auto-test-runner, dependency-checker, auto-format.sh, typecheck.sh, post-commit-quality-gate, worktree-setup, loop-detector, session-memory, collective-memory-retain, atum-dashboard-sync, atum-project-scanner, collective-memory-start, post-tool-failure-logger, config-change-guard
- **Notification (2)**: permission_prompt beep, idle_prompt beep
- **Reserve (3)**: dangerous-command-blocker, conventional-commits-enforcer, prevent-direct-push

## Config files (6)
- `~/.claude/settings.json` (~220 lignes) — SOURCE DE VERITE
- `~/.claude/settings.local.json` — statusLine, deny, env
- `~/.mcp.json` — atum-audit MCP (Claude Desktop)
- `~/.npmrc` — pnpm supply-chain security
- `~/.claude/scripts/context-monitor.py` — StatusLine

## MCP Servers (46 OK, audited 2026-03-06)
- **Local (17)**: github, memory, sequential-thinking, vercel, railway, cloudflare-docs, context7, magic, google-workspace (83 outils, OAuth), desktop-commander, b12, webmcp, skillsync, atum-audit, notion, airtable, whatsapp
- **No-code local (3)**: figma, webflow, make (dupliques remotes)
- **Plugin (2/3)**: firebase, playwright | greptile disabled
- **Remote claude.ai (23)**: Canva, Cloudflare, Cloudinary, Context7, Excalidraw, Figma, Gamma, Gmail, Google Calendar, GraphOS, Hugging Face, Invideo, Jam, Learning Commons KG, Make, Microsoft Learn, Netlify, Notion, Stripe, Supabase, Vercel, Webflow, Zapier

## Standalone Skills (40) — `~/.claude/skills/`
- **Documents**: pdf, docx, xlsx, pptx
- **Architecture**: domain-driven-design, clean-architecture, system-design, ddia-systems
- **Orchestration**: common-ground, autonomous-routing
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
- **Browser**: agent-browser, terminal-emulator
- **Memory**: memoire
- **Backend**: resilience (ex-rule)
- **Monorepo**: monorepo (ex-rule)
- **WhatsApp**: whatsapp (ex-rule, persona Cloclo)

## Agence ATUM SAS — Systeme Admin (v2.0)
- **Skill**: `~/.claude/skills/agence-atum/SKILL.md` + 6 references
- **Command**: `/agence-atum` — 16 sous-commandes
- **Agent**: `agence-atum-expert`
- **Data store**: `~/.claude/data/agence-atum/` — 15 JSON
- **Templates**: 13 modeles
- **Scheduler**: 7 taches

## ATUM/OWL (EU AI Act) v2.0.0
- **Module**: `atum_audit` at `~/Documents/projets/agent-owl/`
- **MCP server**: 15 tools, `from mcp.server import FastMCP` (NOT from fastmcp)
- **API**: `AuditAgent(config_path='...')` — `.compliance` (PROPERTY), `.stats()`, `.query()` → list of dicts, `.full_scan()`, `.verify_file()`, `.violations()`, `.history()`, `.flush()`
