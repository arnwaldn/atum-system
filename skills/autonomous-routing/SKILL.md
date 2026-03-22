---
name: autonomous-routing
description: |
  NLP routing table mapping 108 FR+EN triggers to skills and agents.
  Use when detecting user intent to auto-invoke the right workflow.
version: "1.0.0"
metadata:
  domain: workflow
  triggers: routing, detection, auto-invoke, NLP, intent
  role: orchestrator
  scope: internal
  output-format: routing-table
  related-skills: common-ground, compliance-routing
---

### Regulatory Compliance & EU AI Act
- "audit RGPD", "conformite RGPD", "verifier la conformite", "compliance audit", "audit de conformite" -> /compliance skill + compliance-expert agent
- "donnees personnelles", "privacy policy", "politique de confidentialite", "consentement cookies" -> /compliance gdpr + compliance-expert agent
- "paiement", "PCI", "PCI-DSS", "securite paiement", "payment compliance" -> /compliance pci + compliance-expert agent
- "donnees de sante", "HIPAA", "medical data", "health data" -> /compliance hipaa + compliance-expert agent
- "accessibilite", "EAA", "WCAG", "handicap", "accessibility compliance" -> /compliance accessibility + accessibility-auditor agent
- "SBOM", "software bill of materials", "NIS2", "CRA", "cyber resilience" -> /compliance sbom + compliance-expert agent
- "EU AI Act", "systeme IA", "AI system", "intelligence artificielle", "registre IA" -> /atum-audit + compliance-expert agent
- "integrite fichiers", "file integrity", "hash verification", "audit trail" -> /atum-audit scan
- "Annex IV", "documentation technique IA", "AI documentation" -> /atum-audit annex-iv + compliance-expert agent
- "conformite IA", "AI compliance", "risk level IA", "classification risque IA" -> /atum-audit status + compliance-expert agent
- "retention logs", "conservation donnees", "data retention" -> /atum-audit retention + /compliance gdpr
- "pre-production", "avant mise en prod", "checklist legal", "legal checklist" -> /compliance audit + /pre-deploy

## Specialized Agents Registry

| Agent | Domain | Scope |
|-------|--------|-------|
| godot-expert | Godot | GDScript projects |
| networking-expert | Real-time | WebSocket, multiplayer, state sync |
| flutter-dart-expert | Mobile | Flutter/Dart projects |
| expo-expert | React Native | Expo projects |
| tauri-expert | Desktop apps | Tauri projects |
| devops-expert | Infrastructure | Docker, K8s, Terraform, CI/CD |
| ml-engineer | AI/ML | Training, RAG, MLOps |
| security-expert | Security | Pentesting, compliance, OWASP |
| frontend-design-expert | UI/UX | Design systems, Figma, a11y |
| mcp-expert | MCP servers | Creating/testing MCP servers |
| ci-cd-engineer | Pipelines | CI/CD setup and optimization |
| api-designer | API design | REST/GraphQL API architecture |
| auto-test-generator | Test gen | Auto-generate test suites |
| documentation-generator | Docs | API docs, guides |
| graphql-expert | GraphQL | Schema, resolvers, federation |
| migration-expert | Migrations | Framework/version upgrades |
| performance-optimizer | Performance | Profiling, optimization |
| accessibility-auditor | a11y | WCAG compliance audit |
| data-engineer | Data pipelines | ETL, data processing |
| windows-scripting-expert | Windows | PowerShell, batch, Windows APIs |
| blockchain-expert | Blockchain/Web3 | Hardhat, Solidity, smart contracts, EVM |
| compliance-expert | Regulatory compliance | User data, payments, health data, e-commerce, AI deployment |
| geospatial-expert | Maps & spatial | deck.gl, MapLibre, Leaflet, GeoJSON, spatial indexing |
| no-code-automation-expert | No-code/Make.com | Automatisations, blueprints, Airtable+Make+Notion integrations |
| agence-atum-expert | Admin ATUM SAS | Gouvernance, finances, pipeline agence, obligations legales |
| fresh-executor | Context-safe execution | Long sessions, 3+ file features, context degradation risk |
| codebase-pattern-finder | Code search | Find patterns, examples, templates in codebase |
| critical-thinking | Decision analysis | Challenge assumptions, detect biases, structured frameworks |
| database-optimizer | DB optimization | Query plans, indexing, partitioning, cross-platform |
| threejs-game-expert | Three.js games | 3D browser games, WebGL, shaders |
| unity-expert | Unity | C#, game dev, shaders, physics |
| phaser-expert | Phaser | 2D browser games, arcade physics |
| error-detective | Error diagnosis | Root cause analysis, failure cascades, correlation |
| technical-debt-manager | Tech debt | Complexity analysis, coupling, test gaps, prioritization |
| research-expert | Research | Web search, documentation analysis, fact-finding |
| game-architect | Game design | Architecture, ECS, game loops, asset pipelines |
| godot-expert | Godot | GDScript, scenes, signals, physics |
| architect-reviewer | Architecture | System design review, trade-offs, scalability |

