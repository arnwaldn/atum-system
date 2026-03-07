# File Management

## Project Identification

### Priority Order
1. **Git remote**: `git remote get-url origin 2>/dev/null`
   - Extract: `github.com/user/repo` → sanitize to `github.com-user-repo`
2. **Fallback**: Current working directory absolute path
   - Sanitize: replace `\`, `/`, `:` with `-`, collapse multiples

### Storage Path
```
~/.claude/common-ground/{project_id}/
  COMMON-GROUND.md     # Human-readable
  ground.index.json    # Machine-readable
```

## COMMON-GROUND.md Format

```markdown
# Common Ground: {Project Name}

**Project ID:** {project_id}
**Created:** {ISO timestamp}
**Last Validated:** {ISO timestamp}

## ESTABLISHED

### 1. {Title}
- **Assumption:** {description}
- **Type:** {stated|inferred|assumed}
- **Source:** {where this was detected}
- **Since:** {date first tracked}

## WORKING

### 1. {Title}
- **Assumption:** {description}
- **Type:** {stated|inferred|assumed}
- **Source:** {where this was detected}
- **Since:** {date first tracked}

## OPEN

### 1. {Title}
- **Assumption:** {description}
- **Type:** {uncertain|assumed}
- **Source:** {where this was detected}
- **Since:** {date first tracked}
- **Needs:** {what would resolve this}

## History

| Date | Action | Assumption | From | To |
|------|--------|-----------|------|-----|
| {date} | Created | {title} | - | {tier} |
| {date} | Promoted | {title} | OPEN | WORKING |
```

## ground.index.json Format

```json
{
  "project_id": "github.com-user-repo",
  "project_name": "My Project",
  "created": "2026-03-06T10:00:00Z",
  "last_validated": "2026-03-06T10:00:00Z",
  "assumptions": [
    {
      "id": "arch-001",
      "title": "Next.js App Router",
      "assumption": "Project uses Next.js App Router (not Pages Router)",
      "type": "inferred",
      "tier": "ESTABLISHED",
      "category": "architecture",
      "source": "package.json: next@14, app/ directory exists",
      "created": "2026-03-06T10:00:00Z",
      "history": [
        {"date": "2026-03-06T10:00:00Z", "action": "created", "tier": "WORKING"},
        {"date": "2026-03-06T10:05:00Z", "action": "promoted", "tier": "ESTABLISHED"}
      ]
    }
  ]
}
```

## Operations

### Create / Update
1. Read existing files if they exist (preserve history)
2. Merge new assumptions with existing ones (match by title or id)
3. Append to history for any changes
4. Write both files atomically

### Read
1. Try `ground.index.json` first (machine operations)
2. Fall back to parsing `COMMON-GROUND.md` (human-edited)

### Staleness Detection
- If `last_validated` is >7 days old, suggest `--check` mode
- If `last_validated` is >30 days old, suggest full re-run
