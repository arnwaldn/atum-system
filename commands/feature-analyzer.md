---
description: "Turn ideas into fully formed designs and specs through natural collaborative dialogue. Use before implementing new features or making significant changes."
argument-hint: Feature description (e.g. "user authentication with OAuth")
allowed-tools: Read, Write, Grep, Glob, Bash, TodoWrite, AskUserQuestion, Task
---

# Feature Analyzer

Analyze and design features through structured discovery. Transform vague ideas into actionable specs.

## Phase 1: Discovery

**Goal**: Understand what needs to be built.

Initial request: $ARGUMENTS

1. Create a todo list tracking all phases
2. Explore the existing codebase to understand:
   - Current architecture and patterns
   - Related existing code (search with Glob and Grep)
   - Technology stack and conventions
3. If requirements are unclear, ask the user:
   - What problem does this solve?
   - Who are the users?
   - What are the hard constraints (time, tech, compatibility)?
4. Summarize understanding and confirm with user

## Phase 2: Architecture Design

**Goal**: Define the technical approach.

1. Identify affected layers (UI, API, DB, services)
2. Map out component structure:
   - New files/modules needed
   - Existing files to modify
   - Dependencies required
3. Define data flow:
   - Input sources
   - Processing/transformation steps
   - Storage/output destinations
4. Identify integration points with existing code
5. List technical decisions to be made (and propose defaults)

## Phase 3: Specification

**Goal**: Define what "done" looks like.

1. Write acceptance criteria (Given/When/Then format):
   ```
   Given [precondition]
   When [action]
   Then [expected result]
   ```
2. Define edge cases and error scenarios
3. Identify security considerations
4. Define performance requirements (if applicable)
5. List API contracts (endpoints, request/response shapes)

## Phase 4: Output

**Goal**: Deliver an actionable spec.

Produce a structured summary:

```markdown
## Feature: [name]

### Summary
[1-2 sentence description]

### Architecture
- Components: [list]
- Files to create: [list with paths]
- Files to modify: [list with paths]
- Dependencies: [new packages if any]

### Acceptance Criteria
1. [criterion 1]
2. [criterion 2]
...

### Edge Cases
- [edge case 1]: [how to handle]
- [edge case 2]: [how to handle]

### Implementation Order
1. [step 1] — [estimated complexity: low/medium/high]
2. [step 2]
...
```

Update the todo list marking each phase complete.

## Rules

- ALWAYS explore the codebase before designing — never assume structure
- Ask ONE clarifying question at a time
- Prefer extending existing patterns over introducing new ones
- Keep the spec concise but unambiguous
- Flag risks and unknowns explicitly