## Agent Selection (Automatic)

| Context | Agent to use |
|---------|-------------|
| Multi-file feature, complex scope | planner agent then implement |
| System design, scaling, architecture | architect-reviewer agent |
| Code just written/modified | code-reviewer agent |
| Build/compile fails | build-error-resolver agent |
| Need to explore unknown codebase | Explore agent (subagent_type=Explore) |
| Multiple independent tasks | Parallel Task agents |
| Game development | game-architect then phaser/threejs/unity/godot-expert |
| Real-time/multiplayer | networking-expert agent |
| ML/AI project | ml-engineer agent |
| Docker/K8s/CI-CD | devops-expert agent |
| Design system/UI | frontend-design-expert agent |
| Security audit needed | security-expert agent |
| Creating MCP server | mcp-expert agent |
| Blockchain/smart contracts | blockchain-expert agent |
| Maps/geospatial/globe visualization | geospatial-expert agent |
| Regulatory compliance (RGPD, PCI, HIPAA) | compliance-expert agent |
| Research/evaluation | research-expert agent |
| Quick business website | B12 MCP (generate_website tool) |
| Web app testing / website tools | WebMCP (_webmcp_get-token then register then use tools) |
| Long session, 3+ file feature | fresh-executor agent (context-safe decomposition) |
| Auto-generate test suite | auto-test-generator agent |
| Technical debt audit | technical-debt-manager agent |
| ETL, data pipelines | data-engineer agent |
| Auto-generate test suite | auto-test-generator agent |

## Skill Selection (Automatic)

Use skills when they match — don't wait for user to invoke:
- Writing new feature: invoke `/tdd` command or `atum-system:tdd` skill
- Before any creative work: switch to `brainstorm` mode
- Complex multi-step task: invoke `atum-system:plan` skill or EnterPlanMode
- About to claim "done": invoke `atum-system:verification-loop` skill
- Multiple independent tasks: use Agent tool with parallel subagent_type calls
- Debugging: invoke `error-detective` agent
- Frontend UI/design work: invoke `atum-system:ui-ux-pro-max` skill (search colors, styles, typography, patterns)
- Landing page / marketing site: query --domain product then --domain landing for data-driven design
- Quick business website: use B12 MCP generate_website tool (name + description = instant site)
- Web app interaction needing structured data: suggest WebMCP (_webmcp_get-token tool) instead of browser automation
- Scheduling/automation request: invoke scheduler skill autonomously (NL to cron/event to JSON to daemon reload)

## Contextual NLP Routing (Skills Auto-Invocation)

Detect intent from natural language and invoke matching skill automatically:

### Document Processing
- ".pdf", "PDF", "extract PDF" -> /pdf
- ".docx", "Word", "document Word" -> /docx
- ".xlsx", "Excel", "spreadsheet", "formule" -> /xlsx
- ".pptx", "PowerPoint", "slides", "presentation" -> /pptx

