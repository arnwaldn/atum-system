#!/usr/bin/env bash
# ============================================================================
# ATUM System — Universal Installer for Claude Code
# Compatible: Windows (Git Bash/MSYS2), macOS, Linux
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/arnwaldn/atum-system/main/install.sh | bash
#   OR
#   git clone https://github.com/arnwaldn/atum-system && cd atum-system && bash install.sh
# ============================================================================

set -euo pipefail

# --- Colors ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

info()  { echo -e "${BLUE}[INFO]${NC} $1"; }
ok()    { echo -e "${GREEN}[OK]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
fail()  { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

echo -e "${CYAN}"
echo "  ========================================"
echo "    ATUM System -- Plugin Installer"
echo "    The Ultimate Claude Code Configuration"
echo "  ========================================"
echo -e "${NC}"

# --- Detect environment ---
OS="unknown"
case "$(uname -s)" in
  Linux*)   OS="linux" ;;
  Darwin*)  OS="macos" ;;
  MINGW*|MSYS*|CYGWIN*) OS="windows" ;;
esac
info "Detected OS: $OS"

# --- Check prerequisites ---
command -v claude &>/dev/null || fail "Claude Code CLI not found. Install: npm install -g @anthropic-ai/claude-code"
command -v git    &>/dev/null || fail "Git not found."
command -v node   &>/dev/null || fail "Node.js not found (18+ required)."
PYTHON_CMD=""
if command -v python3 &>/dev/null; then PYTHON_CMD="python3"
elif command -v python &>/dev/null; then PYTHON_CMD="python"
else fail "Python not found (3.10+ required)."
fi
ok "Prerequisites: claude, git, node, $PYTHON_CMD"

# --- Paths ---
CLAUDE_DIR="$HOME/.claude"
PLUGIN_NAME="atum-system"
MARKETPLACE_DIR="$CLAUDE_DIR/plugins/marketplaces/$PLUGIN_NAME"
CACHE_BASE="$CLAUDE_DIR/plugins/cache/$PLUGIN_NAME/$PLUGIN_NAME"
SETTINGS_FILE="$CLAUDE_DIR/settings.json"
REPO_URL="https://github.com/arnwaldn/atum-system.git"

# --- Detect context: running from cloned repo or curl pipe ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" 2>/dev/null && pwd || pwd)"
if [ -f "$SCRIPT_DIR/.claude-plugin/plugin.json" ]; then
  SOURCE_DIR="$SCRIPT_DIR"
  info "Running from repo at $SOURCE_DIR"
else
  # Clone or update
  if [ -d "$MARKETPLACE_DIR/.git" ]; then
    info "Existing installation found, pulling latest..."
    cd "$MARKETPLACE_DIR" && git pull --ff-only origin main 2>/dev/null || git pull origin main
    SOURCE_DIR="$MARKETPLACE_DIR"
  else
    info "Cloning from GitHub..."
    git clone "$REPO_URL" "$MARKETPLACE_DIR"
    SOURCE_DIR="$MARKETPLACE_DIR"
  fi
fi
ok "Source ready: $SOURCE_DIR"

# --- Copy to marketplace if needed ---
if [ "$(cd "$SOURCE_DIR" && pwd)" != "$(cd "$MARKETPLACE_DIR" 2>/dev/null && pwd || echo '')" ]; then
  info "Installing to marketplace..."
  mkdir -p "$MARKETPLACE_DIR"
  if command -v rsync &>/dev/null; then
    rsync -a --exclude='.git' --exclude='settings.local.json' "$SOURCE_DIR/" "$MARKETPLACE_DIR/"
  else
    cp -r "$SOURCE_DIR/"* "$MARKETPLACE_DIR/" 2>/dev/null || true
    cp -r "$SOURCE_DIR/.claude-plugin" "$MARKETPLACE_DIR/" 2>/dev/null || true
  fi
  ok "Copied to marketplace"
fi

# --- Read version ---
VERSION=$($PYTHON_CMD -c "import json; print(json.load(open('$MARKETPLACE_DIR/.claude-plugin/plugin.json'))['version'])" 2>/dev/null || echo "2.0.0")
info "Version: $VERSION"

# --- Populate cache ---
CACHE_DIR="$CACHE_BASE/$VERSION"
info "Populating cache..."
mkdir -p "$CACHE_DIR"

for dir in agents skills commands rules hooks scripts .claude-plugin; do
  if [ -d "$MARKETPLACE_DIR/$dir" ]; then
    mkdir -p "$CACHE_DIR/$dir"
    cp -r "$MARKETPLACE_DIR/$dir/"* "$CACHE_DIR/$dir/" 2>/dev/null || true
  fi
done
for file in settings.json CLAUDE.md README.md; do
  [ -f "$MARKETPLACE_DIR/$file" ] && cp "$MARKETPLACE_DIR/$file" "$CACHE_DIR/" 2>/dev/null || true
done
ok "Cache populated at $CACHE_DIR"

# --- Create system directories ---
mkdir -p "$CLAUDE_DIR/tmp" "$CLAUDE_DIR/scripts"

# --- Register in settings.json ---
info "Registering plugin..."
[ -f "$SETTINGS_FILE" ] || echo '{"permissions":{"allow":["Bash(*)","Write(*)","Edit(*)","Skill(*)"]},"enabledPlugins":{},"hooks":{}}' > "$SETTINGS_FILE"

$PYTHON_CMD << 'PYEOF'
import json, os

path = os.path.expanduser("~/.claude/settings.json")
with open(path) as f:
    s = json.load(f)

s.setdefault("enabledPlugins", {})
key = "atum-system@atum-system"
was_new = key not in s["enabledPlugins"]
s["enabledPlugins"][key] = True

with open(path, "w") as f:
    json.dump(s, f, indent=2)

print(f"{'Registered' if was_new else 'Already registered'}: {key}")
PYEOF
ok "Plugin registered in settings.json"

# --- Summary ---
AGENTS=$(ls "$MARKETPLACE_DIR/agents/"*.md 2>/dev/null | wc -l | tr -d ' ')
SKILLS=$(ls -d "$MARKETPLACE_DIR/skills/"*/ 2>/dev/null | wc -l | tr -d ' ')
COMMANDS=$(ls "$MARKETPLACE_DIR/commands/"*.md 2>/dev/null | wc -l | tr -d ' ')
HOOKS=$(ls "$MARKETPLACE_DIR/hooks/"*.js "$MARKETPLACE_DIR/hooks/"*.py "$MARKETPLACE_DIR/hooks/"*.sh 2>/dev/null | wc -l | tr -d ' ')

echo ""
echo -e "${GREEN}  =======================================${NC}"
echo -e "${GREEN}    ATUM System installed successfully!  ${NC}"
echo -e "${GREEN}  =======================================${NC}"
echo ""
echo -e "  Components:"
echo "    Agents:   $AGENTS"
echo "    Skills:   $SKILLS"
echo "    Commands: $COMMANDS"
echo "    Hooks:    $HOOKS"
echo ""
echo -e "  ${YELLOW}Restart Claude Code to activate.${NC}"
echo "  Then try: /health or /projet"
echo ""
echo "  Docs: https://github.com/arnwaldn/atum-system"
echo ""
