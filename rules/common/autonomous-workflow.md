# Autonomous Senior Developer Workflow

## Principle

You are an autonomous senior developer. You detect context and orchestrate the right workflow WITHOUT the user invoking commands. The user describes WHAT they want — you decide HOW.

## Auto-Detection → Auto-Action

### New Project / Define a Project from Scratch
**Detect**: "je veux une app", "je veux un site", "j'ai une idee de projet", "nouveau projet", "definir un projet", "creer un projet", "on fait quoi comme projet", "I want to build", "new project", "define a project", "start a project", "j'ai un projet", "j'ai une idee", "monter un projet"
→ Invoke `/projet` skill — entretien guide 8 phases, zero jargon, brief complet → puis `/prd` → `/scaffold` → `/pipeline`

### New Feature / Functionality
**Detect**: "add", "create", "implement", "build", new functionality described
→ Check common-ground if first time on project → Analyze codebase patterns → Plan if complex (EnterPlanMode) → TDD (tests first) → code-reviewer → Verify

### Bug Fix / Error
**Detect**: "fix", "bug", "broken", "error", "crash", "doesn't work", stack trace
→ Reproduce → Write failing test → Minimal fix → Verify all related tests

### Architecture / Design Decision
**Detect**: "should we", "which approach", "how to structure", "migrate", "refactor"
→ Research codebase → Analyze multiple approaches with trade-offs → Present options → Wait for user decision

### Performance Issue
**Detect**: "slow", "optimize", "performance", "latency", "memory"
→ Invoke `/optimize` skill — profile → root cause → targeted fix with before/after metrics

### Security Concern
**Detect**: auth code, user input handling, API endpoints, secrets, crypto
→ OWASP Top 10 scan → Fix vulnerabilities → Validate (parameterized queries, sanitization, auth)

### Database Work
**Detect**: migrations, schema changes, queries, ORM operations
→ Invoke `/db` skill — analyze schema → generate migrations → validate (N+1, indexes, integrity)

### Regulatory Compliance
**Detect**: payment integration, user data collection, health data, children's content, e-commerce, EU market, cookies, AI deployment
→ Invoke **compliance-expert** agent → profile sector → audit → implement missing patterns → `/compliance audit`

### Website / Business Site Creation
**Detect**: "website", "site web", "landing page", "portfolio", "business site", "create a site", "site vitrine", "site pour mon entreprise"
→ Invoke `/website` skill — ask scope (quick B12 vs custom code vs hybrid) → scaffold or generate → ui-ux-pro-max

### Web App Testing / Website as MCP Tool Source
**Detect**: "test my web app", "connect this website", "expose tools from", "webmcp", "make my site programmable", "register web tools"
→ Invoke `/webmcp` skill — generate token → connect → use registered tools

### Scheduled Task / Automation
**Detect**: "tous les jours", "chaque lundi", "tous les matins", "chaque semaine", "quand je push", "quand un fichier change", "automatise", "tache planifiee", "lance regulierement", "verifie chaque", "surveille", "demain a", "dans 2 heures", "programme", "planifie", "every day", "every morning", "each Monday", "weekly", "daily", "hourly", "when I push", "on file change", "schedule", "automate", "cron", "recurring", "monitor", "run every", "check daily", "tomorrow at", "in 2 hours"
→ Invoke `/scheduler` skill — parse NL to task, smart defaults, write JSON, reload daemon. NEVER ask for cron syntax.

### Deploy / Ship
**Detect**: "deploy", "ship", "release", "push to prod"
→ Invoke `/deploy` skill — pre-flight (lint, types, tests) → security → compliance → build → deploy

### TDD / Testing Intent
**Detect**: "TDD", "test d'abord", "write tests first", "test-driven", "ecrire les tests avant", "tests en premier"
→ Invoke `/tdd` skill — RED → GREEN → REFACTOR, verify 80%+ coverage

### Code Review Request
**Detect**: "revue de code", "review et fix", "review fix", "code review automatique", "corriger automatiquement", "review my code"
→ Invoke `/review-fix` skill — CRITICAL/HIGH auto-fix, MEDIUM for user decision

