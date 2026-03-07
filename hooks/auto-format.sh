#!/bin/bash
# Auto-format on Edit — dispatches to language-specific formatters
# PostToolUse hook for Edit|MultiEdit
# Reads file_path from stdin JSON payload

INPUT=$(cat /dev/stdin 2>/dev/null || true)
[ -z "$INPUT" ] && exit 0

file=$(echo "$INPUT" | python -c "import sys,json; d=json.load(sys.stdin); print(d.get('tool_input',{}).get('file_path',''))" 2>/dev/null)
[ -z "$file" ] && exit 0
[ ! -f "$file" ] && exit 0

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
