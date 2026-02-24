# Agent Orchestration

## Full Agent Registry (33 agents)

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

## Auto-Invocation Rules

NEVER wait for user to request an agent. Detect and invoke:
1. Complex feature (>3 files) → **planner** agent BEFORE coding
2. Code written/modified → **code-reviewer** agent AFTER
3. Build fails → **build-error-resolver** agent IMMEDIATELY
4. Architecture question → **architect-reviewer** agent
5. Project uses specific tech → invoke matching **domain expert**

## Parallel Execution

ALWAYS parallelize independent agent work. Never run sequentially what can run concurrently.