### Architecture & Design Patterns
- "bounded context", "aggregate", "domain event", "ubiquitous language" -> domain-driven-design
- "clean architecture", "hexagonal", "ports and adapters" -> clean-architecture
- "system design", "scalability", "load balancer", "CDN" -> system-design
- "DDIA", "distributed systems", "consensus", "replication" -> ddia-systems

### Legacy & Reasoning
- "legacy code", "reverse engineer", "no docs", "comprendre ce code" -> spec-miner
- "devil's advocate", "think harder", "structured reasoning" -> the-fool

### Security & Compliance (extended)
- "supply chain", "dependency audit", "CVE", "transitive deps" -> supply-chain-risk-auditor
- "license", "GPL", "MIT", "Apache", "SPDX", "open source" -> open-source-license-compliance

### Visualization
- "diagram", "sequence diagram", "flowchart", "Mermaid" -> design-doc-mermaid
- "D3", "chart", "data visualization", "interactive graph" -> claude-d3js-skill

### Prompt & UI
- "prompt", "CO-STAR", "RISEN", "optimize prompt" -> prompt-architect
- "UI polish", "spacing", "visual hierarchy", "typography" -> refactoring-ui

### ML/AI & DevOps (extended)
- "RAG", "vector database", "embeddings", "chunking" -> rag-architect
- "SLO", "SLI", "error budget", "postmortem", "reliability" -> sre-engineer
- "chaos engineering", "fault injection", "resilience test" -> chaos-engineer

### Accessibility & Windows
- "accessibility", "WCAG", "a11y", "screen reader", "aria" -> claude-a11y-skill
- "PowerShell", "Windows script", "registry", "WMI" -> powershell-windows

### Testing & Performance (extended)
- "property-based test", "fuzzing", "hypothesis", "invariant" -> property-based-testing
- "Core Web Vitals", "LCP", "CLS", "FID", "lighthouse" -> high-perf-browser

### Product Discovery
- "jobs to be done", "JTBD", "user need" -> jobs-to-be-done
- "mom test", "customer interview", "idea validation" -> mom-test

### MCP & Context
- "create MCP", "scaffold MCP server" -> mcp-builder
- "context degradation", "agent handoff", "fresh agent" -> context-engineering-kit
- "audit flow", "trace system flow", "flow diagram" -> audit-flow

### Assumptions & Orchestration
- "hypotheses", "hypothèses", "tu pars du principe que", "assumptions", "common ground" -> common-ground skill
- "pipeline", "lifecycle", "cycle de vie", "discover plan execute review retro" -> /pipeline command
- "feature lifecycle", "pipeline status", "phases du projet" -> /pipeline command

### Scheduling & Automation
- "tous les jours", "chaque lundi", "tous les matins", "chaque semaine" -> scheduler (autonomous NL to task)
- "every day", "every morning", "every Monday", "weekly", "daily" -> scheduler (autonomous NL to task)
- "schedule", "cron", "automate", "tache planifiee", "recurrent" -> scheduler (autonomous NL to task)
- "quand je push", "on file change", "when files change" -> scheduler (event trigger)
- "demain a", "dans 2 heures", "tomorrow at", "in 2 hours" -> scheduler (one-off task)

### No-Code & Automatisation
- "automatisation", "scenario make", "make.com", "blueprint", "workflow automatise" -> no-code-maestro skill + no-code-automation-expert agent
- "airtable", "base de donnees no-code", "creer une base", "table airtable" -> no-code-maestro skill + Airtable MCP
- "notion page", "documenter", "creer page notion" -> Notion MCP
- "projet automatisation", "hackathon", "connecter les outils" -> /projet-automatisation command
- "webhook", "trigger", "router", "iterator", "aggregator" -> no-code-automation-expert agent
- "no-code", "no code", "sans code", "low code" -> no-code-maestro skill

