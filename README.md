# ATUM System

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-2.0.0-green.svg)](https://github.com/arnwaldn/atum-system/releases)

**The ultimate Claude Code plugin.** One install. Full autonomy. Zero coding required.

ATUM System is a complete Claude Code configuration that turns Claude into an autonomous development partner. It consolidates the best open-source systems (Everything Claude Code, Superpowers, UI/UX Pro Max, and more) into a single, self-contained plugin with perfect orchestration.

## What's inside

| Component | Count | Purpose |
|-----------|-------|---------|
| **Agents** | 68 | Specialized sub-agents (architecture, review, security, testing, DevOps, compliance...) |
| **Skills** | 151 | Deep expertise (React, Flask, Spring Boot, SwiftUI, Go, Rust, Django, Docker, K8s...) |
| **Commands** | 30 | Slash commands (/projet, /deploy, /tdd, /scaffold, /pipeline...) |
| **Hooks** | 33 | Runtime safety (git-guard, secret-scanner, loop-detector, anti-rationalization...) |
| **Rules** | 4 dirs | Language-specific standards (TypeScript, Python, Go, Swift + common) |

## Key features

- **Full autonomy** -- Claude handles everything from idea to deployment without asking you to run commands manually
- **Non-coder friendly** -- designed for people who have ideas but don't write code. Plain French or English instructions work
- **Safety-first** -- 7 PreToolUse guards (secret scanner, git guard, file guard, image guard...), anti-rationalization stop hook, pre-completion test gate
- **EU AI Act compliance** -- built-in ATUM Audit integration with 15 MCP tools for Article 15 traceability
- **Universal** -- works on Windows (Git Bash), macOS, Linux. One install script for all platforms
- **Self-contained** -- no external dependencies beyond Claude Code, Node.js, Python, and Git

## Installation

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
/health          # Check system status
/projet          # Start a new project (guided)
/scaffold        # Generate project structure
/deploy          # Deploy to production
/tdd             # Test-driven development workflow
/pipeline        # Full CI/CD pipeline
```

Or just describe what you want in plain language:

> "Create a SaaS application for managing restaurant reservations with Stripe payments, user auth, and a dashboard"

ATUM handles the rest: architecture, code, tests, deployment.

## Architecture

```
atum-system/
  .claude-plugin/plugin.json    # Plugin manifest
  agents/                       # 68 specialized sub-agents
  skills/                       # 151 deep expertise skills
  commands/                     # 30 slash commands
  hooks/                        # 33 runtime hooks + hooks.json
  rules/                        # Language-specific coding standards
  scripts/                      # Utility scripts (image resize, etc.)
  settings.json                 # Security permissions + env defaults
  install.sh                    # Universal installer
```

### Hook orchestration

All hooks are declared in `hooks/hooks.json` using `${CLAUDE_PLUGIN_ROOT}` for full portability:

| Event | Hooks | Purpose |
|-------|-------|---------|
| **PreToolUse** | 7 | Secret scanning, git safety, file protection, image handling |
| **PostToolUse** | 8 | ATUM audit, auto-format, typecheck, auto-test, loop detection |
| **Stop** | 5 | Anti-rationalization, test gate, session memory, cleanup |
| **SessionStart** | 4 | Project detection, memory sync, snapshot fix |
| **PreCompact** | 1 | Save session state before compaction |
| **Notification** | 2 | Cross-platform audio alerts |
| **Other** | 2 | Config change guard, tool failure logger |

### What makes it different

Other configs add tools. ATUM adds **judgment**:

- **Anti-rationalization hook** -- detects when Claude tries to stop prematurely ("out of scope", "pre-existing issue")
- **Pre-completion gate** -- runs tests before allowing session end
- **Loop detector** -- catches repetitive patterns and forces strategy change
- **Secret scanner** -- blocks commits containing API keys, tokens, passwords
- **Git guard** -- enforces conventional commits, branch naming, blocks force-push

## Consolidated systems

ATUM System incorporates the best of:

- [Everything Claude Code](https://github.com/affaan-m/everything-claude-code) -- agents, skills, commands
- [Superpowers](https://github.com/claude-plugins-official/superpowers) -- brainstorming, debugging, TDD workflows
- [UI/UX Pro Max](https://github.com/zckly/ui-ux-pro-max-skill) -- design system intelligence
- [Feature Dev](https://github.com/claude-plugins-official/feature-dev) -- architecture exploration
- [PR Review Toolkit](https://github.com/claude-plugins-official/pr-review-toolkit) -- code review agents
- [Hookify](https://github.com/claude-plugins-official/hookify) -- rule-based hook system
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
