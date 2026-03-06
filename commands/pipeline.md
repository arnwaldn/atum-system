---
description: "Orchestrate feature lifecycle: discover → plan → execute → review → retro. Inspired by jeffallan/claude-skills workflow pipeline."
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, AskUserQuestion, Agent, EnterPlanMode, ExitPlanMode
argument-hint: "[discover <feature>] [plan] [execute] [review] [retro] [status]"
---

# /pipeline — Feature Lifecycle Orchestrator

Manage a feature through 5 structured phases with persistent state and checkpoints between phases.

## Arguments

Parse `$ARGUMENTS`:

| Command | Action |
|---------|--------|
| (none) or `status` | Show current pipeline state |
| `discover <description>` | Start Phase 1: Discovery & Requirements |
| `plan` | Start Phase 2: Architecture & Implementation Plan |
| `execute` | Start Phase 3: Implementation (TDD) |
| `review` | Start Phase 4: Code Review & Security |
| `retro` | Start Phase 5: Retrospective & Lessons Learned |
| `reset` | Reset pipeline state for current project |

## State Management

### Project Identification
```bash
PROJECT_ID=$(git remote get-url origin 2>/dev/null | sed 's|.*://||;s|\.git$||;s|/|-|g' || basename "$(pwd)")
```

### State File
`~/.claude/data/pipelines/{PROJECT_ID}.json`

```json
{
  "project_id": "github.com-user-repo",
  "feature": "Feature description",
  "current_phase": "discover|plan|execute|review|retro|complete",
  "started": "ISO timestamp",
  "phases": {
    "discover": { "status": "pending|in_progress|complete", "completed_at": null, "artifact": null },
    "plan": { "status": "pending", "completed_at": null, "artifact": null },
    "execute": { "status": "pending", "completed_at": null, "artifact": null },
    "review": { "status": "pending", "completed_at": null, "artifact": null },
    "retro": { "status": "pending", "completed_at": null, "artifact": null }
  }
}
```

### Artifacts Directory
All artifacts saved in `specs/{feature-slug}/` relative to project root:
- `discovery.md` — Phase 1 output
- `plan.md` — Phase 2 output
- `progress.md` — Phase 3 tracking
- `review.md` — Phase 4 output
- `retro.md` — Phase 5 output

---

## Status Display

When no arguments or `status`:

```
Pipeline: {feature}
Project:  {project_id}
Started:  {date}

  [x] Discover  — {date} — specs/{slug}/discovery.md
  [>] Plan      — In progress
  [ ] Execute
  [ ] Review
  [ ] Retro
```

---

## Phase 1: Discover

**Trigger**: `/pipeline discover "feature description"`

1. Create state file and specs directory
2. Run `/common-ground` if no ground file exists for this project (surface assumptions first)
3. Execute the Feature Analyzer workflow:
   - Explore codebase for relevant patterns
   - Ask clarifying questions (AskUserQuestion, one at a time)
   - Document requirements, architecture, acceptance criteria
4. Save output to `specs/{slug}/discovery.md`
5. Update state: discover → complete

### Checkpoint: Discover → Plan
Present via AskUserQuestion:
- "Discovery complete. Spec saved to specs/{slug}/discovery.md. Ready to plan?"
- Options: "Continue to planning", "Revise discovery", "Pause here"

---

## Phase 2: Plan

**Trigger**: `/pipeline plan`
**Requires**: Phase 1 complete

1. Read `specs/{slug}/discovery.md`
2. Enter Plan Mode (EnterPlanMode)
3. Design implementation approach:
   - Break into tasks with complexity estimates
   - Identify dependencies between tasks
   - Map files to create/modify per task
   - Define test strategy
4. Save plan to `specs/{slug}/plan.md`
5. Exit Plan Mode (ExitPlanMode) for user approval
6. Update state: plan → complete