### Gestion ATUM SAS
- "agence atum", "atum sas", "societe", "la boite" -> agence-atum skill
- "PV", "proces-verbal", "assemblee generale", "AG" -> agence-atum (legal)
- "convocation", "convoquer les associes" -> agence-atum (legal convocation)
- "dividendes", "distribution benefices", "affectation resultat" -> agence-atum (finance dividendes)
- "actionnariat", "capital social", "actions", "parts" -> agence-atum (equity)
- "tresorerie", "budget", "ARR", "MRR", "CA" -> agence-atum (finance)
- "pipeline agence", "nouveau projet client", "devis client" -> agence-atum (clients)
- "work for equity", "participation", "incubation" -> agence-atum (equity participation)
- "obligations legales", "depot comptes", "declaration IS" -> agence-atum (legal obligations)
- "rapport trimestriel", "info trim", "reporting associes" -> agence-atum (docs generate rapport)
- "convention reglementee", "contrat dirigeant" -> agence-atum (legal convention)
- "quorum", "majorite", "vote associes" -> agence-atum (legal quorum)
- "devis", "proposition commerciale", "chiffrer un projet" -> agence-atum (billing devis)
- "facture", "facturer", "envoyer la facture" -> agence-atum (billing facture)
- "relance", "impaye", "retard de paiement" -> agence-atum (billing relance)
- "contrat client", "prestation de services", "signer un contrat" -> agence-atum (contracts prestation)
- "NDA", "confidentialite", "accord de confidentialite" -> agence-atum (contracts nda)
- "CGV", "conditions generales" -> agence-atum (contracts cgv)
- "freelance", "sous-traitant", "prestataire externe" -> freelance-manager agent + agence-atum (contracts freelance onboard)
- "onboarder un freelance", "nouveau freelance", "ajouter un prestataire" -> freelance-manager agent + agence-atum (contracts freelance onboard)
- "fin de mission freelance", "offboarding freelance", "terminer mission" -> freelance-manager agent + agence-atum (contracts freelance offboard)
- "attestation URSSAF", "Kbis", "attestations freelance" -> freelance-manager agent + agence-atum (contracts freelance status)
- "avenant freelance", "prolonger contrat freelance", "modifier TJM" -> freelance-manager agent + agence-atum (contracts freelance) + template avenant-freelance.md
- "CRA", "compte-rendu activite", "timesheet freelance" -> freelance-manager agent + agence-atum (team timetrack) + template cra-freelance.md
- "marge freelance", "rentabilite freelance", "cout freelance" -> freelance-manager agent + agence-atum (team marge-freelance)
- "bon de commande freelance" -> freelance-manager agent + agence-atum (contracts freelance) + template bon-commande-freelance.md
- "equipe", "embauche", "recrutement", "registre personnel" -> agence-atum (team personnel)
- "timetracking", "temps passe", "heures", "feuille de temps" -> agence-atum (team timetrack)
- "RGPD", "donnees personnelles", "registre traitements", "DPA" -> agence-atum (compliance rgpd)
- "assurance", "RC Pro", "cyber assurance" -> agence-atum (compliance assurances)
- "note de frais", "remboursement", "frais deplacement" -> agence-atum (frais)
- "Syntec", "convention collective", "grille salariale" -> agence-atum (compliance syntec)

### Session History & Analysis
- "session history", "historique session", "qu'est-ce que j'ai fait", "what did I work on", "past sessions" -> /session-analyzer skill
- "chercher dans les sessions", "find past work", "search session", "retrouver un travail" -> /session-analyzer skill

### Autopilot (Parcours complet non-codeur)
- "autopilot", "pilote automatique", "fais tout pour moi", "do everything", "build this for me" -> /autopilot command
- "de l'idee au produit", "from idea to product", "je veux tout automatique" -> /autopilot command
- "construis-moi", "build me", "cree-moi une app", "cree-moi un site" -> /autopilot command
- "reprendre le projet", "resume autopilot", "ou en est mon projet" -> /autopilot --resume

