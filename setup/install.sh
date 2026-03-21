#!/usr/bin/env bash
# ATUM System v4.0 — First-time setup script
# Usage: bash install.sh
# Installs required dependencies for the ATUM plugin to function fully.

set -e

echo "=== ATUM System v4.0 — Setup ==="
echo ""

# --- 1. Check prerequisites ---
echo "[1/4] Checking prerequisites..."
MISSING=""
command -v node >/dev/null 2>&1 || MISSING="$MISSING node"
command -v npm >/dev/null 2>&1 || MISSING="$MISSING npm"
command -v npx >/dev/null 2>&1 || MISSING="$MISSING npx"
command -v python3 >/dev/null 2>&1 || command -v python >/dev/null 2>&1 || MISSING="$MISSING python"
command -v git >/dev/null 2>&1 || MISSING="$MISSING git"

if [ -n "$MISSING" ]; then
  echo "  MISSING:$MISSING"
  echo "  Install these before continuing."
  exit 1
fi
echo "  All prerequisites found."

# --- 2. Install LSP plugins (feature flags for Claude Code) ---
echo ""
echo "[2/4] Installing LSP plugins..."
if command -v claude >/dev/null 2>&1; then
  claude plugins install typescript-lsp 2>/dev/null && echo "  typescript-lsp installed" || echo "  typescript-lsp already installed or skipped"
  claude plugins install pyright-lsp 2>/dev/null && echo "  pyright-lsp installed" || echo "  pyright-lsp already installed or skipped"
else
  echo "  WARNING: 'claude' CLI not found. Install LSP plugins manually:"
  echo "    claude plugins install typescript-lsp"
  echo "    claude plugins install pyright-lsp"
fi

# --- 3. Install global npm packages for LSP ---
echo ""
echo "[3/4] Installing LSP language servers..."
npm list -g typescript-language-server >/dev/null 2>&1 || npm install -g typescript-language-server typescript 2>/dev/null && echo "  typescript-language-server OK" || echo "  WARN: could not install typescript-language-server"
npm list -g pyright >/dev/null 2>&1 || npm install -g pyright 2>/dev/null && echo "  pyright OK" || echo "  WARN: could not install pyright"

# --- 4. Optional output style plugins ---
echo ""
echo "[4/4] Installing output style plugins..."
if command -v claude >/dev/null 2>&1; then
  claude plugins install learning-output-style 2>/dev/null && echo "  learning-output-style installed" || echo "  learning-output-style already installed or skipped"
  claude plugins install explanatory-output-style 2>/dev/null && echo "  explanatory-output-style installed" || echo "  explanatory-output-style already installed or skipped"
fi

echo ""
echo "=== Setup complete ==="
echo ""
echo "ATUM System v4.0 is ready. 35 MCP servers configured."
echo ""
echo "Optional: Set these environment variables for full MCP access:"
echo "  GITHUB_PERSONAL_ACCESS_TOKEN  — GitHub API"
echo "  FIRECRAWL_API_KEY             — Web scraping"
echo "  PINECONE_API_KEY              — Vector DB"
echo "  EXA_API_KEY                   — Web search"
echo "  SONATYPE_GUIDE_TOKEN          — Dependency CVE checks"
echo "  GREPTILE_API_KEY              — Code search"
echo ""
echo "MCP servers using OAuth (Supabase, Stripe, Sentry, Figma, etc.)"
echo "will prompt for authentication on first use — no env vars needed."
echo ""
echo "Run /configure-atum in Claude Code for interactive setup."
