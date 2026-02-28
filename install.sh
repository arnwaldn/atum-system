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
    echo "  - 22 commands    (/scaffold, /security-audit, /tdd, /webmcp, etc.)"
    echo "  - 34 agents      (architect, phaser-expert, ml-engineer, geospatial, etc.)"
    echo "  - 4 modes        (architect, autonomous, brainstorm, quality)"
    echo "  - 27 rules       (coding-style, security, resilience, testing, etc.)"
    echo "  - 1 script       (context-monitor.py statusline)"
    echo "  - 184 templates  (scaffolds + references from project-templates)"
    echo "  - 49+ plugins    (community + official, from plugins.txt)"
    echo "  - settings.json  (hooks, plugins, full autonomy permissions)"
    echo "  - MCP servers    (.claude.json with 18 servers incl. B12, WebMCP)"
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

    # Resolve HOME path for cross-platform compatibility
    local home_path
    home_path=$(cd "$HOME" && pwd -W 2>/dev/null || pwd)
    home_path="${home_path//\\/\/}"  # Normalize to forward slashes

    # On macOS/Linux, replace "cmd", "/c" wrapper with direct npx calls
    if [ "$OS" != "windows" ]; then
        # Remove cmd /c wrapper: "cmd" → "npx", remove "/c" arg, merge args
        python3 -c "
import json, sys
with open(sys.argv[1]) as f:
    data = json.load(f)
for name, srv in data.get('mcpServers', {}).items():
    if srv.get('command') == 'cmd' and srv.get('args', [''])[0] == '/c':
        args = srv['args'][1:]  # remove /c
        if args and args[0] in ('npx', 'npm'):
            srv['command'] = args[0]
            srv['args'] = args[1:]
with open(sys.argv[2], 'w') as f:
    json.dump(data, f, indent=2)
    f.write('\n')
" "$SCRIPT_DIR/claude.json.template" "$CLAUDE_JSON"
    else
        cp "$SCRIPT_DIR/claude.json.template" "$CLAUDE_JSON"
    fi

    # Replace all placeholders
    sed -i \
        -e "s|REPLACE_WITH_YOUR_GITHUB_PAT|${github_pat}|g" \
        -e "s|REPLACE_WITH_HOME_DIR|${home_path}|g" \
        -e "s|REPLACE_WITH_YOUR_PROJECT_REF|YOUR_PROJECT_REF|g" \
        "$CLAUDE_JSON"

    # Remove _comment fields (clean output)
    python3 -c "
import json
with open('$CLAUDE_JSON') as f:
    data = json.load(f)
data.pop('_comment', None)
data.pop('_instructions', None)
for srv in data.get('mcpServers', {}).values():
    for k in list(srv.keys()):
        if k.startswith('_comment'):
            del srv[k]
with open('$CLAUDE_JSON', 'w') as f:
    json.dump(data, f, indent=2)
    f.write('\n')
" 2>/dev/null || true

    if [ -n "$github_pat" ]; then
        ok ".claude.json with GitHub MCP"
    else
        ok ".claude.json (GitHub PAT not set — edit later)"
    fi
    echo ""
}

# ============================================================
# 7.5. INSTALL B12 MCP (local build from GitHub)
# ============================================================
install_b12_mcp() {
    info "Installing B12 Website Generator MCP..."
    local B12_DIR="$HOME/Projects/tools/website-generator-mcp-server"

    if [ -d "$B12_DIR/src/server.js" ] || [ -f "$B12_DIR/src/server.js" ]; then
        ok "B12 MCP already installed at $B12_DIR"
    else
        mkdir -p "$HOME/Projects/tools"
        if git clone https://github.com/b12io/website-generator-mcp-server.git "$B12_DIR" 2>/dev/null; then
            cd "$B12_DIR" && npm install --silent 2>/dev/null
            # Fix: add "type": "module" for ESM imports
            python3 -c "
import json
with open('package.json', 'r') as f:
    data = json.load(f)
if 'type' not in data:
    data['type'] = 'module'
    with open('package.json', 'w') as f:
        json.dump(data, f, indent=2)
" 2>/dev/null
            cd - >/dev/null
            ok "B12 MCP cloned and installed"
        else
            warn "B12 MCP clone failed — install manually: git clone https://github.com/b12io/website-generator-mcp-server.git ~/Projects/tools/website-generator-mcp-server"
        fi
    fi
}