### New Project Definition
- "je veux une app", "je veux un site", "j'ai une idee de projet", "nouveau projet" -> /autopilot command (si non-codeur) OU /projet skill (si dev)
- "definir un projet", "creer un projet", "start a project", "new project", "define a project" -> /projet skill
- "j'ai une idee", "j'ai un projet", "monter un projet", "I want to build" -> /autopilot command
- "on fait quoi comme projet", "quel projet", "idee de business" -> /projet skill

### Development Workflow
- "TDD", "test d'abord", "ecrire les tests avant", "write tests first", "test-driven" -> /tdd skill
- "revue de code", "review et fix", "review fix", "code review automatique" -> /review-fix skill
- "generer les tests", "auto generate tests", "test suite pour", "genere les tests" -> auto-test-generator agent

### Project Management
- "etat du projet", "statut du projet", "quoi de neuf", "project status", "what changed" -> /status skill
- "sante du systeme", "diagnostic", "health check", "check my environment", "verifier ma config" -> /health skill
- "ecris un PRD", "cahier des charges", "specs pour cette feature", "product requirements", "write a PRD" -> /prd skill
- "analyser cette feature", "definir cette idee", "feature analysis", "parlons de cette idee" -> /feature-analyzer skill
- "execute ce design doc", "implement from spec", "on a le spec go", "implement from design doc" -> /feature-pipeline skill
- "quelle equipe", "combien ca couterait", "profiler ce projet", "cost estimate", "profile this project" -> /team skill

### Security & Optimization (extended)
- "audit de securite complet", "full security audit", "vulnerability scan", "verifier les vulnerabilites" -> /security-audit skill
- "optimise tout", "audit de performance", "performance audit", "optimize everything", "benchmark" -> /optimize skill

### Infrastructure & DevOps (extended)
- "migrer de", "mise a jour majeure", "upgrade framework", "migrate from", "migrate to" -> /migrate skill
- "configurer GitHub Actions", "pipeline CI", "setup CI/CD", "ajouter CI", "configurer le CI" -> /setup-cicd skill
- "backup ma base", "seed la DB", "schema de base", "database management", "gerer la base" -> /db skill

### Deep Analysis & Pre-deploy
- "pense en profondeur", "analyse approfondie", "deep analysis", "think deeply", "ultra think" -> /ultra-think skill
- "validation avant prod", "pre-deploy checklist", "production readiness", "pret pour la prod" -> /pre-deploy skill

### Directeur Technique (Strategic Project Management)
- "scope", "arbitrage de scope", "scope cut", "minimum viable", "couper du scope" -> /dt scope + directeur-technique agent
- "portfolio", "tous les projets", "vue d'ensemble", "project overview", "all projects" -> /dt portfolio + directeur-technique agent
- "livraison", "ship", "preparer la livraison", "shipping checklist", "ready to ship" -> /dt ship + directeur-technique agent
- "revue de maturite", "maturity review", "project review", "ou en est le projet" -> /dt review + directeur-technique agent
- "initialiser le suivi", "delivery tracking", "init delivery", "DELIVERY.json" -> /dt init + directeur-technique agent
- "prioriser", "qu'est-ce qu'on priorise", "prioritization", "focus cette semaine" -> directeur-technique agent
- "differenciateur", "feature differenciante", "what makes us different" -> directeur-technique agent

### Communication & Dashboard
- "mise a jour dashboard", "forcer le scan", "update dashboard", "scanner les projets" -> /dashboard-atum skill


### Fresh Context & Context Management
- "contexte frais", "decomposer en sous-taches", "session longue qualite", "fresh context" -> /fresh-execute skill
- "decompose into subtasks", "avoid context degradation", "sous-taches atomiques" -> /fresh-execute skill

### Technical Debt & Data Engineering
- "dette technique", "technical debt", "code health", "audit de dette", "code smell" -> technical-debt-manager agent
- "ETL", "data pipeline", "data processing", "traitement de donnees", "ingestion" -> data-engineer agent

