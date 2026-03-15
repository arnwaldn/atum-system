#!/usr/bin/env bash
# test-hooks.sh — Unit tests for critical hooks
# Usage: bash scripts/test-hooks.sh [hooks_dir]
# Exit: 0 = all pass, 1 = failures

set -euo pipefail

HOOKS_DIR="${1:-$(dirname "$0")/../hooks}"
PASS=0
FAIL=0

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

assert_exit() {
  local name="$1" expected="$2" input="$3" hook="$4"
  local actual
  echo "$input" | node "$hook" > /dev/null 2>&1 || true
  actual=$?
  # Re-run to get actual exit code
  set +e
  echo "$input" | node "$hook" > /dev/null 2>&1
  actual=$?
  set -e

  if [ "$actual" -eq "$expected" ]; then
    printf "  ${GREEN}PASS${NC} %s (exit %d)\n" "$name" "$actual"
    PASS=$((PASS + 1))
  else
    printf "  ${RED}FAIL${NC} %s (expected %d, got %d)\n" "$name" "$expected" "$actual"
    FAIL=$((FAIL + 1))
  fi
}

assert_output_contains() {
  local name="$1" expected="$2" input="$3" hook="$4"
  local output
  set +e
  output=$(echo "$input" | node "$hook" 2>&1)
  set -e

  if echo "$output" | grep -qi "$expected"; then
    printf "  ${GREEN}PASS${NC} %s\n" "$name"
    PASS=$((PASS + 1))
  else
    printf "  ${RED}FAIL${NC} %s (expected output containing '%s')\n" "$name" "$expected"
    FAIL=$((FAIL + 1))
  fi
}

assert_stdout_contains() {
  local name="$1" expected="$2" input="$3" hook="$4"
  local output
  set +e
  output=$(echo "$input" | node "$hook" 2>/dev/null)
  set -e

  if echo "$output" | grep -qi "$expected"; then
    printf "  ${GREEN}PASS${NC} %s\n" "$name"
    PASS=$((PASS + 1))
  else
    printf "  ${RED}FAIL${NC} %s (expected stdout containing '%s')\n" "$name" "$expected"
    FAIL=$((FAIL + 1))
  fi
}

assert_stdout_empty() {
  local name="$1" input="$2" hook="$3"
  local output
  set +e
  output=$(echo "$input" | node "$hook" 2>/dev/null)
  set -e

  if [ -z "$output" ]; then
    printf "  ${GREEN}PASS${NC} %s\n" "$name"
    PASS=$((PASS + 1))
  else
    printf "  ${RED}FAIL${NC} %s (expected empty stdout, got: '%s')\n" "$name" "$output"
    FAIL=$((FAIL + 1))
  fi
}

echo "================================="
echo " Hook Unit Tests"
echo "================================="
echo ""

# ---- file-guard.js ----
echo "--- file-guard.js ---"
HOOK="$HOOKS_DIR/file-guard.js"
if [ -f "$HOOK" ]; then
  assert_exit "Safe file passes"        0 '{"tool":"Read","params":{"file_path":"/home/user/project/src/app.ts"}}' "$HOOK"
  assert_exit "SSH key blocked"         2 '{"tool":"Read","params":{"file_path":"/home/user/.ssh/id_rsa"}}' "$HOOK"
  assert_exit "AWS creds blocked"       2 '{"tool":"Read","params":{"file_path":"/home/user/.aws/credentials"}}' "$HOOK"
  assert_exit "Env file blocked"        2 '{"tool":"Read","params":{"file_path":"/home/user/project/.env"}}' "$HOOK"
  assert_exit "Private key blocked"     2 '{"tool":"Read","params":{"file_path":"/home/user/server.key"}}' "$HOOK"
  assert_exit "Docker config blocked"   2 '{"tool":"Read","params":{"file_path":"/home/user/.docker/config.json"}}' "$HOOK"
  assert_exit "Package.json warns"      1 '{"tool":"Read","params":{"file_path":"/home/user/project/package.json"}}' "$HOOK"
  assert_exit "No file path passes"     0 '{"tool":"Read","params":{}}' "$HOOK"
  assert_exit "Invalid JSON passes"     0 'not json' "$HOOK"
else
  echo "  SKIP — file-guard.js not found"
fi
echo ""