### Plan Format
```markdown
# Implementation Plan: {feature}

## Tasks
- [ ] Task 1 — [low/medium/high] — {files}
- [ ] Task 2 — [low/medium/high] — {files}

## Dependencies
- Task 2 depends on Task 1

## Test Strategy
- Unit: {approach}
- Integration: {approach}
- E2E: {if applicable}
```

### Checkpoint: Plan → Execute
Present via AskUserQuestion:
- "Plan ready with {N} tasks. Review specs/{slug}/plan.md. Begin implementation?"
- Options: "Start executing", "Revise plan", "Pause here"

---

## Phase 3: Execute

**Trigger**: `/pipeline execute`
**Requires**: Phase 2 complete

1. Read `specs/{slug}/plan.md`
2. Create `specs/{slug}/progress.md` for tracking
3. For each task in order:
   a. Mark task as in_progress in progress.md
   b. If task is high complexity → Checkpoint (AskUserQuestion before starting)
   c. Write tests FIRST (TDD)
   d. Implement to pass tests
   e. Run tests, show output
   f. Mark task as complete in progress.md
   g. Update plan.md checkbox
4. After all tasks: run full test suite
5. Update state: execute → complete

### Checkpoint: Execute → Review
Present via AskUserQuestion:
- "Implementation complete. {N}/{N} tasks done. {test results}. Ready for review?"
- Options: "Continue to review", "Fix issues first", "Pause here"

---

## Phase 4: Review

**Trigger**: `/pipeline review`
**Requires**: Phase 3 complete

1. Launch review agents in parallel:
   - **code-reviewer** agent → code quality, patterns, maintainability
   - **security-reviewer** (if auth/input handling detected) → OWASP, secrets, injection
2. Collect findings
3. Present findings grouped by severity: CRITICAL / HIGH / MEDIUM / LOW
4. Save to `specs/{slug}/review.md`
5. If CRITICAL findings: block until fixed, re-run review
6. Update state: review → complete

### Checkpoint: Review → Retro
Present via AskUserQuestion:
- "Review complete. {N} findings ({critical}/{high}/{medium}/{low}). Generate retrospective?"
- Options: "Continue to retro", "Fix findings first", "Pause here"

---

## Phase 5: Retro

**Trigger**: `/pipeline retro`
**Requires**: Phase 4 complete

1. Gather metrics:
   - Files created/modified (git diff --stat)
   - Tests added (count test files)
   - Time span (started → now)
   - Review findings addressed
2. Generate retrospective:
   - Summary of what was built
   - What went well
   - What could improve
   - Patterns to reuse
   - Technical debt introduced (if any)
3. Save to `specs/{slug}/retro.md`
4. Update state: all phases → complete

### Output
```markdown
# Retrospective: {feature}

## Summary
{1-2 sentences}

## Metrics
- Files: {created} created, {modified} modified
- Tests: {count} added
- Duration: {time}
- Review: {findings addressed}/{total}

## What Went Well
- {item}

## What Could Improve
- {item}

## Patterns to Reuse
- {item}

## Follow-up
- {any remaining items}
```

---

## Phase Guards

Each phase checks its prerequisite before running:
- `plan` requires `discover` complete → otherwise: "Run `/pipeline discover` first"
- `execute` requires `plan` complete → otherwise: "Run `/pipeline plan` first"
- `review` requires `execute` complete → otherwise: "Run `/pipeline execute` first"
- `retro` requires `review` complete → otherwise: "Run `/pipeline review` first"

Exception: `/pipeline discover` can start fresh at any time (creates new pipeline).

---

## Integration with Existing Commands

| Phase | Reuses |
|-------|--------|
| Discover | `/feature-analyzer` workflow + `/common-ground` skill |
| Plan | EnterPlanMode + planner agent |
| Execute | `/feature-pipeline` pattern (checkbox tracking, TDD) |
| Review | code-reviewer + security-reviewer agents |
| Retro | New (git metrics + structured reflection) |