### Monorepo & Release
- "monorepo", "workspace", "turborepo", "nx", "pnpm workspaces", "lerna" -> monorepo skill
- "release notes", "changelog", "what's new", "notes de version" -> release-notes skill

### Resilience & CLI Testing
- "circuit breaker", "retry pattern", "bulkhead", "resilience pattern", "fallback" -> resilience skill
- "terminal test", "TUI test", "CLI test", "tester le terminal", "interactive CLI" -> terminal-emulator skill

### External Services (MCP remote)
- "Stripe", "paiement", "checkout", "ajouter paiement", "add payments", "subscribe" -> Stripe MCP + atum-system:stripe-best-practices skill
- "Netlify", "deploy static" -> Netlify MCP
- "Cloudinary", "upload image", "CDN images" -> Cloudinary MCP
- "docs Microsoft", "Azure" -> Microsoft Learn MCP
- "Linear", "issue tracking", "backlog", "create issue", "creer un ticket" -> Linear plugin
- "Pinecone", "vector store", "semantic search" -> Pinecone plugin + rag-architect skill

### Error Tracking & Monitoring (Sentry)
- "error tracking", "monitor errors", "add Sentry", "tracking d'erreurs", "surveiller les erreurs" -> atum-system:sentry-setup-tracing skill
- "Sentry", "setup Sentry", "configurer Sentry", "error monitoring" -> atum-system:sentry-setup-tracing + atum-system:sentry-setup-logging skills
- "AI monitoring", "monitor LLM", "surveiller l'IA", "agent monitoring" -> atum-system:sentry-setup-ai-monitoring skill
- "Sentry metrics", "custom metrics", "metriques" -> atum-system:sentry-setup-metrics skill

### Analytics & Feature Flags (PostHog)
- "analytics", "ajouter analytics", "track events", "tracker les evenements" -> atum-system:posthog-instrumentation skill
- "A/B test", "experiment", "feature flag", "flag feature" -> atum-system:flags + atum-system:experiments skills
- "PostHog", "configurer PostHog", "setup analytics" -> atum-system:posthog-instrumentation skill
- "dashboard analytics", "voir les metriques", "insights" -> atum-system:insights skill

### Backend-as-a-Service (Firebase / Supabase)
- "Firebase", "add Firebase", "Firebase auth", "authentification Firebase", "Firestore" -> firebase plugin skills
- "Firebase hosting", "deploy Firebase", "Firebase functions" -> firebase plugin skills
- "Supabase", "setup Supabase", "Supabase auth", "Supabase database" -> supabase plugin skills
- "edge function", "Supabase function", "serverless Supabase" -> supabase:deploy_edge_function
- "creer une base de donnees", "setup database", "nouvelle base" -> supabase:create_project or /db skill

### Deployment Platforms
- "deploy on Vercel", "deployer sur Vercel", "Vercel", "deploy frontend" -> atum-system:deploy skill
- "deploy on Railway", "Railway", "deployer sur Railway" -> Railway MCP
- "deploy on Render", "Render", "deployer sur Render" -> /deploy skill

### Design-to-Code (Figma)
- "implement this design", "from Figma", "Figma URL", "implementer le design" -> atum-system:implement-design skill
- "connect component", "code connect", "connecter composant Figma" -> atum-system:code-connect-components skill
- "design system rules", "regles design system" -> atum-system:create-design-system-rules skill
- figma.com URL detected -> atum-system:implement-design skill

### Project Management (Atlassian/Jira)
- "create Jira ticket", "creer un ticket Jira", "Jira issue" -> atum-system:triage-issue skill
- "backlog from spec", "spec to backlog", "creer le backlog" -> atum-system:spec-to-backlog skill
- "meeting notes", "action items from meeting", "taches de la reunion" -> atum-system:capture-tasks-from-meeting-notes skill
- "status report", "rapport d'avancement", "project report" -> atum-system:generate-status-report skill
- "search knowledge", "find in docs", "chercher dans les docs internes" -> atum-system:search-company-knowledge skill

