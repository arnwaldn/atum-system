---
description: Execute implementation from a design document with checkbox tracking
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Task, AskUserQuestion, EnterPlanMode
argument-hint: <design-file.md>
---

# Feature Pipeline: $ARGUMENTS

Execute implementation tasks from a design/spec document. Track progress with checkboxes.

## Phase 1: Load Design

1. Read the design file specified in `$ARGUMENTS`
2. If no file specified, look for: `docs/design-*.md`, `docs/spec-*.md`, `docs/prd-*.md`, `DESIGN.md`, `SPEC.md`
3. If no design file found, ask the user

## Phase 2: Parse Tasks

Extract all tasks from the design file:
- Look for markdown checkboxes: `- [ ] Task description`
- Look for numbered lists with implementation steps
- Look for sections labeled "Implementation", "Tasks", "Steps", "Phases"

Build a task list and show current progress:
```
Feature Pipeline — [design file]
=================================
Progress: [X/Y] tasks completed
Phase 1: [status]
Phase 2: [status]
=================================
```

## Phase 3: Execution Loop

For each unchecked task, in order:

1. **Read** the task description from the design file
2. **Plan** the implementation (for complex tasks, use planner agent)
3. **Implement** using TDD:
   - Write test first
   - Implement to pass
   - Verify
4. **Update** the design file: change `- [ ]` to `- [x]` for the completed task
5. **Report** progress after each task

### Rules
- Follow the order specified in the design document
- If a task is blocked, skip and note the blocker
- If a task is ambiguous, ask the user for clarification
- After each task, run relevant tests to verify no regressions
- Commit after each logical group of tasks

## Phase 4: Completion

When all tasks are done:
1. Run full test suite
2. Show final progress report
3. List any skipped or blocked tasks
4. Suggest next steps (PR creation, deployment, etc.)

## Checkpoint Format

After each task, update the design file and show:
```
[X/Y] Completed: <task description>
  Files: <files created/modified>
  Tests: <test results>
  Next:  <next task preview>
```
