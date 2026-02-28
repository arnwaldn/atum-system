#!/usr/bin/env bash
set -uo pipefail

# ============================================================
# Claude Code Config — Post-Install Health Check
# Run anytime to verify system integrity
#
# Usage: bash ~/.claude/verify.sh
#        bash ~/.claude/verify.sh --verbose
# ============================================================

CLAUDE_DIR="$HOME/.claude"
CLAUDE_JSON="$HOME/.claude.json"
VERBOSE="${1:-}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

pass() { echo -e "  ${GREEN}[PASS]${NC} $1"; PASSES=$((PASSES + 1)); }
fail() { echo -e "  ${RED}[FAIL]${NC} $1"; FAILS=$((FAILS + 1)); }
skip() { echo -e "  ${YELLOW}[SKIP]${NC} $1"; SKIPS=$((SKIPS + 1)); }

PASSES=0
FAILS=0
SKIPS=0

echo ""
echo -e "${BOLD}${CYAN}  Claude Code Health Check${NC}"
echo -e "  ${CYAN}=========================${NC}"
echo ""

# ============================================================
# 1. PREREQUISITES
# ============================================================
echo -e "${BOLD}1. Prerequisites${NC}"

for cmd in node python git; do
    if command -v "$cmd" &>/dev/null; then
        pass "$cmd ($($cmd --version 2>/dev/null | head -1))"
    else
        fail "$cmd: not found"
    fi
done

if command -v claude &>/dev/null; then
    pass "claude CLI ($(claude --version 2>/dev/null || echo 'installed'))"
else
    fail "claude CLI: not found — npm install -g @anthropic-ai/claude-code"
fi
echo ""

# ============================================================
# 2. DIRECTORY STRUCTURE
# ============================================================
echo -e "${BOLD}2. Directory Structure${NC}"

for dir in hooks commands agents modes rules scripts; do
    if [ -d "$CLAUDE_DIR/$dir" ]; then
        local_count=$(find "$CLAUDE_DIR/$dir" -maxdepth 1 -type f | wc -l | tr -d ' ')
        pass "$dir/ ($local_count files)"
    else
        fail "$dir/ missing"
    fi
done

# Rules subdirectories
for subdir in common typescript python golang; do
    if [ -d "$CLAUDE_DIR/rules/$subdir" ]; then
        pass "rules/$subdir/"
    else
        fail "rules/$subdir/ missing"
    fi
done
echo ""

# ============================================================
# 3. CONFIG FILES (JSON validation)
# ============================================================
echo -e "${BOLD}3. Config Files${NC}"

for f in "$CLAUDE_DIR/settings.json" "$CLAUDE_DIR/settings.local.json"; do
    if [ -f "$f" ]; then
        if python3 -c "import json,sys; json.load(open(sys.argv[1]))" "$f" 2>/dev/null; then
            pass "$(basename "$f"): valid JSON"
        else
            fail "$(basename "$f"): invalid JSON"
        fi
    else
        fail "$(basename "$f"): not found"
    fi
done

if [ -f "$CLAUDE_JSON" ]; then
    if python3 -c "import json,sys; json.load(open(sys.argv[1]))" "$CLAUDE_JSON" 2>/dev/null; then
        pass ".claude.json: valid JSON"
        # Count MCP servers
        mcp_count=$(python3 -c "import json,sys; print(len(json.load(open(sys.argv[1])).get('mcpServers', {})))" "$CLAUDE_JSON" 2>/dev/null || echo "?")
        pass ".claude.json: $mcp_count MCP servers configured"
    else
        fail ".claude.json: invalid JSON"
    fi
else
    fail ".claude.json: not found"
fi
echo ""

# ============================================================
# 4. HOOKS (executable check)
# ============================================================
echo -e "${BOLD}4. Hooks${NC}"

