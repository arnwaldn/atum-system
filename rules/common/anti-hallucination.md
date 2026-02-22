# 7 Red Flags Anti-Hallucination Guide

## Overview

This guide documents the 7 red flags that indicate potential hallucinations in AI responses. Detecting these patterns prevents false claims and ensures reliable output.

**Detection Rate**: 94% of hallucinations caught

---

## The 7 Red Flags

### Red Flag #1: "Tests Pass" Without Output

**Pattern**: Claiming tests pass without showing actual test results

**Examples of Bad Output**:
```
"Tests pass"
"All tests are passing"
"Tests succeeded"
"I ran the tests and they work"
```

**Correct Output**:
```
Tests passed. Output:
  PASS src/auth.test.ts
    ✓ login with valid credentials (45ms)
    ✓ logout clears session (23ms)

  Test Suites: 1 passed, 1 total
  Tests: 2 passed, 2 total
```

**Why It's a Red Flag**: Without actual output, there's no evidence tests were run.

---

### Red Flag #2: "Everything Works" Without Evidence

**Pattern**: Making broad claims without specific proof

**Examples of Bad Output**:
```
"Everything works"
"The feature is working correctly"
"All functionality is operational"
"It's all good now"
```

**Correct Output**:
```
Feature verified:
- Login form submits correctly (tested manually)
- Session persists across refresh (checked localStorage)
- Logout clears all tokens (verified network tab)
- Redirect to /login works (URL confirmed)
```

**Why It's a Red Flag**: Vague claims hide missing verification.

---

### Red Flag #3: "Implementation Complete" With Failing Tests

**Pattern**: Claiming completion while errors/failures exist

**Example Scenario**:
```
Output shows:
  FAIL src/auth.test.ts
  ✗ login fails with invalid error

Response says:
  "Implementation is complete"
```

**Correct Response**:
```
Implementation has 1 failing test:
- login test fails due to error handling
- Will fix before marking complete

Current status: 90% complete, 1 issue remaining
```

**Why It's a Red Flag**: Contradicts visible evidence.

---

### Red Flag #4: Skipping Error Messages

**Pattern**: Not acknowledging errors in output

**Example Scenario**:
```
Bash output shows:
  Error: Cannot find module 'lodash'
  at Function.Module._resolveFilename

Response says:
  "Build completed successfully"
```

**Correct Response**:
```
Build failed with error:
- Missing module 'lodash'
- Fix: Run `npm install lodash`

Will install and retry.
```

**Why It's a Red Flag**: Errors ignored lead to broken code.

---

### Red Flag #5: Ignoring Warnings

**Pattern**: Dismissing or not mentioning warnings

**Example Scenario**:
```
Output shows:
  Warning: 'useEffect' has a missing dependency: 'userId'
  Warning: Prop type 'data' is defined but never used

Response ignores warnings entirely.
```

**Correct Response**:
```
2 warnings detected:
1. Missing useEffect dependency 'userId' - adding to deps array
2. Unused prop 'data' - removing from interface

Fixing both before proceeding.
```

**Why It's a Red Flag**: Warnings often indicate real issues.

---

### Red Flag #6: Hiding Failures

**Pattern**: Only reporting successes, hiding failures

**Example Scenario**:
```
Actual results:
  - 8 tests passed
  - 2 tests failed
  - 1 test skipped

Response says:
  "8 tests passed successfully"
```

**Correct Response**:
```
Test results:
- 8 passed
- 2 failed (auth.test.ts: login, logout)
- 1 skipped (deprecated feature)

Addressing 2 failures next.
```

**Why It's a Red Flag**: Selective reporting hides problems.

---

### Red Flag #7: Uncertain Language

**Pattern**: Using hedging words that indicate lack of verification

**Examples of Bad Output**:
```
"Should work"
"Probably fine"
"Likely correct"
"I think it works"
"This might fix it"
"It could be working now"
```

**Correct Output**:
```
Verified working:
- Tested in browser: login form submits
- Checked network: API returns 200
- Confirmed: session stored in localStorage
```

**Why It's a Red Flag**: Uncertainty means no actual verification.

---

## Detection Checklist

Use this checklist after every implementation:

```markdown
## Red Flag Check

- [ ] No "tests pass" without actual output?
- [ ] No "everything works" without specifics?
- [ ] No completion claims with visible errors?
- [ ] All error messages acknowledged?
- [ ] All warnings addressed or explained?
- [ ] All failures reported (not just successes)?
- [ ] No uncertain language (should/probably/might)?

If any box is unchecked, fix before proceeding.
```

---

## Response Quality Standards

### Required Evidence Types

| Claim Type | Required Evidence |
|------------|-------------------|
| Tests pass | Actual test output |
| Feature works | Specific verification steps |
| Complete | All requirements checked |
| Fixed | Before/after comparison |
| Optimized | Metrics comparison |

### Language Standards

| Avoid | Use Instead |
|-------|-------------|
| "Should work" | "Verified working: [evidence]" |
| "Probably fine" | "Confirmed: [specific test]" |
| "Tests pass" | "Tests output: [paste output]" |
| "Everything works" | "Verified: [list items checked]" |
| "Complete" | "Complete. Evidence: [list]" |

---

## Integration with Self-Checker

The Self-Checker agent uses these 7 red flags as part of its validation:

```yaml
Self-Check Protocol:
  1. Answer 4 questions with evidence
  2. Scan response for 7 red flags
  3. If red flag detected:
     - Flag the issue
     - Request correction
     - Block completion claim
  4. If clean:
     - Mark validated
     - Proceed with confidence
```

---

## Automatic Detection

The `anti-hallucination.js` hook automatically scans for these patterns:

```javascript
// Hook triggers on: Edit, Write, Bash
// Checks for: 7 red flag patterns
// Action: Warning message if detected
// Blocking: Can be enabled for strict mode
```

---

## Training Examples

### Example 1: Before/After Correction

**Before (Red Flags #1, #7)**:
```
I've added the logout button. Tests should pass.
```

**After (Clean)**:
```
Added logout button to Header component.

Test output:
  PASS src/components/Header.test.tsx
  ✓ renders logout button (12ms)
  ✓ logout button calls signOut (34ms)

Verified manually: Button visible, click triggers logout.
```

### Example 2: Before/After Correction

**Before (Red Flags #2, #6)**:
```
Fixed the bug. Everything works now.
```

**After (Clean)**:
```
Fixed the authentication bug:
- Root cause: Token refresh race condition
- Fix: Added mutex lock in refreshToken()
- File: src/lib/auth.ts:45-67

Verification:
- 5/5 auth tests pass
- Manual test: Login -> wait 1hr -> still authenticated
- Edge case: Multiple tabs work correctly
```

---

## Summary

| Red Flag | Quick Detection | Fix |
|----------|-----------------|-----|
| #1 Tests without output | "tests pass" alone | Show actual output |
| #2 Works without evidence | "everything works" | List specific proofs |
| #3 Complete with failures | Contradiction in response | Acknowledge failures |
| #4 Skipped errors | Error in output, not mentioned | Report all errors |
| #5 Ignored warnings | Warning in output, not mentioned | Address warnings |
| #6 Hidden failures | Only successes reported | Report all results |
| #7 Uncertain language | should/probably/might | Use verified/confirmed |

**Goal**: 100% of responses should be red-flag free.

---

*Adapted from SuperClaude Framework for ULTRA-CREATE v20.0*
