---
name: common-ground
description: |
  Surface and validate Claude's hidden assumptions about the project for user confirmation.
  Use when starting a new project, onboarding to a codebase, before major architectural decisions,
  or when the user says "hypotheses", "tu pars du principe que", "assumptions", "common ground".
  Invoke with /common-ground [--list] [--check] [--graph].
version: "1.0.0"
metadata:
  domain: workflow
  triggers: hypotheses, assumptions, common ground, tu pars du principe que, validate assumptions, onboarding, starting project
  role: specialist
  scope: analysis
  output-format: report
  related-skills: prompt-architect, spec-miner
---

# Common Ground

Surface Claude's implicit assumptions about the project so the user can validate or correct them before work begins.

## Arguments

Parse `$ARGUMENTS`:

| Flag | Mode | Description |
|------|------|-------------|
| (none) | Default | Surface & Adjust: two-phase interactive flow |
| `--list` | List | Read-only view of all tracked assumptions |
| `--check` | Check | Quick validation of current assumptions |
| `--graph` | Graph | Generate Mermaid diagram of reasoning structure |

## Reference Guide

| Topic | Reference | Load When |
|-------|-----------|-----------|
| Assumption Types & Tiers | `references/assumption-classification.md` | Classifying assumptions, determining type or tier |
| File Management | `references/file-management.md` | Storage operations, project ID, ground file format |
| Reasoning Graph | `references/reasoning-graph.md` | Using --graph flag, generating Mermaid diagrams |

## Core Workflow

### 1. Identify Project

```bash
git remote get-url origin 2>/dev/null
```
If found, use URL as project ID. Fallback: current working directory path.
Sanitize to filesystem-safe string for storage path.

### 2. Scan Project Context

Read configuration files to infer assumptions:
- `package.json`, `tsconfig.json`, `.eslintrc*`, `.prettierrc` (JS/TS)
- `pyproject.toml`, `setup.py`, `ruff.toml` (Python)
- `Cargo.toml` (Rust), `go.mod` (Go), `pom.xml` (Java)
- `docker-compose.yml`, `.env.example`, `Dockerfile`
- `.github/workflows/`, CI configs
- Existing `CLAUDE.md`, `.claude/` config

### 3. Surface Assumptions (Default Mode)

**Phase 1 — Surface & Select:**
Present assumptions grouped by category via AskUserQuestion (multiSelect):
- Architecture & Tech Stack
- Coding Standards & Conventions
- Testing & Quality
- Deployment & Infrastructure

For uncertain items, ask direct clarifying questions.

**Phase 2 — Adjust Tiers:**
Present selected assumptions with proposed tiers via AskUserQuestion:
- Options: "Accept all", "Promote some", "Demote some", "Add new"
- Promotions: OPEN -> WORKING -> ESTABLISHED
- Demotions: ESTABLISHED -> WORKING -> OPEN

### 4. Persist

Write to `~/.claude/common-ground/{project_id}/COMMON-GROUND.md` and `ground.index.json`.
See `references/file-management.md` for formats.

### 5. Output Summary

```
## Common Ground Complete
**Project:** {project_name}
**Tracked Assumptions:** {count}
- ESTABLISHED: {n} (high confidence)
- WORKING: {n} (medium confidence)
- OPEN: {n} (needs validation)
```

## --list Mode

Load and display `COMMON-GROUND.md` grouped by tier. If no file exists, redirect to default mode.

## --check Mode

Quick validation: present assumptions via AskUserQuestion with options "All valid", "Some need updates", "Full review needed". Update `last_validated` timestamp.

## --graph Mode

1. Run default flow if no existing ground file
2. Analyze reasoning structure behind confirmed assumptions
3. Generate Mermaid flowchart showing decision points, chosen paths, alternatives
4. Embed in COMMON-GROUND.md under `## Reasoning Graph`

## Constraints

### MUST DO
- Always identify project before file operations
- Use AskUserQuestion for all interactive selections
- Preserve assumption type (audit trail) — users cannot change type
- Write both human-readable (.md) and machine-readable (.json) files
- Include timestamps

### MUST NOT DO
- Assume context without surfacing assumptions
- Allow type changes (stated/inferred/assumed/uncertain are immutable)
- Proceed without user confirmation on tier changes
- Overwrite ground file without preserving history