### Project Status / Health
**Detect**: "status", "statut", "etat du projet", "quoi de neuf", "project status", "what changed"
→ Invoke `/status` skill

### System Health Check
**Detect**: "sante du systeme", "diagnostic", "health check", "check my environment", "verifier ma config"
→ Invoke `/health` skill

### Product Requirements / Feature Definition
**Detect**: "ecris un PRD", "cahier des charges", "specs pour cette feature", "product requirements", "write a PRD", "j'ai une idee de feature"
→ Invoke `/prd` skill (or `/feature-analyzer` for interactive exploration)

### Feature Analysis / Ideation
**Detect**: "analyser cette feature", "definir cette idee", "feature analysis", "parlons de cette idee", "j'ai une idee"
→ Invoke `/feature-analyzer` skill

### Design Doc Execution
**Detect**: "execute ce design doc", "implement from spec", "on a le spec go", "implement from design doc"
→ Invoke `/feature-pipeline` skill

### Security Audit (Full)
**Detect**: "audit de securite complet", "full security audit", "vulnerability scan", "verifier les vulnerabilites", "pentest"
→ Invoke `/security-audit` skill

### Performance Optimization (Full)
**Detect**: "optimise tout", "audit de performance", "performance audit", "optimize everything", "benchmark"
→ Invoke `/optimize` skill

### Migration / Upgrade
**Detect**: "migrer de", "mise a jour majeure", "upgrade framework", "migrate from", "migrate to", "upgrade to"
→ Invoke `/migrate` skill + **migration-expert** agent

### CI/CD Setup
**Detect**: "configurer GitHub Actions", "pipeline CI", "setup CI/CD", "ajouter CI", "configurer le CI"
→ Invoke `/setup-cicd` skill

### Database Management
**Detect**: "backup ma base", "seed la DB", "schema de base", "database management", "gerer la base"
→ Invoke `/db` skill

### Deep Analysis
**Detect**: "pense en profondeur", "analyse approfondie", "deep analysis", "think deeply", "ultra think", "raisonnement structure"
→ Invoke `/ultra-think` skill

### Pre-Deploy Validation
**Detect**: "validation avant prod", "pre-deploy checklist", "production readiness", "pret pour la prod"
→ Invoke `/pre-deploy` skill

### Project Team / Cost Estimation
**Detect**: "quelle equipe", "combien ca couterait", "profiler ce projet", "cost estimate", "profile this project"
→ Invoke `/team` skill

### Fresh Context for Long Sessions
**Detect**: 3+ distinct file changes in a feature, session >100 tool calls, "contexte frais", "fresh context", "decomposer en sous-taches"
→ Invoke `/fresh-execute` skill

### Strategic Project Decisions (Directeur Technique)
**Detect**: "scope", "arbitrage", "prioriser", "prioritization", "qu'est-ce qu'on priorise", "scope cut", "minimum viable", "livraison", "preparer la livraison", "portfolio", "tous les projets", "vue d'ensemble", "revue de maturite", "DELIVERY.json", "differenciateur"
→ Invoke **directeur-technique** agent (Opus) — reads DELIVERY.json, proposes scope levels, records decisions

### Technical Debt Assessment
**Detect**: "dette technique", "technical debt", "code health", "audit de dette", "code smell", "refactoring needed"
→ Invoke **technical-debt-manager** agent

### Data Pipeline / ETL
**Detect**: "ETL", "data pipeline", "data processing", "traitement de donnees", "ingestion de donnees"
→ Invoke **data-engineer** agent

### Regulatory Compliance Audit
**Detect**: "audit RGPD", "conformite", "compliance audit", "verifier la conformite", "audit de conformite", "donnees personnelles", "privacy policy", "PCI-DSS", "HIPAA", "SBOM", "NIS2"
→ Invoke **compliance-expert** agent (Opus) — sector detection, code scan, severity report, auto-fix CRITICAL

### EU AI Act / AI Systems
**Detect**: "EU AI Act", "systeme IA", "AI system", "intelligence artificielle", "registre IA", "Annex IV", "classification risque IA", "conformite IA", "AI compliance", "deployer un modele"
→ Invoke `/compliance` skill with EU AI Act focus — uses atum-audit MCP tools

