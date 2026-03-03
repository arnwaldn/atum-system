---
name: autonomous-routing
description: |
  Agent, skill, and MCP routing reference tables with 70+ NLP triggers (FR+EN).
  Contains: full agent registry (37 agents with domains and auto-triggers),
  agent selection by context, skill selection by task type, contextual NLP routing
  (document processing, architecture, security, compliance, visualization,
  scheduling, ATUM admin, no-code, external services), and decision authority rules.
  Consult when routing a user request to the right agent, skill, or MCP server.
user-invocable: false
---

# Autonomous Routing Reference Tables

## Full Agent Registry (37 agents)

| Agent | Domain | Auto-trigger |
|-------|--------|-------------|
| architect-reviewer | System design | Architecture questions, scaling, tech choices |
| codebase-pattern-finder | Pattern search | Need examples from existing code |
| critical-thinking | Analysis | Complex decisions, bias detection |
| database-optimizer | DB performance | Slow queries, schema design |
| error-detective | Error diagnosis | Cascading failures, root cause |
| technical-debt-manager | Code health | Refactoring planning, debt audit |
| research-expert | Research | Technology evaluation, fact-checking |
| game-architect | Game design | Any game project |
| phaser-expert | 2D web games | Phaser 3 projects |
| threejs-game-expert | 3D web games | Three.js projects |
| unity-expert | Unity games | Unity/C# projects |
| godot-expert | Godot games | Godot/GDScript projects |
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
| happy-expert | Mobile dev | Happy Coder remote access |

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

## Skill Selection (Automatic)

Use skills when they match — don't wait for user to invoke:
- Writing new feature: invoke TDD skill
- Before any creative work: invoke brainstorming skill
- Complex multi-step task: invoke writing-plans skill
- About to claim "done": invoke verification-before-completion skill
- Multiple independent tasks: invoke dispatching-parallel-agents skill
- Debugging: invoke systematic-debugging skill
- Frontend UI/design work: invoke ui-ux-pro-max skill (search colors, styles, typography, patterns)
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
- "freelance", "sous-traitant", "prestataire externe" -> agence-atum (contracts freelance)
- "equipe", "embauche", "recrutement", "registre personnel" -> agence-atum (team personnel)
- "timetracking", "temps passe", "heures", "feuille de temps" -> agence-atum (team timetrack)
- "RGPD", "donnees personnelles", "registre traitements", "DPA" -> agence-atum (compliance rgpd)
- "assurance", "RC Pro", "cyber assurance" -> agence-atum (compliance assurances)
- "note de frais", "remboursement", "frais deplacement" -> agence-atum (frais)
- "Syntec", "convention collective", "grille salariale" -> agence-atum (compliance syntec)

### External Services (MCP remote)
- "Stripe", "paiement", "checkout" -> Stripe MCP
- "Netlify", "deploy static" -> Netlify MCP
- "Cloudinary", "upload image", "CDN images" -> Cloudinary MCP
- "docs Microsoft", "Azure" -> Microsoft Learn MCP
- "Linear", "issue tracking", "backlog" -> Linear plugin
- "Pinecone", "vector store" -> Pinecone plugin

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
