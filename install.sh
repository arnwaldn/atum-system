#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# Claude Code Config v4 — Plugin Architecture Installer
# Installs the ATUM plugin-based Claude Code environment
#
# Compatible: Windows (Git Bash/MSYS2), macOS, Linux
# Usage: git clone https://github.com/arnwaldn/claude-code-config.git
#        cd claude-code-config && bash install.sh
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE_DIR="$HOME/.claude"
CLAUDE_JSON="$HOME/.claude.json"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

info()  { echo -e "${CYAN}[INFO]${NC} $1"; }
ok()    { echo -e "${GREEN}  [OK]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
err()   { echo -e "${RED}[ERR]${NC} $1"; }

# ============================================================
# 1. DETECT OS
# ============================================================
detect_os() {
    case "$(uname -s)" in
        MINGW*|MSYS*|CYGWIN*) OS="windows" ;;
        Darwin*)               OS="macos" ;;
        Linux*)                OS="linux" ;;
        *)                     OS="unknown" ;;
    esac
    info "OS: $OS ($(uname -s))"
}

# ============================================================
# 2. CHECK PREREQUISITES
# ============================================================
check_prereqs() {
    info "Checking prerequisites..."
    local missing=0

    for cmd in node python3 git; do
        if command -v "$cmd" &>/dev/null; then
            ok "$cmd ($($cmd --version 2>/dev/null | head -1))"
        else
            err "$cmd: not found"
            missing=$((missing + 1))
        fi
    done

    if command -v claude &>/dev/null; then
        ok "claude CLI ($(claude --version 2>/dev/null || echo 'installed'))"
    else
        warn "Claude Code CLI not found"
        echo "       Install: npm install -g @anthropic-ai/claude-code"
    fi

    if [ $missing -gt 0 ]; then
        err "$missing required tools missing. Install them and retry."
        exit 1
    fi
    echo ""
}

# ============================================================
# 3. CONFIRM
# ============================================================
confirm_install() {
    echo -e "${BOLD}Claude Code Config v4 — Plugin Architecture${NC}"
    echo ""
    echo "  This will install:"
    echo "  - 13 plugins      (atum-core, atum-compliance, atum-security, etc.)"
    echo "  - 29 agents       (11 Opus + 15 Sonnet + 3 Haiku)"
    echo "  - 37 skills       (progressive disclosure, on-demand)"
    echo "  - 30 commands     (namespaced by plugin)"
    echo "  - 4 hooks         (fail-closed: file-guard, secret-scanner, git-guard, anti-rationalization)"
    echo "  - 3 global rules  (anti-hallucination, coding-style, security-baseline)"
    echo "  - 4 modes         (architect, autonomous, brainstorm, quality)"
    echo "  - statusline      (context/cost monitoring)"
    echo "  - marketplace.json (ATUM plugin registry)"
    echo ""
    echo -e "  Target: ${CYAN}$CLAUDE_DIR/${NC}"
    echo ""
    read -rp "Proceed? [y/N] " confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        info "Aborted."
        exit 0
    fi
    echo ""
}

# ============================================================
# 4. BACKUP EXISTING CONFIG
# ============================================================
backup_existing() {
    if [ -d "$CLAUDE_DIR/hooks" ] || [ -f "$CLAUDE_DIR/settings.json" ]; then
        local ts=$(date +%Y%m%d-%H%M%S)
        local backup="$CLAUDE_DIR/.backup-$ts"
        mkdir -p "$backup"
        for item in hooks plugins modes rules scripts settings.json; do
            [ -e "$CLAUDE_DIR/$item" ] && cp -r "$CLAUDE_DIR/$item" "$backup/" 2>/dev/null || true
        done
        ok "Backed up existing config to $backup/"
    fi
}