# ============================================================
# 7b. INSTALL WEBMCP (website→MCP bridge)
# ============================================================
install_webmcp() {
    info "Installing WebMCP (website→MCP bridge)..."
    local WEBMCP_DIR="$HOME/Projects/tools/webmcp-optimized"

    if [ -d "$WEBMCP_DIR/src/websocket-server.js" ] || [ -f "$WEBMCP_DIR/src/websocket-server.js" ]; then
        ok "WebMCP already installed at $WEBMCP_DIR"
    else
        mkdir -p "$HOME/Projects/tools"
        if git clone https://github.com/arnwaldn/webmcp-optimized.git "$WEBMCP_DIR" 2>/dev/null; then
            cd "$WEBMCP_DIR" && npm install --silent 2>/dev/null
            cd - >/dev/null
            ok "WebMCP cloned and installed (optimized fork)"
        else
            warn "WebMCP clone failed — install manually: git clone https://github.com/arnwaldn/webmcp-optimized.git ~/Projects/tools/webmcp-optimized"
        fi
    fi
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
# 8b. INSTALL PROJECT TEMPLATES
# ============================================================
install_templates() {
    info "Installing project templates..."
    local TEMPLATES_DIR="$HOME/Projects/tools/project-templates"

    if [ -d "$TEMPLATES_DIR/.git" ]; then
        # Already cloned — pull latest
        cd "$TEMPLATES_DIR" && git pull --ff-only 2>/dev/null && cd - >/dev/null
        ok "Project templates updated at $TEMPLATES_DIR"
    else
        mkdir -p "$HOME/Projects/tools"
        if git clone https://github.com/arnwaldn/project-templates.git "$TEMPLATES_DIR" 2>/dev/null; then
            ok "Project templates cloned ($(find "$TEMPLATES_DIR" -maxdepth 2 -type d | wc -l | tr -d ' ') dirs)"
        else
            warn "Clone failed — install manually: git clone https://github.com/arnwaldn/project-templates.git ~/Projects/tools/project-templates"
        fi
    fi
}

# ============================================================
# 8c. INSTALL PLUGINS (from plugins.txt)
# ============================================================
install_plugins() {
    info "Installing Claude Code plugins..."

    if ! command -v claude &>/dev/null; then
        warn "Claude Code CLI not found — skipping plugin install"
        warn "After installing CLI, run: bash install.sh --plugins-only"
        return
    fi

    local PLUGINS_FILE="$SCRIPT_DIR/plugins.txt"
    if [ ! -f "$PLUGINS_FILE" ]; then
        warn "plugins.txt not found — skipping"
        return
    fi

    # Add community marketplace (idempotent)
    info "Adding community marketplace..."
    claude plugin marketplace add everything-claude-code https://github.com/affaan-m/everything-claude-code.git 2>/dev/null || true
    ok "Marketplace: everything-claude-code"

    # Parse and install each plugin
    local installed=0
    local failed=0
    local skipped=0
    local total=0

    while IFS= read -r line; do
        # Skip empty lines and pure comments
        [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue

        # Skip DISABLED plugins
        if [[ "$line" =~ ^#[[:space:]]*DISABLED ]]; then
            skipped=$((skipped + 1))
            continue
        fi

        # Extract the install command (lines starting with "claude plugin install")
        if [[ "$line" =~ ^claude[[:space:]]+plugin[[:space:]]+install[[:space:]]+(.*) ]]; then
            local plugin="${BASH_REMATCH[1]}"
            total=$((total + 1))
            if $line 2>/dev/null; then
                installed=$((installed + 1))
            else
                failed=$((failed + 1))
                warn "Failed: $plugin"
            fi
        fi
    done < "$PLUGINS_FILE"

    if [ $total -gt 0 ]; then
        ok "Plugins: $installed/$total installed ($skipped disabled, $failed failed)"
    else
        warn "No plugins found in plugins.txt"
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
    echo "  2. Configure remote MCP servers in claude.ai:"
    echo "     Figma, Notion, Supabase, Vercel, Canva, etc."
    echo "  3. If plugins failed, re-run: bash install.sh --plugins-only"
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

    # Support --plugins-only flag for re-running plugin install
    if [ "${1:-}" = "--plugins-only" ]; then
        detect_os
        install_plugins
        echo -e "\n${GREEN}${BOLD}  Plugin install complete.${NC}\n"
        return
    fi

    detect_os
    check_prereqs
    confirm_install
    backup_existing
    copy_files
    install_settings
    configure_mcp
    install_b12_mcp
    install_webmcp
    install_tools
    install_templates
    install_plugins
    setup_memory
    setup_git
    verify
    summary
}

main "$@"