# ---- git-guard.js ----
echo "--- git-guard.js ---"
HOOK="$HOOKS_DIR/git-guard.js"
if [ -f "$HOOK" ]; then
  assert_output_contains "Safe command approved" "approve" '{"tool_name":"Bash","tool_input":{"command":"echo hello"}}' "$HOOK"
  assert_output_contains "rm -rf blocked"        "block"   '{"tool_name":"Bash","tool_input":{"command":"rm -rf /"}}' "$HOOK"
  assert_output_contains "Fork bomb blocked"     "block"   '{"tool_name":"Bash","tool_input":{"command":":(){ :|:& };:"}}' "$HOOK"
  assert_output_contains "DROP TABLE blocked"    "block"   '{"tool_name":"Bash","tool_input":{"command":"DROP TABLE users"}}' "$HOOK"
  assert_output_contains "Good commit passes"    "approve" '{"tool_name":"Bash","tool_input":{"command":"git commit -m \"feat: add login\""}}' "$HOOK"
  assert_output_contains "Bad commit blocked"    "block"   '{"tool_name":"Bash","tool_input":{"command":"git commit -m \"added stuff\""}}' "$HOOK"
  assert_output_contains "Force push blocked"    "block"   '{"tool_name":"Bash","tool_input":{"command":"git push --force origin main"}}' "$HOOK"
  assert_output_contains "Non-Bash passes"       "approve" '{"tool_name":"Read","tool_input":{"file_path":"test.ts"}}' "$HOOK"
else
  echo "  SKIP — git-guard.js not found"
fi
echo ""

# ---- secret-scanner.js ----
echo "--- secret-scanner.js ---"
HOOK="$HOOKS_DIR/secret-scanner.js"
if [ -f "$HOOK" ]; then
  assert_exit "Non-commit passes"      0 '{"tool_input":{"command":"echo hello"}}' "$HOOK"
  assert_exit "Commit with no files"   0 '{"tool_input":{"command":"git commit -m \"feat: test\""}}' "$HOOK"
  assert_exit "Invalid JSON passes"    0 'not json' "$HOOK"
else
  echo "  SKIP — secret-scanner.js not found"
fi
echo ""

# ---- anti-rationalization.js ----
echo "--- anti-rationalization.js ---"
HOOK="$HOOKS_DIR/anti-rationalization.js"
if [ -f "$HOOK" ]; then
  # Should trigger with decision:block on vague completion
  assert_stdout_contains "Detects 'should work' with decision:block" '"decision":"block"' \
    '{"transcript":"The fix should work now. Ca devrait marcher.","stop_reason":"end_turn"}' "$HOOK"
  assert_stdout_contains "Block reason contains anti-rationalization" "ANTI-RATIONALIZATION" \
    '{"transcript":"The fix should work now. Ca devrait marcher.","stop_reason":"end_turn"}' "$HOOK"
  # Should not trigger on clean completion
  assert_stdout_empty "Clean completion passes" \
    '{"transcript":"All tests pass. Implementation complete with full coverage.","stop_reason":"end_turn"}' "$HOOK"
  # Should not trigger on user interrupt
  assert_stdout_empty "User interrupt not checked" \
    '{"transcript":"should work","stop_reason":"user_interrupt"}' "$HOOK"
else
  echo "  SKIP — anti-rationalization.js not found"
fi
echo ""

