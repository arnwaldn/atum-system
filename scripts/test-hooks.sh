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
  # Should trigger on vague completion
  assert_output_contains "Detects 'should work'" "stopReason" '{"transcript":"The fix should work now. Ca devrait marcher.","stop_reason":"end_turn"}' "$HOOK"
  # Should not trigger on clean completion
  set +e
  local_output=$(echo '{"transcript":"All tests pass. Implementation complete with full coverage.","stop_reason":"end_turn"}' | node "$HOOK" 2>&1)
  set -e
  if [ -z "$local_output" ] || ! echo "$local_output" | grep -q "stopReason"; then
    printf "  ${GREEN}PASS${NC} Clean completion passes\n"
    PASS=$((PASS + 1))
  else
    printf "  ${RED}FAIL${NC} Clean completion should not trigger\n"
    FAIL=$((FAIL + 1))
  fi
  # Should not trigger on user interrupt
  set +e
  local_output=$(echo '{"transcript":"should work","stop_reason":"user_interrupt"}' | node "$HOOK" 2>&1)
  set -e
  if [ -z "$local_output" ] || ! echo "$local_output" | grep -q "stopReason"; then
    printf "  ${GREEN}PASS${NC} User interrupt not checked\n"
    PASS=$((PASS + 1))
  else
    printf "  ${RED}FAIL${NC} User interrupt should be skipped\n"
    FAIL=$((FAIL + 1))
  fi
else
  echo "  SKIP — anti-rationalization.js not found"
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