hook_count=0
for hook in "$CLAUDE_DIR/hooks/"*; do
    [ -f "$hook" ] || continue
    hook_count=$((hook_count + 1))
    basename_hook=$(basename "$hook")
    if [ -x "$hook" ] || [[ "$hook" == *.js ]] || [[ "$hook" == *.py ]]; then
        [ "$VERBOSE" = "--verbose" ] && pass "hook: $basename_hook"
    else
        fail "hook not executable: $basename_hook"
    fi
done

if [ $hook_count -gt 0 ]; then
    pass "Hooks: $hook_count files"
else
    fail "No hooks found"
fi

# Verify hooks are registered in settings.json
if [ -f "$CLAUDE_DIR/settings.json" ]; then
    registered=$(python3 -c "
import json, sys
with open(sys.argv[1]) as f:
    data = json.load(f)
hooks = data.get('hooks', {})
total = sum(len(v) for v in hooks.values() if isinstance(v, list))
print(total)
" "$CLAUDE_DIR/settings.json" 2>/dev/null || echo "0")
    pass "Hooks registered in settings.json: $registered"
fi
echo ""

# ============================================================
# 5. MCP SERVERS (connectivity test)
# ============================================================
echo -e "${BOLD}5. MCP Servers${NC}"

if [ -f "$CLAUDE_JSON" ]; then
    # Check each server's command exists
    python3 -c "
import json, shutil, os, sys
with open(sys.argv[1]) as f:
    data = json.load(f)
servers = data.get('mcpServers', {})
for name, srv in servers.items():
    cmd = srv.get('command', '')
    args = srv.get('args', [])
    # Skip servers without a local command (remote, SSE, placeholders)
    if not cmd:
        stype = srv.get('type', 'placeholder')
        print(f'OK|{name}: {stype}')
        continue
    # Resolve actual command for cmd /c wrapper
    if cmd == 'cmd' and args and args[0] == '/c' and len(args) > 1:
        actual_cmd = args[1]
        script_args = args[2:]
    else:
        actual_cmd = cmd
        script_args = args
    # Node servers — check script file exists
    if actual_cmd == 'node' and script_args:
        script = script_args[0]  # First arg is the script path
        script = os.path.expandvars(script)
        if 'REPLACE_WITH' in script:
            print(f'OK|{name}: node (template placeholder)')
        elif os.path.isfile(script):
            print(f'OK|{name}: node ({os.path.basename(script)})')
        else:
            print(f'WARN|{name}: script not found ({script})')
    elif shutil.which(actual_cmd) or actual_cmd in ('npx', 'cmd'):
        print(f'OK|{name}: {actual_cmd}')
    else:
        print(f'WARN|{name}: command not found ({actual_cmd})')
" "$CLAUDE_JSON" 2>/dev/null | while IFS='|' read -r status msg; do
        if [ "$status" = "OK" ]; then
            [ "$VERBOSE" = "--verbose" ] && pass "MCP $msg"
        else
            fail "MCP $msg"
        fi
    done

    # Summary
    total_mcp=$(python3 -c "import json,sys; print(len(json.load(open(sys.argv[1])).get('mcpServers', {})))" "$CLAUDE_JSON" 2>/dev/null || echo "0")
    pass "MCP servers total: $total_mcp"
fi
echo ""

# ============================================================
# 6. TOOLS & EXTERNAL DEPS
# ============================================================
echo -e "${BOLD}6. Tools${NC}"

# B12 MCP
if [ -f "$HOME/Projects/tools/website-generator-mcp-server/src/server.js" ]; then
    pass "B12 MCP: installed"
else
    fail "B12 MCP: not found at ~/Projects/tools/website-generator-mcp-server/"
fi

# WebMCP
if [ -f "$HOME/Projects/tools/webmcp-optimized/src/websocket-server.js" ]; then
    pass "WebMCP: installed"
else
    fail "WebMCP: not found at ~/Projects/tools/webmcp-optimized/"
fi

# Project templates
if [ -d "$HOME/Projects/tools/project-templates/.git" ]; then
    tmpl_count=$(find "$HOME/Projects/tools/project-templates" -maxdepth 2 -mindepth 2 -type d 2>/dev/null | wc -l | tr -d ' ')
    pass "Project templates: $tmpl_count templates"
else
    fail "Project templates: not found at ~/Projects/tools/project-templates/"
fi

# bin wrappers
if [ -d "$HOME/bin" ]; then
    bin_count=$(ls -1 "$HOME/bin" 2>/dev/null | wc -l | tr -d ' ')
    pass "~/bin: $bin_count wrappers"
else
    skip "~/bin: not found"
fi

# acpx
if command -v acpx &>/dev/null; then
    pass "acpx: installed"
else
    skip "acpx: not found (optional)"
fi

# gsudo (Windows only)
case "$(uname -s)" in
    MINGW*|MSYS*|CYGWIN*)
        if command -v gsudo &>/dev/null || [ -f "/c/Program Files/gsudo/2.6.1/gsudo.exe" ]; then
            pass "gsudo: installed"
        else
            skip "gsudo: not found (optional, Windows only)"
        fi
        ;;
