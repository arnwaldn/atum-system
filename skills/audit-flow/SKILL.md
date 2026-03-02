---
name: audit-flow
description: Interactive system flow tracing across CODE, API, AUTH, DATA, NETWORK layers with SQLite persistence and Mermaid export. Use when auditing system architecture, tracing data flows, documenting security boundaries, or mapping component interactions.
---

# Audit Flow: Interactive System Flow Tracing

**Audit Flow** is a Python-based CLI tool for tracing system flows across five architectural layers (CODE, API, AUTH, DATA, NETWORK) with SQLite persistence and Mermaid diagram export.

## Key Capabilities

The tool supports interactive session-based flow mapping with these features:

- **Multi-layer tracing:** CODE, API, NETWORK, AUTH, DATA
- **Non-linear flows:** Branching, merging, and conditional paths
- **Persistent storage:** SQLite database with Git integration
- **Multiple export formats:** JSON, YAML, Markdown, Mermaid diagrams
- **Git merge driver:** Auto-resolves SQLite conflicts during merges

## Critical Rules

**Entry sequence (ALWAYS execute first):**
1. Read `schema.sql` to understand the database structure
2. Check if `.audit/audit.db` exists
3. Never reinitialize an existing database

**Forbidden actions:** Deleting the database, recreating tables, or reinitializing when data exists destroys irreplaceable audit history.

**DB-first discipline:** "SQLite = sole source of truth. Context window: volatile, compacts without notice, hallucinates state."

## Workflow

Sessions begin by collecting: name, purpose (security-audit, documentation, compliance, ideation, debugging, architecture-review, or incident-review), and granularity (fine-grained ~50-200 tuples or coarse-grained ~10-30 tuples).

Flows use seven relation types with specific semantics: TRIGGERS, READS, WRITES, VALIDATES, TRANSFORMS, BRANCHES, and MERGES. Critical constraint: every BRANCHES edge requires a condition label.

## Organization

Output uses purpose-based directory structure:
- Audits/compliance: `docs/audits/{name}-{YYYY-MM-DD}/`
- Ideation: `docs/ideation/{name}-{YYYY-MM-DD}.md`
- Required files: INDEX.md (manifest), README.md (summary), {name}-audit.md (trace)

Diagrams automatically include entry point markers, step numbers, legends, and observation separation when exported via the CLI tool.

## CLI Usage

```bash
python audit.py init                          # Initialize database
python audit.py list                          # List all sessions
python audit.py show <session>                # Show session with flows
python audit.py show <session> <flow>         # Show specific flow
python audit.py export <session> [fmt]        # Export all flows
python audit.py export <session> <flow> [fmt] # Export specific flow
python audit.py csv-export                    # Export DB tables to .audit/csv/
python audit.py csv-import                    # Import .audit/csv/ into DB
python audit.py csv-merge <theirs_dir>        # Merge theirs CSVs into ours
```

## Relation Types

| Type | Semantics |
|------|-----------|
| TRIGGERS | Component A initiates Component B |
| READS | Component reads from data source |
| WRITES | Component writes to data source |
| VALIDATES | Component validates input/state |
| TRANSFORMS | Component transforms data format |
| BRANCHES | Flow splits conditionally (MUST have condition label) |
| MERGES | Multiple flow paths converge |

## Session Purposes

| Purpose | Use Case |
|---------|----------|
| security-audit | Trace auth flows, data boundaries, attack surfaces |
| documentation | Map system architecture, component interactions |
| compliance | Audit data handling for regulatory requirements |
| ideation | Explore design alternatives |
| debugging | Trace error propagation paths |
| architecture-review | Evaluate system design decisions |
| incident-review | Post-mortem flow reconstruction |
