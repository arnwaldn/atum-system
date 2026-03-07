#!/bin/bash
# PostToolUse hook: TypeScript type-check after Edit/Write on .ts/.tsx files
# Only runs if the edited file is in a project with tsconfig.json

INPUT=$(cat /dev/stdin)
FILE=$(echo "$INPUT" | python -c "import sys,json; d=json.load(sys.stdin); print(d.get('tool_input',{}).get('file_path',''))" 2>/dev/null)

# Skip if no file or not TypeScript
if [[ -z "$FILE" ]] || [[ "$FILE" != *.ts && "$FILE" != *.tsx ]]; then
  exit 0
fi

# Skip node_modules, .next, dist
if [[ "$FILE" == *node_modules* ]] || [[ "$FILE" == *.next* ]] || [[ "$FILE" == *dist* ]]; then
  exit 0
fi

# Find nearest tsconfig.json by walking up
DIR=$(dirname "$FILE")
PREV=""
while [ "$DIR" != "$PREV" ] && [ "$DIR" != "." ]; do
  PREV="$DIR"
  if [ -f "$DIR/tsconfig.json" ]; then
    cd "$DIR" || exit 0
    # Use tsgo if available (faster), fallback to tsc
    if command -v tsgo &>/dev/null; then
      ERRORS=$(tsgo --noEmit 2>&1 | grep -c "error TS")
    else
      ERRORS=$(npx --yes tsc --noEmit 2>&1 | grep -c "error TS")
    fi
    if [ "$ERRORS" -gt 0 ]; then
      echo "TypeScript: $ERRORS type error(s) detected"
      if command -v tsgo &>/dev/null; then
        tsgo --noEmit 2>&1 | grep "error TS" | head -5
      else
        npx --yes tsc --noEmit 2>&1 | grep "error TS" | head -5
      fi
    fi
    exit 0
  fi
  DIR=$(dirname "$DIR")
done