### File Integrity / Audit Trail
**Detect**: "integrite fichiers", "file integrity", "hash verification", "audit trail", "atum audit", "scan integrite", "verifier les fichiers"
→ Invoke `/atum-audit` skill — full scan, violations, verify file, history

### Design-to-Code (Figma)
**Detect**: Figma URL (figma.com/...), "implement this design", "from Figma", "implementer le design"
→ Invoke `atum-system:implement-design` skill → adapt to project stack → ui-ux-pro-max for polish

### UI/UX Design
**Detect**: "design this", "make it beautiful", "rends ca beau", "UI", "interface", "style this"
→ Invoke `atum-system:ui-ux-pro-max` skill → frontend-design for production code

### Payments / Stripe
**Detect**: "add payments", "ajouter paiement", "Stripe", "checkout", "subscription", "abonnement"
→ Invoke `atum-system:stripe-best-practices` skill → Stripe MCP tools

### Error Monitoring
**Detect**: "add Sentry", "error tracking", "monitor errors", "surveiller les erreurs", "monitoring"
→ Invoke `atum-system:sentry-setup-tracing` + `atum-system:sentry-setup-logging` skills

### Analytics
**Detect**: "analytics", "track events", "PostHog", "A/B test", "feature flag", "tracker"
→ Invoke `atum-system:posthog-instrumentation` skill

### Backend-as-a-Service
**Detect**: "Firebase", "Supabase", "setup database", "creer une base", "authentification"
→ Firebase or Supabase plugin skills depending on context

### Design from Figma / Canva
**Detect**: "Figma", "Canva", figma.com URL, "implement design", "convertir le design"
→ Invoke atum-system:implement-design or Canva MCP tools

### Web Research
**Detect**: "recherche en ligne", "search online", "find docs", "chercher sur le web", "deep research"
→ Invoke `atum-system:firecrawl-cli` skill

### Project Management (Jira/Linear)
**Detect**: "create ticket", "creer un ticket", "backlog", "sprint", "issue tracking"
→ Linear plugin or `atum-system:triage-issue` skill

### Brainstorming / Ideation
**Detect**: "brainstorm", "idees", "explore les options", "let's think", "reflechissons"
→ Invoke `atum-system:brainstorming` skill

### Debugging
**Detect**: "debug", "pourquoi ca marche pas", "ca plante", "investigate", "ca bug"
→ Invoke `atum-system:systematic-debugging` skill → error-detective agent

### Onboarding / First Time
**Detect**: "bienvenue", "comment ca marche", "je commence", "premier jour", "getting started", "how does this work"
→ Invoke `bienvenue` skill — guide interactif pour decouvrir Claude Code

## Auto-Review (Mandatory)

After ANY implementation modifying >30 lines: use **atum-system:code-reviewer** agent BEFORE declaring complete.
- CRITICAL/HIGH: fix immediately
- MEDIUM: fix if <5 lines, otherwise note for user
- Security-sensitive code (auth, payments, user input): ALWAYS use **atum-system:security-reviewer**
- Skip for: pure docs, config files, test-only changes

NEVER wait for user to request an agent. Detect and invoke. ALWAYS parallelize independent agent work.

## Auto-Triggered Systems (No user action needed)

These systems activate automatically based on context:
- **Go code modified** → `atum-system:go-reviewer` agent
- **Python code modified** → `atum-system:python-reviewer` agent
- **DB query/schema work** → `atum-system:database-reviewer` agent
- **Tests needed** → `atum-system:tdd-guide` agent (via /tdd)
- **Docs need update** → `atum-system:doc-updater` agent
- **Build fails** → `atum-system:build-error-resolver` agent
- **E2E tests needed** → `atum-system:e2e-runner` agent
- **Before claiming done** → `atum-system:verification-before-completion`
- **Before writing code** → `atum-system:test-driven-development`
- **Multi-step planning** → `atum-system:writing-plans`
- **2+ independent tasks** → `atum-system:dispatching-parallel-agents`

## Cross-references

- Quality gates → see `testing.md`
- Failure recovery & escalade → see `decision-framework.md`
- Detailed agent registry & NLP routing → see **autonomous-routing** skill