# ============================================================
# 5. COPY FILES
# ============================================================
copy_files() {
    info "Copying files..."
    mkdir -p "$CLAUDE_DIR"

    # Hooks (4 fail-closed Python hooks)
    if [ -d "$SCRIPT_DIR/hooks" ]; then
        mkdir -p "$CLAUDE_DIR/hooks"
        cp "$SCRIPT_DIR/hooks/"*.py "$CLAUDE_DIR/hooks/" 2>/dev/null || true
        chmod +x "$CLAUDE_DIR/hooks/"*.py 2>/dev/null || true
        ok "hooks/ (4 fail-closed hooks)"
    fi

    # Plugins (13 plugin directories + marketplace.json)
    if [ -d "$SCRIPT_DIR/plugins" ]; then
        cp -r "$SCRIPT_DIR/plugins" "$CLAUDE_DIR/"
        local pcount=$(ls -d "$SCRIPT_DIR/plugins/atum-"*/ 2>/dev/null | wc -l | tr -d ' ')
        ok "plugins/ ($pcount plugins + marketplace.json)"
    fi

    # Rules (3 global rules)
    if [ -d "$SCRIPT_DIR/rules" ]; then
        cp -r "$SCRIPT_DIR/rules" "$CLAUDE_DIR/"
        ok "rules/ (3 global rules)"
    fi

    # Modes (4 workflow modes)
    if [ -d "$SCRIPT_DIR/modes" ]; then
        mkdir -p "$CLAUDE_DIR/modes"
        cp "$SCRIPT_DIR/modes/"* "$CLAUDE_DIR/modes/" 2>/dev/null || true
        ok "modes/ (4 modes)"
    fi

    # Scripts (statusline + utilities)
    if [ -d "$SCRIPT_DIR/scripts" ]; then
        mkdir -p "$CLAUDE_DIR/scripts"
        cp "$SCRIPT_DIR/scripts/"* "$CLAUDE_DIR/scripts/" 2>/dev/null || true
        chmod +x "$CLAUDE_DIR/scripts/"*.sh 2>/dev/null || true
        ok "scripts/"
    fi

    # Schedules
    if [ -d "$SCRIPT_DIR/schedules" ]; then
        mkdir -p "$CLAUDE_DIR/schedules"
        cp "$SCRIPT_DIR/schedules/"*.json "$CLAUDE_DIR/schedules/" 2>/dev/null || true
        ok "schedules/"
    fi

    # Scheduler daemon
    if [ -d "$SCRIPT_DIR/scheduler" ]; then
        cp -r "$SCRIPT_DIR/scheduler" "$CLAUDE_DIR/"
        ok "scheduler/ (daemon)"
    fi

    # Project registry
    if [ -f "$SCRIPT_DIR/atum-projects.json" ]; then
        cp "$SCRIPT_DIR/atum-projects.json" "$CLAUDE_DIR/"
        ok "atum-projects.json"
    fi
}

# ============================================================
# 6. INSTALL SETTINGS
# ============================================================
install_settings() {
    info "Installing settings..."

    if [ -f "$SCRIPT_DIR/settings.json" ]; then
        cp "$SCRIPT_DIR/settings.json" "$CLAUDE_DIR/settings.json"

        # Replace $HOME_PLACEHOLDER with actual home path
        local home_path
        home_path=$(cd "$HOME" && pwd -W 2>/dev/null || pwd)
        home_path="${home_path//\\/\/}"

        python3 -c "
import sys
with open(sys.argv[1], encoding='utf-8') as f:
    content = f.read()
replaced = content.replace('\$HOME_PLACEHOLDER', sys.argv[2])
with open(sys.argv[1], 'w', encoding='utf-8') as f:
    f.write(replaced)
count = content.count('\$HOME_PLACEHOLDER')
print(f'  Replaced {count} path placeholders with {sys.argv[2]}')
" "$CLAUDE_DIR/settings.json" "$home_path"

        ok "settings.json (minimal, 4 hooks, fail-closed)"
    fi
}