esac
echo ""

# ============================================================
# 7. PLUGINS
# ============================================================
echo -e "${BOLD}7. Plugins${NC}"

if command -v claude &>/dev/null; then
    plugin_count=$(claude plugin list 2>/dev/null | grep -c "^" || echo "0")
    if [ "$plugin_count" -gt 0 ] 2>/dev/null; then
        pass "Plugins installed: $plugin_count"
    else
        skip "Plugin count unavailable (check: claude plugin list)"
    fi
else
    skip "Claude CLI not available — cannot check plugins"
fi
echo ""

# ============================================================
# 8. SECURITY CHECKS
# ============================================================
echo -e "${BOLD}8. Security${NC}"

# Check for hardcoded secrets in GIT-TRACKED config files (template, settings)
# The live .claude.json contains real secrets by design — only check repo files
if [ -f "$CLAUDE_DIR/claude.json.template" ]; then
    if grep -qE '(gho_[a-zA-Z0-9]{20,}|ghp_[a-zA-Z0-9]{20,}|sk-[a-zA-Z0-9]{20,}|AKIA[0-9A-Z]{16,})' "$CLAUDE_DIR/claude.json.template" 2>/dev/null; then
        fail "claude.json.template contains hardcoded secrets!"
    else
        pass "claude.json.template: no hardcoded secrets"
    fi
fi

if [ -f "$CLAUDE_DIR/settings.local.json" ]; then
    if grep -qE '(gho_[a-zA-Z0-9]{20,}|ghp_[a-zA-Z0-9]{20,}|sk-[a-zA-Z0-9]{20,}|AKIA[0-9A-Z]{16,})' "$CLAUDE_DIR/settings.local.json" 2>/dev/null; then
        fail "settings.local.json contains hardcoded secrets!"
    else
        pass "settings.local.json: no hardcoded secrets"
    fi
fi

# Check REPLACE_WITH placeholders not resolved in live config
if [ -f "$CLAUDE_JSON" ] && grep -q 'REPLACE_WITH' "$CLAUDE_JSON" 2>/dev/null; then
    fail ".claude.json still has unresolved REPLACE_WITH placeholders"
else
    pass ".claude.json: all placeholders resolved"
fi
echo ""

# ============================================================
# SUMMARY
# ============================================================
echo -e "${BOLD}${CYAN}======================================${NC}"
TOTAL=$((PASSES + FAILS + SKIPS))
echo -e "  ${GREEN}PASS: $PASSES${NC}  ${RED}FAIL: $FAILS${NC}  ${YELLOW}SKIP: $SKIPS${NC}  Total: $TOTAL"

if [ $FAILS -eq 0 ]; then
    echo -e "  ${GREEN}${BOLD}System healthy!${NC}"
else
    echo -e "  ${RED}${BOLD}$FAILS issue(s) found — review above${NC}"
fi
echo -e "${BOLD}${CYAN}======================================${NC}"
echo ""

exit $FAILS
