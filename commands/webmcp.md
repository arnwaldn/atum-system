# WebMCP — Website to MCP Bridge

Manage WebMCP connections between websites and Claude Code.

## What is WebMCP?

WebMCP turns any website into an MCP tool source. Websites embed a small JS widget that registers tools, resources, and prompts — Claude Code can then call those tools directly instead of using browser automation.

## Actions

Based on the user's request, perform ONE of these actions:

### Generate Token (default)
Call the `_webmcp_get-token` tool to generate a registration token. Instruct the user to paste it into the WebMCP widget on their website.

### List Connected Tools
Call `tools/list` and filter for tools that are NOT built-in (`_webmcp_*`). Show the user which website tools are currently available.

### Status Check
1. Check if the WebMCP server is responding by looking at available tools
2. If `_webmcp_get-token` tool is available → server is running
3. If not → server may need restart: `node ~/Projects/tools/webmcp-optimized/src/websocket-server.js --forked --port 4797`

### Help
Explain the WebMCP workflow:
1. Start the WebMCP bridge (auto-started as MCP server by Claude Code)
2. Generate a token with `_webmcp_get-token`
3. Paste the token into the website's WebMCP widget
4. The website's custom tools appear in Claude Code's tool list
5. Call tools directly — structured data, no DOM scraping

## When to Suggest WebMCP

- User is building/testing a web application and needs to interact with it programmatically
- User wants to expose custom tools from an internal dashboard or web tool
- Browser automation (claude-in-chrome) is insufficient — needs structured API-like access
- User asks about connecting websites to Claude Code

## Architecture Reference

```
Website (webmcp.js widget)
    ↕ WebSocket (token-auth, localhost:4797)
WebMCP Bridge (ws-bridge.js)
    ↕ WebSocket
MCP Stdio Server (server.js)
    ↕ stdio
Claude Code CLI
```

## Source

Local optimized fork: `~/Projects/tools/webmcp-optimized/`
Original: https://github.com/jasonjmcghee/WebMCP
