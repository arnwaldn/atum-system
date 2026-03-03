# WhatsApp MCP Setup

## Architecture
- **Bridge** (Go/whatsmeow): `~/Projects/tools/whatsapp-mcp/whatsapp-bridge/whatsapp-bridge.exe`
  - REST API on port 8080 (send, download, typing, health)
  - SQLite stores: `store/whatsapp.db` (session), `store/messages.db` (messages)
  - Modified `main.go` for phone pairing (`PAIR_PHONE` env var + `PairPhone()` API)
  - PairClientChrome + "Chrome (Windows)" required (WhatsApp rejects custom names)
- **MCP Server** (Python/FastMCP): `~/Projects/tools/whatsapp-mcp/whatsapp-mcp-server/main.py`
  - 13 tools: search_contacts, get_contact, list_messages, list_chats, get_chat, get_direct_chat_by_contact, get_contact_chats, get_last_interaction, get_message_context, send_message, send_file, send_audio_message, download_media
  - Configured in `~/.claude.json` as "whatsapp" MCP server (uv run)

## Account
- Number: +1 683-777-0932 (US virtual number)
- Identity: "Claude - Assistant ATUM" (WhatsApp Business)
- Paired via phone code (DVSZ-ZTDG), session stored in whatsapp.db

## Persistence
- Windows Scheduled Task: "WhatsApp-Bridge" (triggers at logon, 3x restart on failure)
- Install script: `whatsapp-bridge/install-service.ps1`
- Background script: `whatsapp-bridge/start-background.ps1`

## Key Parameters
- `send_message(recipient, message)` - recipient = JID (e.g., "120363407564404512@g.us")
- ATUM SAS group JID: `120363407564404512@g.us`

## Cloclo WhatsApp via Chrome (V3 — active, primary)
- **Approach**: Direct interaction with WhatsApp Web via `claude-in-chrome` MCP tools
- **WhatsApp Web**: Already connected to Cloclo account (+1 683-777-0932) in Chrome
- **Command**: `/whatsapp` (open, read, reply, watch, status)
- **Persona rules**: `~/.claude/rules/common/whatsapp-persona.md`
- **Tools**: tabs_context_mcp, navigate, read_page, javascript_tool, find, form_input, computer
- **Watch mode**: Polling-based (~20s interval), responds when Cloclo is solicited
- **Advantages**: ~3-5s response (vs 145s claude -p), persona natively loaded, zero infrastructure
- **DOM selectors**: `[data-pre-plain-text]` for messages, `.copyable-text span[dir="ltr"]` for text (with fallbacks)

## Cleanup Log (2026-03-03)
- Removed: `Cloclo-Watcher` scheduled task (was sending broken haiku meta-commentary)
- Removed: `cloclo-watcher/` directory (watcher.py, config.json, empty-mcp.json, invoke-claude.sh)
- Kept: Bridge Go (background service, MCP server dependency), MCP Server Python, `/whatsapp` chrome command

## Troubleshooting
- Port 8080 conflict: kill all `whatsapp-bridge.exe` instances before restart
- nohup spawns duplicates on Windows: use PowerShell `Start-Process -WindowStyle Hidden` instead
- Bridge connected but no REST: check `client.IsConnected()` returns true before server starts
- WhatsApp Web DOM changes: fallback selectors in `/whatsapp` command, use `read_page` if JS fails
