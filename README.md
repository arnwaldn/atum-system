# ATUM System

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-4.0.0-green.svg)](https://github.com/arnwaldn/atum-system/releases)

**The ultimate Claude Code plugin.** One install. Full autonomy. Zero coding required.

ATUM System is a complete Claude Code configuration that turns Claude into an autonomous development partner. It consolidates the best open-source systems (Everything Claude Code, Superpowers, UI/UX Pro Max, and more) into a single, self-contained plugin with perfect orchestration.

## What's inside

| Component | Count | Purpose |
|-----------|-------|---------|
| **Agents** | 70 | Specialized sub-agents (architecture, review, security, testing, DevOps, compliance...) |
| **Skills** | 167 | Deep expertise (React, Flask, Spring Boot, SwiftUI, Go, Django, Docker, K8s, EU AI Act...) |
| **Commands** | 81 | Slash commands (/autopilot, /projet, /deploy, /tdd, /scaffold, /pipeline, /verify...) |
| **Hooks** | 34 | Runtime safety (git-guard, secret-scanner, loop-detector, anti-rationalization, cost-tracker...) |
| **Rules** | 5 dirs | Language-specific standards (TypeScript, Python, Go, Swift, common) |

## Key features

- **`/autopilot`** -- describe your project in plain language, get a deployed product. 6 automatic phases: definition, structure, construction, verification, deployment, monitoring
- **Full autonomy** -- Claude handles everything from idea to deployment without asking you to run commands manually
- **Non-coder friendly** -- designed for people who have ideas but don't write code. Plain French or English instructions work
- **Safety-first** -- 10 PreToolUse guards, anti-rationalization stop hook, pre-completion test gate, cost tracking
- **EU AI Act compliance** -- built-in ATUM Audit integration with 15 MCP tools for Article 15 traceability
- **140+ NLP triggers** -- say what you want in French or English, the system routes to the right workflow automatically
- **Universal** -- works on Windows (Git Bash), macOS, Linux. One install script for all platforms
- **Self-contained** -- no external dependencies beyond Claude Code, Node.js, Python, and Git

## Installation

### Claude Code native (recommended)

```
claude install-plugin https://github.com/arnwaldn/atum-system
```

### One-line install

```bash
curl -fsSL https://raw.githubusercontent.com/arnwaldn/atum-system/main/install.sh | bash
```

### Manual install

```bash
git clone https://github.com/arnwaldn/atum-system ~/.claude/plugins/marketplaces/atum-system
cd ~/.claude/plugins/marketplaces/atum-system
bash install.sh
```

Then **restart Claude Code**.

## Quick start

After installation, open Claude Code and try:

```
/autopilot       # Full auto: idea to deployed product (non-coders)
/projet          # Start a new project (guided interview)
/scaffold        # Generate project structure
/deploy          # Deploy to production
/tdd             # Test-driven development workflow
/pipeline        # Feature lifecycle management
/verify          # Full system verification
/health          # Check system status
```

Or just describe what you want in plain language:

> "Build me a reservation app for my restaurant in Paris"

ATUM handles the rest: architecture, code, tests, deployment.

## Architecture

```
atum-system/
  plugin.json                     # Plugin manifest (v3.0.0)
  .claude-plugin/plugin.json      # Marketplace manifest
  agents/                         # 70 specialized sub-agents
  skills/                         # 167 deep expertise skills
  commands/                       # 81 slash commands
  hooks/                          # 34 runtime hooks + hooks.json
  rules/                          # Language-specific coding standards (5 dirs)
  scripts/                        # Utility scripts + session libs
  settings.json                   # Security permissions + env defaults
  install.sh                      # Universal installer
```

### Hook orchestration

All hooks are declared in `hooks/hooks.json` using `${CLAUDE_PLUGIN_ROOT}` for full portability:

| Event | Hooks | Purpose |
|-------|-------|---------|
| **PreToolUse** | 10 | Secret scanning, git safety, file protection, image handling, push reminder, doc warning, compact suggestion |
| **PostToolUse** | 10 | ATUM audit, auto-format, typecheck, auto-test, loop detection, PR logging, console.log warning |
| **Stop** | 7 | Anti-rationalization, test gate, session memory, cleanup, cost tracking, pattern extraction |
| **SessionStart** | 1 | Project detection, memory sync, snapshot cleanup |
| **PreCompact** | 1 | Save session state before compaction |
| **Notification** | 2 | Cross-platform audio alerts |
| **Other** | 2 | Config change guard, tool failure logger |

### What makes it different

Other configs add tools. ATUM adds **judgment**:

- **`/autopilot`** -- full pipeline from idea to deployed product for non-coders
- **Anti-rationalization hook** -- detects when Claude tries to stop prematurely
- **Pre-completion gate** -- runs tests before allowing session end
- **Loop detector** -- catches repetitive patterns and forces strategy change
- **Cost tracker** -- logs token usage and estimated costs per session
- **Secret scanner** -- blocks commits containing API keys, tokens, passwords
- **Git guard** -- enforces safe git operations, blocks force-push
- **Autonomous routing** -- 140+ FR+EN triggers auto-invoke the right workflow

## Consolidated systems

ATUM System v3.0 incorporates and supersedes:

- [Everything Claude Code](https://github.com/affaan-m/everything-claude-code) -- agents, skills, commands, hooks
- [Superpowers](https://github.com/obra/superpowers) -- brainstorming, debugging, TDD workflows
- [UI/UX Pro Max](https://github.com/zckly/ui-ux-pro-max-skill) -- design system intelligence
- [Feature Dev](https://github.com/claude-plugins-official/feature-dev) -- architecture exploration
- [PR Review Toolkit](https://github.com/claude-plugins-official/pr-review-toolkit) -- code review agents
- [Commit Commands](https://github.com/claude-plugins-official/commit-commands) -- git workflow
- [Hookify](https://github.com/claude-plugins-official/hookify) -- rule-based hook system
- [CodeRabbit](https://github.com/coderabbitai/coderabbit) -- AI code review
- Custom ATUM systems -- compliance, orchestration, French language support

## Requirements

- **Claude Code** v1.0+ with active subscription
- **Node.js** 18+
- **Python** 3.10+
- **Git** 2.30+

## License

MIT -- see [LICENSE](LICENSE).

---

Built by [ATUM SAS](https://github.com/arnwaldn) for non-coders who build commercial products.