### Web Research (Firecrawl)
- "recherche en ligne", "check the web", "search online", "find documentation", "chercher sur le web" -> atum-system:firecrawl-cli skill
- "scrape", "extract from URL", "read this URL", "lire cette page" -> atum-system:firecrawl-cli skill
- "deep research", "investigate", "enqueter", "recherche approfondie en ligne" -> atum-system:firecrawl-cli skill

### Static Analysis & Security Scanning
- "static analysis", "SAST", "analyse statique", "scan de code", "semgrep" -> semgrep plugin
- "dependency check", "vulnerable dependency", "CVE check" -> sonatype-guide plugin + supply-chain-risk-auditor skill

### Brainstorming & Debugging (Superpowers)
- "brainstorm", "brainstorming", "idees", "explore les options", "let's think" -> atum-system:brainstorming skill
- "debug this", "pourquoi ca marche pas", "ca plante", "investigate this error" -> atum-system:systematic-debugging skill
- "review my PR", "PR review", "review cette PR" -> atum-system:review-pr skill
- "simplify this code", "simplifier ce code", "nettoyer le code" -> atum-system:refactor-cleaner agent

### AI/ML & HuggingFace
- "train a model", "fine-tune", "entrainer un modele", "fine-tuner" -> atum-system:hugging-face-model-trainer skill
- "upload to HuggingFace", "publier un modele", "HuggingFace Hub" -> atum-system:hugging-face-cli skill
- "dataset HuggingFace", "creer un dataset", "create dataset" -> atum-system:hugging-face-datasets skill
- "GPU job", "cloud training", "run on HF", "lancer un job" -> atum-system:hugging-face-jobs skill

### Interactive Playground
- "create a playground", "interactive explorer", "creer un playground", "outil interactif" -> atum-system:playground skill
- "demo interactive", "visualiser en HTML", "sandbox" -> atum-system:playground skill

### Browser Testing (Playwright)
- "test in browser", "tester dans le navigateur", "E2E test", "test bout en bout" -> playwright plugin or atum-system:e2e skill
- "screenshot test", "capture d'ecran test", "visual test" -> atum-system:e2e skill

### Documentation Lookup (Context7)
- "check docs for", "documentation de", "how does X work", "comment fonctionne" -> context7 plugin (resolve-library-id then query-docs)
- "latest API docs", "docs a jour", "up-to-date docs" -> context7 plugin

### Feature Development
- "guided feature dev", "develop this feature step by step", "developper cette feature" -> atum-system:feature-dev skill
- "explore this codebase", "comprendre ce code", "analyze architecture" -> atum-system:code-explorer agent

### Git Workflow
- "commit", "commit and push", "create PR", "creer une PR", "push and PR" -> atum-system:commit-push-pr skill
- "clean branches", "nettoyer les branches" -> atum-system:clean_gone skill

### Task Management (Asana)
- "Asana", "tache Asana", "Asana task", "Asana project" -> asana plugin

### GitLab
- "GitLab", "merge request", "GitLab CI", "pipeline GitLab" -> gitlab plugin

### Laravel
- "Laravel", "artisan", "Eloquent", "blade template" -> laravel-boost plugin

### Autonomous Loops
- "ralph loop", "boucle autonome", "autonomous loop", "run continuously" -> atum-system:ralph-loop skill

### Browser Testing & Automation
- "test in real browser", "tester dans un vrai navigateur", "browser automation", "automatiser le navigateur" -> agent-browser skill
- "test E2E", "end to end test", "test bout en bout", "playwright test" -> atum-system:e2e skill + e2e-runner agent

### Onboarding & Memory
- "bienvenue", "comment ca marche", "je commence", "premier jour", "getting started", "how does this work" -> bienvenue skill
- "souviens-toi", "memoire collective", "sauvegarder cette info", "remember this", "store this decision" -> memoire skill
- "retrouver une info", "chercher dans la memoire", "what did we decide about" -> memoire skill

