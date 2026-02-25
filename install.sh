#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# Claude Code Config Installer
# Installs the complete Claude Code environment on any machine
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

    for cmd in node python git; do
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
    echo -e "${BOLD}This will install:${NC}"
    echo "  - 14 hooks      (PreToolUse, PostToolUse, Stop, SessionStart)"
    echo "  - 20 commands    (/scaffold, /security-audit, /tdd, etc.)"
    echo "  - 34 agents      (architect, phaser-expert, ml-engineer, geospatial, etc.)"
    echo "  - 4 modes        (architect, autonomous, brainstorm, quality)"
    echo "  - 26 rules       (coding-style, security, resilience, testing, etc.)"
    echo "  - 1 script       (context-monitor.py statusline)"
    echo "  - settings.json  (hooks, plugins, full autonomy permissions)"
    echo "  - MCP servers    (.claude.json with 16 servers)"
    echo "  - bin wrappers   (gsudo for admin elevation)"
    echo "  - acpx config    (headless ACP sessions)"
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
        for item in hooks commands agents modes rules scripts settings.json settings.local.json; do
            [ -e "$CLAUDE_DIR/$item" ] && cp -r "$CLAUDE_DIR/$item" "$backup/" 2>/dev/null || true
        done
        ok "Backed up existing config to $backup/"
    fi
}

# ============================================================
# 5. COPY PORTABLE FILES
# ============================================================
copy_files() {
    info "Copying files..."
    mkdir -p "$CLAUDE_DIR"

    local dirs=(hooks commands agents modes scripts)
    for dir in "${dirs[@]}"; do
        if [ -d "$SCRIPT_DIR/$dir" ]; then
            mkdir -p "$CLAUDE_DIR/$dir"
            cp "$SCRIPT_DIR/$dir/"* "$CLAUDE_DIR/$dir/" 2>/dev/null || true
            local count=$(ls -1 "$SCRIPT_DIR/$dir" 2>/dev/null | wc -l | tr -d ' ')
            ok "$dir/ ($count files)"
        fi
    done

    # Rules (with subdirectories)
    if [ -d "$SCRIPT_DIR/rules" ]; then
        cp -r "$SCRIPT_DIR/rules" "$CLAUDE_DIR/"
        local rcount=$(find "$SCRIPT_DIR/rules" -name "*.md" | wc -l | tr -d ' ')
        ok "rules/ ($rcount files)"
    fi

    # Make hooks executable
    chmod +x "$CLAUDE_DIR/hooks/"* 2>/dev/null || true
}

# ============================================================
# 6. INSTALL SETTINGS
# ============================================================
install_settings() {
    info "Installing settings..."

    # settings.json — portable (uses $HOME in hook paths)
    if [ -f "$SCRIPT_DIR/settings.json" ]; then
        cp "$SCRIPT_DIR/settings.json" "$CLAUDE_DIR/settings.json"
        ok "settings.json"
    fi

    # settings.local.json — strip machine-specific env vars
    if [ -f "$SCRIPT_DIR/settings.local.json" ]; then
        python3 -c "
import json, sys
with open(sys.argv[1]) as f:
    data = json.load(f)
env = data.get('env', {})
for key in ['ATUM_PROJECT_DIR']:
    env.pop(key, None)
data['env'] = env
with open(sys.argv[2], 'w') as f:
    json.dump(data, f, indent=2)
    f.write('\n')
" "$SCRIPT_DIR/settings.local.json" "$CLAUDE_DIR/settings.local.json" 2>/dev/null \
        || cp "$SCRIPT_DIR/settings.local.json" "$CLAUDE_DIR/settings.local.json"
        ok "settings.local.json"
    fi
}

# ============================================================
# 7. CONFIGURE MCP SERVERS (.claude.json)
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
    echo "  Scopes: repo, read:org, read:user"
    echo "  Leave empty to skip."
    echo ""
    read -rp "  GitHub PAT: " github_pat

    if [ -n "$github_pat" ]; then
        sed "s/REPLACE_WITH_YOUR_GITHUB_PAT/$github_pat/g" \
            "$SCRIPT_DIR/claude.json.template" > "$CLAUDE_JSON"
        ok ".claude.json with GitHub MCP"
    else
        sed "s/REPLACE_WITH_YOUR_GITHUB_PAT//g" \
            "$SCRIPT_DIR/claude.json.template" > "$CLAUDE_JSON"
        ok ".claude.json (GitHub PAT not set — edit later)"
    fi
    echo ""
}

