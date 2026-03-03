#!/bin/bash
# Auto-format on Edit — dispatches to language-specific formatters
# PostToolUse hook for Edit|MultiEdit
# Uses $CLAUDE_TOOL_FILE_PATH set by Claude Code

file="$CLAUDE_TOOL_FILE_PATH"
[ -z "$file" ] && exit 0

case "$file" in
  *.js|*.ts|*.jsx|*.tsx|*.json|*.css|*.html|*.sol)
    npx prettier --write "$file" 2>/dev/null || true ;;
  *.py)
    black "$file" 2>/dev/null || true ;;
  *.go)
    gofmt -w "$file" 2>/dev/null || true ;;
  *.rs)
    rustfmt "$file" 2>/dev/null || true ;;
  *.php)
    php-cs-fixer fix "$file" 2>/dev/null || true ;;
esac
