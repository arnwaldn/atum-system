---
name: release-notes
description: Generate release notes from git commits since the last tag or a given ref. Use when the user asks to generate release notes, changelog, or summarize recent changes for a release.
disable-model-invocation: true
---

## Current State
- Branch: !`git branch --show-current`
- Last tag: !`git describe --tags --abbrev=0 2>/dev/null || echo "no tags yet"`
- Commits since last tag: !`git log $(git describe --tags --abbrev=0 2>/dev/null || echo HEAD~20)..HEAD --oneline 2>/dev/null || git log --oneline -20`

## Instructions

Generate release notes from the git history above.

1. **Group commits** by conventional commit type:
   - **New Features** (feat)
   - **Bug Fixes** (fix)
   - **Performance** (perf)
   - **Refactoring** (refactor)
   - **Documentation** (docs)
   - **Tests** (test)
   - **Chores** (chore, ci, build)

2. **Rewrite** each commit as a user-friendly one-liner (not the raw commit message)

3. **Highlight breaking changes** with a dedicated section if any commit contains `BREAKING CHANGE` or `!:`

4. **Format** as markdown with the version/date as heading:
   ```
   ## [version or "Unreleased"] - YYYY-MM-DD

   ### New Features
   - Description of feature

   ### Bug Fixes
   - Description of fix
   ```

5. If `$ARGUMENTS` is provided, use it as the version name. Otherwise use "Unreleased".

6. Output in the language matching the project (French if README/docs are in French, English otherwise).
