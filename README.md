# Claude Code Config v4 — Plugin Architecture

ATUM SAS Claude Code environment with granular plugin architecture and progressive disclosure.

## Quick Install

```bash
git clone https://github.com/arnwaldn/claude-code-config.git
cd claude-code-config
bash install.sh
```

**Prerequisites**: Node.js, Python 3, Git, [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code)

## Architecture v4

### Design Principles

1. **Plugin-first**: All components live in isolated plugins
2. **Progressive disclosure**: 3 levels (metadata -> instructions -> resources)
3. **Fail-closed hooks**: Errors = block, not pass
4. **Context budget**: ~3,000 tokens permanent (vs ~20,000 in v3)
5. **Namespace everything**: Commands prefixed by plugin name

### What's Included

| Category | Count | Description |
|----------|-------|-------------|
| Plugins | 13 | Isolated, installable plugin packages |
| Agents | 29 | 11 Opus + 15 Sonnet + 3 Haiku, distributed in plugins |
| Skills | 37 | On-demand with progressive disclosure |
| Commands | 30 | Namespaced by plugin |
| Hooks | 4 | file-guard, secret-scanner, git-guard, anti-rationalization (fail-closed) |
| Rules | 3 | anti-hallucination, coding-style, security-baseline |
| Modes | 4 | architect, autonomous, brainstorm, quality |
| Data | 35 | ATUM business data in atum-core plugin |

### Plugin Registry

| Plugin | Category | Agents | Skills | Commands |
|--------|----------|--------|--------|----------|
| atum-core | agency | 3 | 4 | 7 |
| atum-compliance | compliance | 1 | 4 | 2 |
| atum-security | security | 2 | 1 | 1 |
| atum-architecture | architecture | 5 | 5 | 7 |
| atum-python | development | 1 | 1 | 3 |
| atum-typescript | development | 4 | 2 | 0 |
| atum-devops | infrastructure | 2 | 4 | 3 |
| atum-data-ai | data-ai | 2 | 3 | 0 |
| atum-mobile | development | 1 | 1 | 0 |
| atum-orchestration | workflows | 4 | 2 | 2 |
| atum-docs | documentation | 2 | 6 | 2 |
| atum-sales-marketing | business | 1 | 3 | 2 |
| atum-scheduler | operations | 1 | 1 | 1 |

### Context Footprint

| Scenario | v3 (monolith) | v4 (plugins) | Delta |
|----------|---------------|--------------|-------|
| Permanent config | ~20,000 tokens | ~3,000 tokens | **-85%** |
| Active hooks | 32 | 4 | **-87%** |
| Active agents (typical) | 38 | 3-8 | **-80%** |
| Global rules | 23 | 3 | **-87%** |

## Structure

```
├── settings.json           # Minimal: permissions, 4 hooks, statusline
├── CLAUDE.md               # Dev philosophy (not micromanagement)
├── plugins/
│   ├── marketplace.json    # Plugin registry (13 plugins)
│   └── atum-*/             # 13 plugin directories
│       ├── agents/         # Agent definitions with model tier
│       ├── commands/       # Slash commands
│       ├── skills/         # Skills with SKILL.md + resources/
│       └── data/           # (atum-core only) Business data
├── hooks/                  # 4 fail-closed Python hooks
├── rules/
│   ├── common/             # anti-hallucination, coding-style
│   └── security/           # security-baseline
├── modes/                  # architect, autonomous, brainstorm, quality
├── scripts/                # statusline.sh, utilities
├── scheduler/              # TypeScript daemon source
├── schedules/              # 13 scheduled tasks
└── install.sh              # Cross-platform installer
```

## Safety Model

4 hooks, all fail-closed (Python):

| Hook | Trigger | Protection |
|------|---------|-----------|
| file-guard.py | PreToolUse (Bash) | Blocks sensitive files (SSH, .env, wallets, credentials) |
| secret-scanner.py | PreToolUse (Bash) | Blocks hardcoded secrets before git commit |
| git-guard.py | PreToolUse (git push) | Blocks force-push and push to protected branches |
| anti-rationalization.py | Stop | Detects premature completion (fail-open for Stop) |

## Agent Model Tiers

| Tier | Count | Purpose |
|------|-------|---------|
| Opus 4 | 11 | Critical decisions: security, compliance, architecture, migration |
| Sonnet | 15 | Development: Python, TypeScript, DevOps, ML, mobile |
| Haiku | 3 | Fast tasks: docs generation, pattern finding, scheduling |

## Portability

- `settings.json` uses `$HOME_PLACEHOLDER` — resolved at install time
- Pure Markdown agents, skills, commands — fully portable
- Cross-platform: Windows (Git Bash), macOS, Linux
- `.gitattributes` normalizes line endings to LF

## Compliance

EU AI Act and RGPD compliance via ATUM Audit MCP (15 tools) in the atum-compliance plugin.

## Post-Install

1. Restart Claude Code
2. Set env vars: `GITHUB_PERSONAL_ACCESS_TOKEN`, `ATUM_USER`
3. Configure remote MCP in claude.ai settings
4. Install plugins as needed for your project