# ============================================================
# 7. CONFIGURE MCP SERVERS
# ============================================================
configure_mcp() {
    info "Configuring MCP servers..."

    if [ -f "$CLAUDE_JSON" ]; then
        warn ".claude.json already exists — skipping (merge manually if needed)"
        return
    fi

    if [ ! -f "$SCRIPT_DIR/claude.json.template" ]; then
        warn "No claude.json.template found — skipping MCP setup"
        return
    fi

    echo ""
    echo -e "  ${CYAN}GitHub Personal Access Token${NC} (for GitHub MCP server)"
    echo "  Create at: https://github.com/settings/tokens"
    echo "  Leave empty to skip."
    echo ""
    read -rp "  GitHub PAT: " github_pat

    local home_path
    home_path=$(cd "$HOME" && pwd -W 2>/dev/null || pwd)
    home_path="${home_path//\\/\/}"

    # On macOS/Linux, convert cmd /c wrappers to direct calls
    if [ "$OS" != "windows" ]; then
        python3 -c "
import json, sys
with open(sys.argv[1]) as f:
    data = json.load(f)
for name, srv in data.get('mcpServers', {}).items():
    if srv.get('command') == 'cmd' and srv.get('args', [''])[0] == '/c':
        args = srv['args'][1:]
        if args and args[0] in ('npx', 'npm', 'python', 'python3'):
            srv['command'] = 'python3' if args[0] == 'python' else args[0]
            srv['args'] = args[1:]
with open(sys.argv[2], 'w') as f:
    json.dump(data, f, indent=2)
    f.write('\n')
" "$SCRIPT_DIR/claude.json.template" "$CLAUDE_JSON"
    else
        cp "$SCRIPT_DIR/claude.json.template" "$CLAUDE_JSON"
    fi

    if [ "$OS" = "macos" ]; then
        sed -i '' \
            -e "s|REPLACE_WITH_YOUR_GITHUB_PAT|${github_pat}|g" \
            -e "s|REPLACE_WITH_HOME_DIR|${home_path}|g" \
            "$CLAUDE_JSON"
    else
        sed -i \
            -e "s|REPLACE_WITH_YOUR_GITHUB_PAT|${github_pat}|g" \
            -e "s|REPLACE_WITH_HOME_DIR|${home_path}|g" \
            "$CLAUDE_JSON"
    fi

    ok ".claude.json configured"
    echo ""
}

# ============================================================
# 8. VERIFY
# ============================================================
verify() {
    echo ""
    info "Verification..."

    # Verify hooks
    local hook_count=$(ls -1 "$CLAUDE_DIR/hooks/"*.py 2>/dev/null | wc -l | tr -d ' ')
    ok "hooks: $hook_count Python hooks (fail-closed)"

    # Verify plugins
    local plugin_count=$(ls -d "$CLAUDE_DIR/plugins/atum-"*/ 2>/dev/null | wc -l | tr -d ' ')
    ok "plugins: $plugin_count plugin directories"

    # Verify agents
    local agent_count=$(find "$CLAUDE_DIR/plugins" -path "*/agents/*.md" 2>/dev/null | wc -l | tr -d ' ')
    ok "agents: $agent_count across plugins"

    # Verify skills
    local skill_count=$(find "$CLAUDE_DIR/plugins" -name "SKILL.md" 2>/dev/null | wc -l | tr -d ' ')
    ok "skills: $skill_count across plugins"

    # Verify commands
    local cmd_count=$(find "$CLAUDE_DIR/plugins" -path "*/commands/*.md" 2>/dev/null | wc -l | tr -d ' ')
    ok "commands: $cmd_count across plugins"

    # Verify JSON
    if python3 -c "import json; json.load(open('$CLAUDE_DIR/settings.json'))" 2>/dev/null; then
        ok "settings.json: valid JSON"
    fi
    if python3 -c "import json; json.load(open('$CLAUDE_DIR/plugins/marketplace.json'))" 2>/dev/null; then
        ok "marketplace.json: valid JSON"
    fi

    echo ""
    echo -e "${GREEN}${BOLD}  v4 plugin architecture installed successfully${NC}"
}

# ============================================================
# 9. SUMMARY
# ============================================================
summary() {
    echo ""
    echo -e "${CYAN}${BOLD}======================================${NC}"
    echo -e "${GREEN}${BOLD}  Installation complete!${NC}"
    echo -e "${CYAN}${BOLD}======================================${NC}"
    echo ""
    echo "  Next steps:"
    echo "  1. Restart Claude Code"
    echo "  2. Set env vars (GITHUB_PERSONAL_ACCESS_TOKEN, ATUM_USER)"
    echo "  3. Install plugins as needed for your project"
    echo ""
    echo "  Config:"
    echo "    ~/.claude/settings.json       Minimal config (4 hooks, statusline)"
    echo "    ~/.claude/plugins/            13 ATUM plugins"
    echo "    ~/.claude/plugins/marketplace.json  Plugin registry"
    echo ""
}

# ============================================================
# MAIN
# ============================================================
main() {
    echo ""
    echo -e "${BOLD}${CYAN}  Claude Code Config v4 Installer${NC}"
    echo -e "  ${CYAN}==================================${NC}"
    echo ""

    detect_os
    check_prereqs
    confirm_install
    backup_existing
    copy_files
    install_settings
    configure_mcp
    verify
    summary
}

main "$@"
