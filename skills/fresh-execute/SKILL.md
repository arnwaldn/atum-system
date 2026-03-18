---
name: fresh-execute
description: Execute a complex feature with fresh context per sub-task to prevent quality degradation
version: "1.0.0"
user_invocable: true
metadata:
  domain: workflow
  triggers: fresh context, decompose feature, sub-tasks, context degradation, long session, atomic tasks, fresh execute
  role: specialist
  scope: implementation
  output-format: code
  related-skills: context-engineering-kit
---

# Fresh Execute — Anti-Context-Rot Feature Implementation

Execute complex features by decomposing them into atomic sub-tasks, each running in a subagent with a fresh 200k token context window.

## When to Use

- Feature requires 3+ distinct changes across multiple files
- Session is already long (50+ tool calls) and quality might degrade
- Large refactoring touching many files
- Any task where consistent quality across all changes is critical

## Instructions

When this skill is invoked:

1. **Read the user's feature request** from: $ARGUMENTS (or ask if not provided)

2. **Launch the fresh-executor agent** to handle the decomposition and execution:

```
Use the Agent tool with:
- subagent_type: "fresh-executor"
- prompt: The full feature request with any context the user provided
- description: "Fresh execute: [brief summary]"
```

3. **Report the results** back to the user:
- List all tasks completed
- Show test results
- Highlight any issues encountered

## Example Usage

```
/fresh-execute Add JWT authentication with login, signup, and password reset endpoints to the Flask API
```

The agent will:
1. Analyze the Flask codebase
2. Decompose into ~3 tasks (auth service, endpoints, password reset)
3. Execute each in a fresh context subagent
4. Verify each step
5. Run integration tests