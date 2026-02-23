# System Health Check

Perform a comprehensive health check of the Claude Code environment.

## Instructions

1. **Dev Stack Versions** — Run these commands and report versions:
   - `node -v`, `python3 --version`, `go version`, `rustc --version`
   - `dotnet --version`, `java -version`, `php -v`, `ruby -v`
   - `dart --version`, `deno --version`

2. **Key Tools** — Verify these are accessible:
   - `git --version`, `gh --version`, `docker --version`
   - `npm -v`, `pip --version`, `cargo --version`

3. **Configuration Files** — Check these exist:
   - `~/.claude/settings.json`
   - `~/.claude/settings.local.json`
   - `~/.mcp.json`

4. **Inventory Count** — Use Glob to count:
   - Agents: `~/.claude/agents/*.md`
   - Commands: `~/.claude/commands/*.md`
   - Rules: `~/.claude/rules/**/*.md`
   - Modes: `~/.claude/modes/*.md`
   - Hooks: `~/.claude/hooks/*`

5. **MCP Connectivity** — Use ToolSearch to verify at least 3 MCP servers respond:
   - github (try search_repositories)
   - memory (try read_graph)
   - filesystem (try list_directory)

6. **Report Format**:
```
## System Health Report — [date]

### Dev Stack
| Tool | Version | Status |
|------|---------|--------|

### Inventory
| Component | Count | Status |
|-----------|-------|--------|

### MCP Servers
| Server | Response | Status |
|--------|----------|--------|

### Overall: [OK / DEGRADED / CRITICAL]
```