# ============================================================
# 8. INSTALL TOOLS (gsudo, acpx)
# ============================================================
install_tools() {
    info "Installing autonomy tools..."

    # --- bin wrappers ---
    mkdir -p "$HOME/bin"
    if [ -d "$SCRIPT_DIR/bin" ]; then
        cp "$SCRIPT_DIR/bin/"* "$HOME/bin/" 2>/dev/null || true
        chmod +x "$HOME/bin/"* 2>/dev/null || true
        ok "bin/ wrappers copied to ~/bin/"
    fi

    # --- gsudo (Windows only) ---
    if [ "$OS" = "windows" ]; then
        if command -v gsudo &>/dev/null || [ -f "/c/Program Files/gsudo/2.6.1/gsudo.exe" ]; then
            ok "gsudo already installed"
        else
            info "Installing gsudo (Windows sudo equivalent)..."
            if command -v winget &>/dev/null; then
                winget install gerardog.gsudo --accept-package-agreements --accept-source-agreements 2>/dev/null
                if [ -f "/c/Program Files/gsudo/2.6.1/gsudo.exe" ]; then
                    ok "gsudo installed"
                    # Create wrapper if not already in bin/
                    if [ ! -f "$HOME/bin/gsudo" ]; then
                        echo '#!/bin/bash' > "$HOME/bin/gsudo"
                        echo '"/c/Program Files/gsudo/2.6.1/gsudo.exe" "$@"' >> "$HOME/bin/gsudo"
                        chmod +x "$HOME/bin/gsudo"
                    fi
                    # Configure cache
                    "$HOME/bin/gsudo" config CacheMode Auto 2>/dev/null || true
                    "$HOME/bin/gsudo" config CacheDuration "01:00:00" 2>/dev/null || true
                    ok "gsudo cache configured (Auto, 1h)"
                else
                    warn "gsudo install failed — install manually: winget install gerardog.gsudo"
                fi
            else
                warn "winget not available — install gsudo manually"
            fi
        fi
    else
        info "gsudo: skipped (Windows only)"
    fi

    # --- acpx ---
    if command -v acpx &>/dev/null; then
        ok "acpx already installed"
    else
        info "Installing acpx (headless ACP CLI)..."
        npm install -g acpx@latest 2>/dev/null
        if command -v acpx &>/dev/null; then
            ok "acpx installed"
        else
            warn "acpx install failed — install manually: npm install -g acpx@latest"
        fi
    fi

    # --- acpx config ---
    if [ -d "$SCRIPT_DIR/acpx" ]; then
        mkdir -p "$HOME/.acpx"
        if [ ! -f "$HOME/.acpx/config.json" ]; then
            cp "$SCRIPT_DIR/acpx/config.json" "$HOME/.acpx/config.json"
            ok "acpx config installed"
        else
            ok "acpx config already exists — skipping"
        fi
    fi
}

# ============================================================
# 9. SETUP MEMORY
# ============================================================
setup_memory() {
    if [ -d "$SCRIPT_DIR/projects" ]; then
        mkdir -p "$CLAUDE_DIR/projects"
        cp -r "$SCRIPT_DIR/projects/"* "$CLAUDE_DIR/projects/" 2>/dev/null || true
        ok "Memory templates copied"
    fi
}

# ============================================================
# 10. GIT CONFIG (if not set)
# ============================================================
setup_git() {
    local name=$(git config --global user.name 2>/dev/null || true)
    local email=$(git config --global user.email 2>/dev/null || true)

    if [ -z "$name" ]; then
        read -rp "  Git user.name: " name
        git config --global user.name "$name"
    fi
    if [ -z "$email" ]; then
        read -rp "  Git user.email: " email
        git config --global user.email "$email"
    fi
    git config --global init.defaultBranch main 2>/dev/null || true
    ok "Git: $name <$email>"
}

# ============================================================
# 11. VERIFY
# ============================================================
verify() {
    echo ""
    info "Verification..."
    local total=0

    for dir in hooks commands agents modes rules scripts; do
        if [ -d "$CLAUDE_DIR/$dir" ]; then
            local n=$(find "$CLAUDE_DIR/$dir" -maxdepth 1 -type f | wc -l | tr -d ' ')
            total=$((total + n))
            ok "$dir: $n files"
        fi
    done

    # Bin wrappers
    if [ -d "$HOME/bin" ]; then
        local bcount=$(ls -1 "$HOME/bin" 2>/dev/null | wc -l | tr -d ' ')
        ok "~/bin: $bcount wrappers"
    fi

    # acpx config
    if [ -f "$HOME/.acpx/config.json" ]; then
        ok "acpx config: present"
    fi

    # Validate JSON
    for f in "$CLAUDE_DIR/settings.json" "$CLAUDE_DIR/settings.local.json"; do
        if [ -f "$f" ] && python3 -c "import json; json.load(open('$f'))" 2>/dev/null; then
            ok "$(basename "$f"): valid JSON"
        fi
    done
    if [ -f "$CLAUDE_JSON" ] && python3 -c "import json; json.load(open('$CLAUDE_JSON'))" 2>/dev/null; then
        ok ".claude.json: valid JSON"
    fi

    echo ""
    echo -e "${GREEN}${BOLD}  $total files installed successfully${NC}"
}

# ============================================================
# 12. POST-INSTALL SUMMARY
# ============================================================
summary() {
    echo ""
    echo -e "${CYAN}${BOLD}======================================${NC}"
    echo -e "${GREEN}${BOLD}  Installation complete!${NC}"
    echo -e "${CYAN}${BOLD}======================================${NC}"
    echo ""
    echo "  Next steps:"
    echo "  1. Restart Claude Code"
    echo "  2. Install plugins (if not already):"
    echo "     claude plugins marketplace add everything-claude-code ..."
    echo "     (see settings.json enabledPlugins for full list)"
    echo "  3. Configure remote MCP servers in claude.ai:"
    echo "     Figma, Notion, Supabase, Vercel, Canva, etc."
    echo ""
    echo "  Config locations:"
    echo "    ~/.claude/         hooks, commands, agents, modes, rules"
    echo "    ~/.claude.json     MCP server configs"
    echo "    ~/.claude/settings.json   main config (SOURCE OF TRUTH)"
    echo "    ~/.acpx/config.json       acpx headless sessions"
    echo "    ~/bin/                    tool wrappers (gsudo, jq, etc.)"
    echo ""
}

# ============================================================
# MAIN
# ============================================================
main() {
    echo ""
    echo -e "${BOLD}${CYAN}  Claude Code Config Installer${NC}"
    echo -e "  ${CYAN}==============================${NC}"
    echo ""

    detect_os
    check_prereqs
    confirm_install
    backup_existing
    copy_files
    install_settings
    configure_mcp
    install_tools
    setup_memory
    setup_git
    verify
    summary
}

main "$@"
