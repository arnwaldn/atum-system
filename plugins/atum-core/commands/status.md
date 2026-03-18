---
description: Project status overview — git activity, dependencies, tests, health
allowed-tools: Read, Bash, Grep, Glob
argument-hint: [--full | --quick | --deps | --git]
---

# Project Status: $ARGUMENTS

Analyze the current project and generate a comprehensive status report.

## 1. Project Detection

Identify the project type by checking for:
- `package.json` (Node.js/TypeScript)
- `requirements.txt` / `pyproject.toml` (Python)
- `go.mod` (Go)
- `Cargo.toml` (Rust)
- `pubspec.yaml` (Dart/Flutter)
- `pom.xml` / `build.gradle` (Java)

## 2. Git Status

Run these checks:
- `git status` — working tree state
- `git log --oneline -10` — recent commits
- `git branch` — local branches
- `git diff --stat HEAD~5` — recent changes scope
- `git stash list` — stashed work

## 3. Dependency Health

Based on detected project type:
- Node.js: `npm outdated`, `npm audit --audit-level=high`
- Python: `pip list --outdated`, `pip-audit` if available
- Go: `go list -m -u all`
- Rust: `cargo outdated`, `cargo audit`

## 4. Test Status

Run the test suite and report:
- Total tests, passed, failed, skipped
- Coverage percentage if available
- Last test run time

## 5. Code Health

- Count TODOs/FIXMEs: search for TODO, FIXME, HACK, XXX in source files
- File count by type
- Largest files (potential refactoring targets)

## 6. Report Format

Present as a structured dashboard:
```
PROJECT STATUS — [project name]
================================
Git:    [branch] | [X commits this week] | [clean/dirty]
Deps:   [X outdated] | [X vulnerabilities]
Tests:  [X passed] / [X total] | [coverage%]
Health: [X TODOs] | [X files > 500 lines]
================================
```

If `--quick` is specified, only show the dashboard summary.
If `--full` is specified, include detailed analysis for each section.
If `--deps` is specified, focus on dependency analysis.
If `--git` is specified, focus on git history and branch analysis.
