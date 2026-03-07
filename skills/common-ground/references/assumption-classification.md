# Assumption Classification

## Assumption Types (Immutable)

Types describe HOW the assumption was formed. Once assigned, they cannot be changed.

| Type | Definition | Example |
|------|-----------|---------|
| **stated** | User explicitly told us | "We use PostgreSQL" |
| **inferred** | Derived from project files | package.json has `next` dependency |
| **assumed** | Based on common patterns | "API follows REST conventions" |
| **uncertain** | Cannot determine from context | "Deployment target is unknown" |

### Detection Rules

**stated**: Found in CLAUDE.md, user messages, or explicit project docs.

**inferred**: Derived from:
- `package.json` dependencies → framework, test runner, linter
- `tsconfig.json` settings → strict mode, module system, target
- `.eslintrc*` → code style rules
- `pyproject.toml` → Python version, dependencies, tools
- `docker-compose.yml` → services, databases, cache layers
- CI configs → test commands, deployment targets
- Directory structure → architecture pattern (pages/, app/, src/lib/)

**assumed**: Common conventions not confirmed by files:
- "Tests should be colocated with source" (common but not universal)
- "API returns JSON by default"
- "Error responses follow a consistent format"

**uncertain**: Conflicting signals or missing information:
- No test config found → testing strategy unknown
- Multiple DB drivers in dependencies → which is primary?
- No deployment config → target environment unknown

## Confidence Tiers

Tiers describe HOW CONFIDENT we are. Users can adjust these.

| Tier | Confidence | When to Use |
|------|-----------|-------------|
| **ESTABLISHED** | High (>90%) | Confirmed by user OR multiple corroborating sources |
| **WORKING** | Medium (50-90%) | Single source, reasonable inference |
| **OPEN** | Low (<50%) | Uncertain, conflicting signals, or unverified |

### Tier Assignment Rules

1. **stated** assumptions start as ESTABLISHED
2. **inferred** assumptions start as WORKING (promote if corroborated)
3. **assumed** assumptions start as OPEN (promote only with user confirmation)
4. **uncertain** assumptions are always OPEN until clarified

### Promotion Criteria

OPEN → WORKING:
- User confirms the assumption is "probably right"
- A second independent source corroborates

WORKING → ESTABLISHED:
- User explicitly confirms
- Three or more independent sources agree
- Assumption has been validated in practice (code works as expected)

### Demotion Criteria

ESTABLISHED → WORKING:
- Contradicting evidence found
- User expresses doubt

WORKING → OPEN:
- Contradicting evidence found
- User says "not sure about that"

## Category Classification

Group assumptions by domain for presentation:

| Category | Signals |
|----------|---------|
| Architecture & Tech Stack | Frameworks, languages, database, infra patterns |
| Coding Standards | Linting, formatting, naming conventions, file organization |
| Testing & Quality | Test runner, coverage requirements, CI checks |
| Deployment & Infrastructure | Hosting, CI/CD, environment management |
| Security & Compliance | Auth patterns, data handling, regulatory requirements |
| Data & Storage | Database type, ORM, migration strategy, caching |
