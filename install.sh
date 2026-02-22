#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# Claude Code System Installer
# Restores the complete Claude Code environment on any machine
# Compatible: macOS, Linux, Windows (Git Bash/MINGW64/WSL)
# Generated: 2026-02-22
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE_DIR="$HOME/.claude"
TEMPLATES_DIR="$HOME/Projects/tools/project-templates"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info()  { echo -e "${BLUE}[INFO]${NC} $1"; }
ok()    { echo -e "${GREEN}[OK]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo ""
echo "============================================"
echo "  Claude Code System Installer"
echo "  Complete environment restoration"
echo "============================================"
echo ""

# ---- Step 0: Check prerequisites ----
info "Checking prerequisites..."

check_cmd() {
    if command -v "$1" &>/dev/null; then
        ok "$1 found: $(command -v "$1")"
        return 0
    else
        error "$1 not found"
        return 1
    fi
}

MISSING=0
check_cmd "node" || MISSING=1
check_cmd "npm" || MISSING=1
check_cmd "python3" || check_cmd "python" || MISSING=1
check_cmd "git" || MISSING=1

if ! command -v claude &>/dev/null; then
    warn "Claude Code CLI not found. Installing..."
    npm install -g @anthropic-ai/claude-code
    if command -v claude &>/dev/null; then
        ok "Claude Code CLI installed"
    else
        error "Failed to install Claude Code CLI"
        MISSING=1
    fi
fi

if [ "$MISSING" -eq 1 ]; then
    error "Missing prerequisites. Install them first:"
    echo "  - Node.js: https://nodejs.org/"
    echo "  - Python:  https://python.org/"
    echo "  - Git:     https://git-scm.com/"
    exit 1
fi

ok "All prerequisites found"

# ---- Step 1: Restore .claude/ config directory ----
info "Restoring Claude Code configuration..."

if [ -d "$CLAUDE_DIR" ]; then
    warn "$CLAUDE_DIR already exists"
    read -p "  Overwrite config files? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        info "Skipping config restore (keeping existing)"
    else
        RESTORE_CONFIG=1
    fi
else
    mkdir -p "$CLAUDE_DIR"
    RESTORE_CONFIG=1
fi

if [ "${RESTORE_CONFIG:-0}" -eq 1 ]; then
    # Copy all config files from backup
    CONFIG_SRC="$SCRIPT_DIR/claude-config"
    if [ -d "$CONFIG_SRC" ]; then
        # Copy settings, rules, commands, agents, hooks, modes, scripts
        for dir in rules commands agents hooks modes scripts; do
            if [ -d "$CONFIG_SRC/$dir" ]; then
                cp -r "$CONFIG_SRC/$dir" "$CLAUDE_DIR/"
                ok "Restored $dir/"
            fi
        done

        # Copy JSON configs
        for f in settings.json settings.local.json atum-audit.config.json; do
            if [ -f "$CONFIG_SRC/$f" ]; then
                cp "$CONFIG_SRC/$f" "$CLAUDE_DIR/$f"
                ok "Restored $f"
            fi
        done

        # Copy memory
        if [ -d "$CONFIG_SRC/projects" ]; then
            cp -r "$CONFIG_SRC/projects" "$CLAUDE_DIR/"
            ok "Restored memory files"
        fi
    else
        warn "No claude-config/ directory found in backup"
        warn "Config files must be copied manually from your .claude/ git repo"
    fi
fi

# ---- Step 2: Restore .claude.json (MCP servers) ----
info "Setting up MCP servers..."

CLAUDE_JSON="$HOME/.claude.json"
TEMPLATE="$SCRIPT_DIR/claude-config/claude.json.template"

if [ -f "$CLAUDE_JSON" ]; then
    warn "$CLAUDE_JSON already exists, skipping MCP setup"
    warn "Merge manually from: $TEMPLATE"
else
    if [ -f "$TEMPLATE" ]; then
        cp "$TEMPLATE" "$CLAUDE_JSON"
        warn "Created $CLAUDE_JSON from template"
        warn "IMPORTANT: Edit ~/.claude.json and replace placeholder values:"
        echo "  - GITHUB_PERSONAL_ACCESS_TOKEN"
        echo "  - FIRECRAWL_API_KEY"
        echo "  - Supabase project ref"
    else
        warn "No template found, skipping MCP setup"
    fi
fi

# ---- Step 3: Restore .gitignore_global ----
info "Setting up global gitignore..."

GITIGNORE_SRC="$SCRIPT_DIR/claude-config/.gitignore_global"
GITIGNORE_DST="$HOME/.gitignore_global"

if [ -f "$GITIGNORE_SRC" ]; then
    if [ -f "$GITIGNORE_DST" ]; then
        warn "$GITIGNORE_DST exists, skipping (check manually)"
    else
        cp "$GITIGNORE_SRC" "$GITIGNORE_DST"
        git config --global core.excludesFile "$GITIGNORE_DST"
        ok "Restored .gitignore_global"
    fi
fi

# ---- Step 4: Restore templates ----
info "Restoring project templates..."

TEMPLATES_SRC="$SCRIPT_DIR/project-templates"
if [ -d "$TEMPLATES_SRC" ]; then
    mkdir -p "$(dirname "$TEMPLATES_DIR")"
    if [ -d "$TEMPLATES_DIR" ]; then
        warn "$TEMPLATES_DIR already exists, skipping"
    else
        cp -r "$TEMPLATES_SRC" "$TEMPLATES_DIR"
        ok "Restored templates to $TEMPLATES_DIR"
    fi
else
    warn "No project-templates/ found in backup"
fi

# ---- Step 5: Install plugins ----
info "Installing Claude Code plugins..."

PLUGINS_FILE="$SCRIPT_DIR/claude-config/plugins.txt"
if [ -f "$PLUGINS_FILE" ]; then
    # Add community marketplace first
    info "Adding community marketplace..."
    claude plugin marketplace add everything-claude-code https://github.com/affaan-m/everything-claude-code.git 2>/dev/null || true

    TOTAL=0
    INSTALLED=0
    FAILED=0

    while IFS= read -r line; do
        # Skip comments and empty lines
        [[ "$line" =~ ^#.*$ ]] && continue
        [[ -z "$line" ]] && continue
        # Skip DISABLED lines
        [[ "$line" =~ ^"# DISABLED".*$ ]] && continue

        TOTAL=$((TOTAL + 1))
        plugin_name=$(echo "$line" | sed 's/claude plugin install //')
        info "Installing $plugin_name... ($TOTAL)"

        if eval "$line" 2>/dev/null; then
            INSTALLED=$((INSTALLED + 1))
        else
            FAILED=$((FAILED + 1))
            warn "Failed: $plugin_name"
        fi
    done < "$PLUGINS_FILE"

    ok "Plugins: $INSTALLED installed, $FAILED failed (out of $TOTAL)"
else
    warn "No plugins.txt found, skipping plugin installation"
fi

# ---- Step 6: Setup git config ----
info "Checking git configuration..."

GIT_NAME=$(git config --global user.name 2>/dev/null || true)
GIT_EMAIL=$(git config --global user.email 2>/dev/null || true)

if [ -z "$GIT_NAME" ]; then
    read -p "  Git user.name: " GIT_NAME
    git config --global user.name "$GIT_NAME"
fi
if [ -z "$GIT_EMAIL" ]; then
    read -p "  Git user.email: " GIT_EMAIL
    git config --global user.email "$GIT_EMAIL"
fi

git config --global init.defaultBranch main 2>/dev/null || true
ok "Git config: $GIT_NAME <$GIT_EMAIL>"

# ---- Step 7: Optional tools ----
echo ""
info "Optional tools installation:"
echo "  These are recommended but not required."
echo ""

OPTIONAL_TOOLS=(
    "pnpm:npm install -g pnpm"
    "bun:npm install -g bun"
    "prettier:npm install -g prettier"
    "black:pip install black"
    "ruff:pip install ruff"
)

for tool_entry in "${OPTIONAL_TOOLS[@]}"; do
    tool_name="${tool_entry%%:*}"
    install_cmd="${tool_entry#*:}"
    if ! command -v "$tool_name" &>/dev/null; then
        read -p "  Install $tool_name? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            eval "$install_cmd" && ok "$tool_name installed" || warn "$tool_name install failed"
        fi
    else
        ok "$tool_name already installed"
    fi
done

# ---- Summary ----
echo ""
echo "============================================"
echo "  Installation Complete!"
echo "============================================"
echo ""
echo "  Next steps:"
echo "  1. Edit ~/.claude.json to add your API keys"
echo "  2. Run 'claude' to start a session"
echo "  3. Verify: /ultra-think system status check"
echo ""
echo "  Secrets to configure:"
echo "  - GITHUB_PERSONAL_ACCESS_TOKEN (for GitHub MCP)"
echo "  - FIRECRAWL_API_KEY (for Firecrawl MCP)"
echo "  - Supabase project-ref (in MCP args)"
echo ""
echo "  Config locations:"
echo "  - ~/.claude/        (rules, commands, agents, hooks)"
echo "  - ~/.claude.json    (MCP server configs)"
echo "  - ~/Projects/tools/project-templates/ (scaffold templates)"
echo ""
