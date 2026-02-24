# Claude Code Config

Complete Claude Code environment — hooks, commands, agents, modes, rules, MCP servers, and settings.

## Quick Install

```bash
git clone https://github.com/arnwaldn/claude-code-config.git
cd claude-code-config
bash install.sh
```

**Prerequisites**: Node.js, Python, Git, [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code)

## What's Included

| Category | Count | Description |
|----------|-------|-------------|
| Hooks | 14 | Secret scanner, git guard, loop detector, auto-formatter, session memory, etc. |
| Commands | 20 | `/scaffold`, `/security-audit`, `/tdd`, `/deploy`, `/compliance`, etc. |
| Agents | 33 | Architect, phaser-expert, ml-engineer, blockchain-expert, etc. |
| Modes | 4 | architect, autonomous, brainstorm, quality |
| Rules | 25 | Coding style, security, testing, anti-hallucination (common + TS/Python/Go) |
| Scripts | 1 | Context monitor statusline |
| MCP Servers | 16 | GitHub, Memory, Railway, Cloudflare, Context7, Gmail, etc. |
| Plugins | 50 | ECC, Superpowers, Playwright, Firebase, Figma, Stripe, etc. |

## Structure

```
hooks/              PreToolUse/PostToolUse/Stop/SessionStart hooks
commands/           Slash commands (/scaffold, /tdd, /deploy, etc.)
agents/             Specialized agents (33 domain experts)
modes/              Custom modes (architect, autonomous, brainstorm, quality)
rules/              Global rules (common/, typescript/, python/, golang/)
scripts/            Helper scripts (context-monitor.py)
settings.json       Main config — hooks, plugins, permissions (SOURCE OF TRUTH)
settings.local.json Local overrides — statusline, env vars
claude.json.template  MCP server configs (replace PAT placeholders)
```

## Post-Install

1. **Restart Claude Code** to load the new config
2. **Install plugins**: `claude plugins marketplace add everything-claude-code ...`
   (see `settings.json` `enabledPlugins` for the full list)
3. **Configure remote MCP** in claude.ai settings:
   Figma, Notion, Supabase, Vercel, Canva, Gamma, Make, Zapier, etc.
4. **Edit `~/.claude.json`** to add your GitHub PAT if skipped during install

## Portability

- `settings.json` uses `$HOME` for hook paths — works on any machine
- Hooks use `$HOME`, `$TEMP`, `$CLAUDE_TOOL_FILE_PATH` — no hardcoded paths
- Commands, agents, modes, rules are pure Markdown — fully portable
- The install script backs up any existing config before overwriting

## Supported Platforms

- Windows (Git Bash / MSYS2 / WSL)
- macOS
- Linux

## Languages & Frameworks Covered

Rules and agents cover: TypeScript, Python, Go, Rust, Java, .NET, PHP, Ruby, Dart, Solidity.
Frameworks: Next.js, Vue, Svelte, FastAPI, Django, Flask, Express, NestJS, Spring Boot, Laravel, Rails, Flutter, Tauri, Electron, Phaser, Three.js, Godot, Hardhat.