# ---- loop-detector.js ----
echo "--- loop-detector.js ---"
HOOK="$HOOKS_DIR/loop-detector.js"
if [ -f "$HOOK" ]; then
  # Verify stdout output format (not stderr) — use a fresh state
  TEMP_BAK="${TEMP:-/tmp}/claude-loop-detector.json"
  STATS_BAK="${TEMP:-/tmp}/claude-session-stats.json"
  # Backup existing state
  [ -f "$TEMP_BAK" ] && cp "$TEMP_BAK" "${TEMP_BAK}.bak" 2>/dev/null || true
  [ -f "$STATS_BAK" ] && cp "$STATS_BAK" "${STATS_BAK}.bak" 2>/dev/null || true
  # Reset state for test
  echo '{"history":[],"lastUpdate":0}' > "$TEMP_BAK"
  echo '{"startedAt":'"$(date +%s000)"',"totalCalls":0,"toolCounts":{},"filesModified":[],"filesRead":[],"errors":0,"errorDetails":[],"bashCommands":[],"commitMessages":[],"contextWarned":false}' > "$STATS_BAK"

  # Feed same Edit call 5+ times to trigger CRITICAL repeat
  EDIT_INPUT='{"tool_name":"Edit","tool_input":{"file_path":"/tmp/test.ts","old_string":"a","new_string":"b"},"tool_output":"ok"}'
  for i in 1 2 3 4; do
    echo "$EDIT_INPUT" | node "$HOOK" > /dev/null 2>/dev/null || true
  done
  # 5th call should output loop critical on stdout
  set +e
  loop_output=$(echo "$EDIT_INPUT" | node "$HOOK" 2>/dev/null)
  set -e
  if echo "$loop_output" | grep -q "hookSpecificOutput"; then
    printf "  ${GREEN}PASS${NC} Loop critical outputs hookSpecificOutput on stdout\n"
    PASS=$((PASS + 1))
  else
    printf "  ${RED}FAIL${NC} Loop critical should output hookSpecificOutput on stdout\n"
    FAIL=$((FAIL + 1))
  fi

  # Verify Read (read-only) doesn't produce loop output
  echo '{"history":[],"lastUpdate":0}' > "$TEMP_BAK"
  READ_INPUT='{"tool_name":"Read","tool_input":{"file_path":"/tmp/test.ts"},"tool_output":"content"}'
  for i in 1 2 3 4 5; do
    echo "$READ_INPUT" | node "$HOOK" > /dev/null 2>/dev/null || true
  done
  set +e
  read_output=$(echo "$READ_INPUT" | node "$HOOK" 2>/dev/null)
  set -e
  if [ -z "$read_output" ]; then
    printf "  ${GREEN}PASS${NC} Read-only tools skip loop detection\n"
    PASS=$((PASS + 1))
  else
    printf "  ${RED}FAIL${NC} Read-only tools should not trigger loop detection\n"
    FAIL=$((FAIL + 1))
  fi

  # Restore state
  [ -f "${TEMP_BAK}.bak" ] && mv "${TEMP_BAK}.bak" "$TEMP_BAK" 2>/dev/null || rm -f "$TEMP_BAK"
  [ -f "${STATS_BAK}.bak" ] && mv "${STATS_BAK}.bak" "$STATS_BAK" 2>/dev/null || rm -f "$STATS_BAK"
else
  echo "  SKIP — loop-detector.js not found"
fi
echo ""

# ---- pre-completion-gate.js ----
echo "--- pre-completion-gate.js ---"
HOOK="$HOOKS_DIR/pre-completion-gate.js"
if [ -f "$HOOK" ]; then
  STATS_FILE="${TEMP:-/tmp}/claude-session-stats.json"
  [ -f "$STATS_FILE" ] && cp "$STATS_FILE" "${STATS_FILE}.bak" 2>/dev/null || true

  # Should pass when no source files modified
  echo '{"startedAt":'"$(date +%s000)"',"totalCalls":10,"toolCounts":{},"filesModified":["/tmp/README.md"],"filesRead":[],"errors":0,"errorDetails":[],"bashCommands":[],"commitMessages":[],"contextWarned":false}' > "$STATS_FILE"
  assert_stdout_empty "No source files → passes" '{}' "$HOOK"

  # Should pass when session too short
  echo '{"startedAt":'"$(date +%s000)"',"totalCalls":2,"toolCounts":{},"filesModified":["/tmp/app.ts"],"filesRead":[],"errors":0,"errorDetails":[],"bashCommands":[],"commitMessages":[],"contextWarned":false}' > "$STATS_FILE"
  assert_stdout_empty "Short session → passes" '{}' "$HOOK"

  # Should pass when no stats file
  rm -f "$STATS_FILE"
  assert_stdout_empty "No stats file → passes" '{}' "$HOOK"

  # Restore
  [ -f "${STATS_FILE}.bak" ] && mv "${STATS_FILE}.bak" "$STATS_FILE" 2>/dev/null || rm -f "$STATS_FILE"
else
  echo "  SKIP — pre-completion-gate.js not found"
fi
echo ""

# ---- Summary ----
echo "================================="
TOTAL=$((PASS + FAIL))
printf " Results: ${GREEN}%d passed${NC}, ${RED}%d failed${NC} / %d total\n" "$PASS" "$FAIL" "$TOTAL"
echo "================================="

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
