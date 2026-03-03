# Happy Coder — Mobile/Remote Access for Claude Code

Manage Happy Coder sessions, daemon, and device sync from Claude Code.

## Usage

`/happy <subcommand>`

## Subcommands

- `status` — Check daemon state, active sessions, connected devices
- `auth` — Authenticate with Happy cloud (app.happy.engineering)
- `connect` — Connect/reconnect this machine to Happy
- `doctor` — Run diagnostics (network, auth, daemon, encryption)
- `sessions` — List active sessions with details
- `start` — Start a Happy-wrapped Claude session (interactive — run from terminal)
- `stop` — Stop the Happy daemon
- `version` — Show Happy CLI version

## Instructions

Based on the subcommand provided in `$ARGUMENTS`, execute the corresponding action:

### status
```bash
happy doctor 2>&1 | head -20
```
Report: daemon PID, connection status, active sessions count, machine state.

### auth
Inform the user to run `happy auth` directly from their terminal (interactive — requires TTY for QR code scanning and mobile app pairing).

### connect
Inform the user to run `happy connect` directly from their terminal (interactive).

### doctor
```bash
happy doctor 2>&1
```
Parse and report diagnostics: network connectivity, auth token validity, daemon health, server reachability.

### sessions
Check `~/.happy/daemon.state.json` for active sessions:
```bash
cat ~/.happy/daemon.state.json 2>/dev/null || echo "No daemon state found. Happy daemon may not be running."
```

### start
Inform the user: "Run `happy` from your terminal to start a Claude session with mobile access. Or `happy codex` for Codex mode."

### stop
```bash
happy daemon stop 2>&1 || echo "Daemon not running or stop command not available."
```

### version
```bash
happy --version 2>&1
```

### Default (no subcommand or help)
Show available subcommands and a brief explanation of Happy Coder:
- Happy wraps Claude Code for mobile/tablet access with E2E encryption
- Install app: iOS (App Store) or Android (Play Store)
- Web app: https://app.happy.engineering
- Docs: https://happy.engineering/docs/

## Architecture Reference

- **Config dir**: `~/.happy/` (settings.json, access.key, daemon.state.json, logs/)
- **Cloud server**: app.happy.engineering (E2E encrypted — server never sees plaintext)
- **Protocol**: JSON over HTTP + Socket.IO for real-time sync
- **Encryption**: AES-256-GCM (per-session key) or XSalsa20-Poly1305 (legacy)
- **CLI binary**: `happy` (wrapper around Claude) + `happy-mcp` (Codex MCP bridge)