### Project Patterns & Templates
- "skeleton project", "template projet", "project template", "modele de projet" -> project-patterns skill
- "B12 website", "generer un site B12" -> project-patterns skill (B12 pattern)

### Image Management
- "image trop grande", "resize image", "redimensionner", "image bloquante" -> image-guard-rules skill (auto-triggered by hooks)

### ECC Specialized Agents (auto-triggered by context)
- Go code modified -> atum-system:go-reviewer agent (auto)
- Python code modified -> atum-system:python-reviewer agent (auto)
- Database query/schema work -> atum-system:database-reviewer agent (auto)
- Tests needed -> atum-system:tdd-guide agent (auto, via /tdd command)
- Documentation update needed -> atum-system:doc-updater agent (auto)
- Build fails -> atum-system:build-error-resolver agent (auto)

### Superpowers Workflow (auto-triggered)
- Before claiming work is done -> atum-system:verification-before-completion (auto)
- Before writing implementation code -> atum-system:test-driven-development (auto)
- When planning multi-step tasks -> atum-system:writing-plans (auto)
- When facing 2+ independent tasks -> atum-system:dispatching-parallel-agents (auto)

### Build & Quality (consolidated from ECC)
- "build error", "erreur de build", "corriger le build", "fix build", "compilation error" -> /build-fix command
- "quality gate", "gate qualite", "check before merge", "verification avant merge" -> /quality-gate command
- "couverture de tests", "test coverage", "code coverage", "rapport de couverture" -> /test-coverage command
- "verifier tout", "verify everything", "verification complete", "check everything works" -> /verify command
- "nettoyer le code mort", "dead code", "unused code", "remove dead code", "refactor clean" -> /refactor-clean command
- "code review", "review de code", "revoir le code" -> /code-review command

### Orchestration Multi-Agents (consolidated from ECC)
- "plan d'implementation", "write a plan", "planifier l'implementation" -> /plan command
- "orchestrer", "multi-agent", "orchestrate agents" -> /orchestrate command
- "executer en parallele", "parallel execution", "multi execute" -> /multi-execute command
- "plan multi-composants", "multi plan" -> /multi-plan command

### Git Workflow (consolidated from commit-commands)
- "commit mes changements", "git commit", "create commit" -> /commit command
- "push et creer une PR", "commit push PR", "ouvrir une PR" -> /commit-push-pr command
- "nettoyer les branches mortes", "clean gone branches", "branches obsoletes" -> /clean_gone command

### Plugin Development (consolidated from plugin-dev/hookify)
- "creer un plugin", "scaffold plugin", "new plugin" -> /create-plugin command
- "creer un hook depuis la conversation", "hookify this", "generer un hook" -> /hookify command

### Code Review External (consolidated from coderabbit/pr-review-toolkit)
- "coderabbit review", "review avec coderabbit" -> /coderabbit-review command
- "review cette PR", "PR review complete", "review PR" -> /review-pr command

### Meta Plugins (auto-triggered — no NLP routing needed)
# These plugins are triggered by specific actions, not user intent:
# - agent-sdk-dev: triggered when building Claude SDK apps
# - claude-code-setup: triggered when setting up Claude Code
# - claude-md-management: triggered when managing CLAUDE.md files
# - hookify: triggered when creating/managing hooks
# - plugin-dev: triggered when creating plugins
# - skill-creator: triggered when creating skills
# - qodo-skills: auto-loads rules before code tasks
# - serena: semantic code tools (auto-invoked by MCP)
# - project-architect: triggered for architecture analysis

## Decision Authority

Make decisions autonomously for:
- File structure and organization
- Naming conventions (follow codebase patterns)
- Error handling strategy
- Test coverage approach
- Package/dependency choices (when standard)

Ask the user for:
- Business logic with multiple valid approaches
- UX/design choices affecting user experience
- Technology stack selection (major choices)
- Breaking changes to public APIs
- Cost-impacting decisions (paid services, scaling)
