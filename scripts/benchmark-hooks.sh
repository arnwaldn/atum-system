#!/usr/bin/env bash
# benchmark-hooks.sh — Measure execution time of each hook individually
# Usage: bash scripts/benchmark-hooks.sh [hooks_dir]
#
# Tests each hook with simulated input and reports timing.
# Target: PreToolUse < 200ms total, individual hooks < 100ms

set -euo pipefail

HOOKS_DIR="${1:-$HOME/.claude/hooks}"
RESULTS=()
TOTAL_MS=0

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Simulated inputs for different hook types
READ_INPUT='{"tool":"Read","params":{"file_path":"/home/user/project/src/app.ts"}}'
WRITE_INPUT='{"tool":"Write","params":{"file_path":"/home/user/project/src/app.ts"}}'
BASH_INPUT='{"tool_name":"Bash","tool_input":{"command":"echo hello"}}'
COMMIT_INPUT='{"tool_name":"Bash","tool_input":{"command":"git commit -m \"feat: add feature\""}}'
STOP_INPUT='{"transcript":"Task completed successfully. All tests pass.","stop_reason":"end_turn"}'

benchmark_hook() {
  local hook_file="$1"
  local input="$2"
  local name
  name=$(basename "$hook_file")

  # Determine runtime
  local cmd=""
  case "$hook_file" in
    *.js)  cmd="node" ;;
    *.py)  cmd="python3" ;;
    *.sh)  cmd="bash" ;;
    *)     return ;;
  esac

  # Time the execution (milliseconds)
  local start end elapsed
  start=$(date +%s%N 2>/dev/null || python3 -c 'import time; print(int(time.time()*1e9))')
  echo "$input" | $cmd "$hook_file" > /dev/null 2>&1 || true
  end=$(date +%s%N 2>/dev/null || python3 -c 'import time; print(int(time.time()*1e9))')
  elapsed=$(( (end - start) / 1000000 ))

  # Color based on threshold
  local color="$GREEN"
  if [ "$elapsed" -gt 500 ]; then
    color="$RED"
  elif [ "$elapsed" -gt 200 ]; then
    color="$YELLOW"
  fi

  printf "  %-40s ${color}%6d ms${NC}\n" "$name" "$elapsed"
  TOTAL_MS=$((TOTAL_MS + elapsed))
  RESULTS+=("$name:$elapsed")
}

echo "========================================="
echo " Claude Code Hooks Benchmark"
echo " Hooks dir: $HOOKS_DIR"
echo "========================================="
echo ""

# PreToolUse hooks (most critical — run on EVERY tool call)
echo "--- PreToolUse hooks (target: < 200ms total) ---"
for hook in file-guard.js file-guard.py image-auto-resize.js lock-file-protector.js; do
  [ -f "$HOOKS_DIR/$hook" ] && benchmark_hook "$HOOKS_DIR/$hook" "$READ_INPUT"
done
for hook in secret-scanner.js secret-scanner.py git-guard.js git-guard.py clean-shell-snapshots.py; do
  [ -f "$HOOKS_DIR/$hook" ] && benchmark_hook "$HOOKS_DIR/$hook" "$BASH_INPUT"
done
echo ""

# PostToolUse hooks
echo "--- PostToolUse hooks ---"
for hook in loop-detector.js post-edit-dispatcher.js atum-compliance-check.py post-commit-quality-gate.js worktree-setup.js; do
  [ -f "$HOOKS_DIR/$hook" ] && benchmark_hook "$HOOKS_DIR/$hook" "$BASH_INPUT"
done
echo ""

# Stop hooks
echo "--- Stop hooks (target: < 5s total) ---"
for hook in anti-rationalization.js session-memory.js session-to-graph.js; do
  [ -f "$HOOKS_DIR/$hook" ] && benchmark_hook "$HOOKS_DIR/$hook" "$STOP_INPUT"
done
echo ""

# Summary
echo "========================================="
printf " TOTAL: %d ms\n" "$TOTAL_MS"
echo ""

# Thresholds
if [ "$TOTAL_MS" -lt 1000 ]; then
  echo -e " ${GREEN}EXCELLENT — All hooks under 1s total${NC}"
elif [ "$TOTAL_MS" -lt 3000 ]; then
  echo -e " ${YELLOW}OK — Consider optimizing slow hooks${NC}"
else
  echo -e " ${RED}SLOW — Hooks exceed 3s total, optimization needed${NC}"
fi
echo "========================================="
