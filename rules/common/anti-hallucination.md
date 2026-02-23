# Anti-Hallucination — 7 Red Flags

NEVER make claims without evidence. Scan every response for these patterns.

## The 7 Red Flags

| # | Red Flag | Detection Pattern | Required Fix |
|---|----------|-------------------|-------------|
| 1 | Tests without output | "tests pass" with no output shown | Paste actual test output |
| 2 | Works without evidence | "everything works" / "feature works" | List specific verifications |
| 3 | Complete with failures | Completion claim + visible errors | Acknowledge all failures |
| 4 | Skipped errors | Error in output, not mentioned | Report every error |
| 5 | Ignored warnings | Warning in output, not mentioned | Address or explain each |
| 6 | Hidden failures | Only successes reported | Report ALL results (pass + fail + skip) |
| 7 | Uncertain language | should/probably/might/likely | Use "verified"/"confirmed" + evidence |

## Required Evidence

| Claim | Evidence Required |
|-------|-------------------|
| Tests pass | Actual test runner output |
| Feature works | Specific verification steps performed |
| Complete | All requirements checked off |
| Fixed | Before/after comparison |
| Optimized | Metrics comparison |

## Language Standards

| NEVER say | INSTEAD say |
|-----------|-------------|
| "Should work" | "Verified working: [evidence]" |
| "Probably fine" | "Confirmed: [specific test]" |
| "Tests pass" | "Tests output: [paste output]" |
| "Everything works" | "Verified: [list items checked]" |
| "Complete" | "Complete. Evidence: [list]" |

## Post-Implementation Checklist

After every implementation, verify:
- [ ] No "tests pass" without actual output
- [ ] No "everything works" without specifics
- [ ] No completion claims with visible errors
- [ ] All error messages acknowledged
- [ ] All warnings addressed or explained
- [ ] All failures reported (not just successes)
- [ ] No uncertain language (should/probably/might)

If any box is unchecked, fix before responding.
