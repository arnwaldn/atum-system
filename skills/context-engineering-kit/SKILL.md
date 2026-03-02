---
name: context-engineering-kit
description: Context window management using the MAKER pattern. Use when context is degrading (>80% window used), when spawning sub-agents for complex tasks, or when you need structured context handoff between agents. Prevents hallucination from accumulated context rot.
---

# Context Engineering Kit (MAKER Pattern)

Standalone skill capturing the best ideas from NeoLabHQ/context-engineering-kit.
Focuses on context degradation detection, clean-state agent launches, and structured handoff.

**No hooks or plugins installed** -- this is a pure instruction-based skill.

## Core Concept: The MAKER Pattern

From the paper "Solving a Million-Step LLM Task with Zero Errors":

> Agent mistakes caused by accumulated context and hallucinations are removed by utilizing
> **clean-state agent launches**, **filesystem-based memory storage**, and **multi-agent voting
> during critical decision-making**.

### Why It Matters

LLMs degrade as context fills:
- **0-60% context used**: Optimal performance, full attention
- **60-80% context used**: Gradual degradation, increased repetition risk
- **80-100% context used**: Significant hallucination risk, missed instructions, context rot

The MAKER pattern prevents this by spawning fresh agents at logical boundaries instead of
continuing to accumulate context in a single session.

## Context Degradation Detection

### Signals That Context Is Degrading

Monitor for these indicators during a session:

1. **Quantitative signals**
   - Tool call count exceeds 80 (moderate risk) or 120 (high risk)
   - Session has been running for >45 minutes on complex multi-file work
   - More than 15 files have been read into context

2. **Qualitative signals**
   - Repeating the same tool call with identical parameters
   - Forgetting earlier decisions or constraints mentioned in the session
   - Producing code that contradicts patterns established earlier in the session
   - Losing track of which files have been modified
   - Suggesting solutions already tried and rejected

3. **Task-based signals**
   - Implementing a feature that spans >5 files
   - Debugging a chain of failures across multiple components
   - Large-scale refactoring touching >10 files

### When to Suggest Fresh Agent Spawn

If any of these are true, suggest spawning a sub-agent:
- Context window is estimated >80% full
- Current task has a clear boundary (phase complete, moving to new component)
- Quality of responses has visibly degraded (repetitions, contradictions)
- The remaining work is independent from what has been done so far

## Context Handoff Template

When spawning a fresh sub-agent, provide this structured handoff:

```markdown
## Context Handoff

### Summary
[1-3 sentences: what was accomplished so far]

### Project State
- **Working directory**: [absolute path]
- **Git info**: [current git state]
- **Key files modified**: [list of files changed in this session]
- **Key files to read**: [files the sub-agent needs to understand]

### Decisions Made
- [Decision 1]: [rationale]
- [Decision 2]: [rationale]
- [Decision N]: [rationale]

### Constraints and Requirements
- [Constraint 1]
- [Constraint 2]

### What Was Tried (and failed)
- [Approach 1]: [why it failed]
- [Approach 2]: [why it failed]

### Next Steps
1. [Specific task 1]
2. [Specific task 2]
3. [Specific task 3]

### Verification Criteria
- [ ] [How to verify task 1 is complete]
- [ ] [How to verify task 2 is complete]
```

## Parallel Agent Patterns

### Pattern: do-in-parallel

Execute the same task across multiple independent targets with context isolation.

**When to use**: Multiple files/components need the same type of change independently.

**How it works**:
1. Identify independent targets (files, modules, services)
2. Create a Task for each target with identical instructions adapted to the specific target
3. Each sub-agent gets a clean context with only the relevant file(s)
4. Collect results and verify consistency

**Example scenarios**:
- Adding error handling to 5 independent API endpoints
- Writing tests for 8 utility functions
- Updating imports across 10 files after a rename
- Applying a security fix pattern to multiple services

**Implementation**:
```
For each independent target:
  1. Spawn sub-agent with Task tool
  2. Provide: target file path, specific instruction, success criteria
  3. Sub-agent works in isolation (no git stash, no switching)
  4. Sub-agent commits only its own changes
```

### Pattern: launch-sub-agent

Launch a focused sub-agent with intelligent model selection and self-verification.

**When to use**: A task requires deep focus on a single component, or context is getting heavy.

**How it works**:
1. Define the task scope precisely (1-3 files, clear objective)
2. Select model based on complexity:
   - Simple/mechanical changes: standard model
   - Complex reasoning needed: model with extended thinking
3. Provide the Context Handoff Template (above)
4. Sub-agent executes with Zero-shot Chain-of-Thought reasoning
5. Sub-agent self-verifies before completing (runs tests, checks types)

**Implementation**:
```
1. Write context handoff to temp file or Task description
2. Spawn sub-agent via Task tool
3. Sub-agent reads context, executes, verifies
4. Sub-agent reports results (files changed, tests passed, issues found)
5. Main agent integrates results
```

### Pattern: do-and-judge

Execute a task with one agent, verify with another independent agent.

**When to use**: Critical changes where mistakes are costly (security, data migrations, API changes).

**How it works**:
1. Implementation agent executes the task
2. Judge agent reviews the changes independently (fresh context)
3. If judge finds issues, implementation agent retries
4. Loop until judge approves or max retries reached (3)

## Filesystem-Based Memory

Instead of relying on context window for state, persist to filesystem:

### Session State File

For long-running tasks, maintain a `.claude-session-state.json`:

```json
{
  "task": "Implement user authentication",
  "phase": "2-of-4",
  "completed": [
    "Phase 1: Database schema for users table",
    "Phase 1: User model with validation"
  ],
  "current": "Phase 2: Auth middleware",
  "remaining": [
    "Phase 3: Login/register endpoints",
    "Phase 4: Tests and documentation"
  ],
  "decisions": {
    "auth_strategy": "JWT with refresh tokens",
    "password_hashing": "bcrypt with 12 rounds"
  },
  "files_modified": [
    "src/models/user.ts",
    "src/db/migrations/001_users.sql"
  ]
}
```

### When to Write State

- After completing each logical phase
- Before suggesting a context compact
- When spawning a sub-agent (write state, pass file path)
- At session boundaries

### When to Read State

- At the start of a new session on the same task
- When a sub-agent begins work
- After a context compact to recover state

## Integration with Existing Workflow

This skill complements the existing setup:

- **loop-detector hook**: Already detects repetition patterns (3 consecutive repeats, ping-pong, >80/120 calls). When loop-detector fires, use this skill handoff template to spawn a fresh agent.
- **session-memory hook**: Already saves session summaries on Stop. Use those summaries as handoff context for follow-up sessions.
- **strategic-compact skill (ECC)**: When that skill suggests compaction, first write a session state file using the template above, then compact.
- **Task tool**: The primary mechanism for spawning sub-agents. Always provide the Context Handoff Template in the Task description.

## Quick Reference

| Situation | Action |
|-----------|--------|
| >80 tool calls in session | Consider spawning sub-agent for remaining work |
| >120 tool calls in session | Strongly recommend fresh agent spawn |
| Moving to new component/phase | Good boundary for context handoff |
| Repetition detected (loop-detector) | Spawn fresh agent with handoff |
| 5+ files need same change | Use do-in-parallel pattern |
| Critical change (security, data) | Use do-and-judge pattern |
| Complex single-component task | Use launch-sub-agent pattern |
| Before context compact | Write session state file first |
