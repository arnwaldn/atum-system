# Analysis Process

## Overview

A systematic approach to reverse-engineering specifications from existing codebases. The process moves from broad structure mapping to detailed behavior extraction, ensuring thorough coverage without premature conclusions.

## Phase 1: Reconnaissance

### Directory Structure Mapping

Start with a high-level view of the project:

```bash
# Map the overall structure
find . -type f -name "*.py" -o -name "*.js" -o -name "*.ts" -o -name "*.go" -o -name "*.rs" | head -100

# Identify entry points
grep -r "if __name__" --include="*.py" -l
grep -r "func main" --include="*.go" -l
grep -r "createServer\|listen(" --include="*.js" --include="*.ts" -l

# Find configuration files
find . -name "*.yml" -o -name "*.yaml" -o -name "*.toml" -o -name "*.json" -o -name "*.env*" | grep -v node_modules | grep -v __pycache__

# Identify test structure (reveals intended behaviors)
find . -type f -name "*test*" -o -name "*spec*" | head -50
```

### Technology Stack Detection

| Indicator | What to Look For | Glob Pattern |
|-----------|-----------------|--------------|
| Language | File extensions, shebang lines | `**/*.py`, `**/*.ts` |
| Framework | Import statements, config files | `requirements.txt`, `package.json`, `go.mod` |
| Database | ORM models, migration files, connection strings | `**/models/**`, `**/migrations/**` |
| API style | Route definitions, schema files | `**/routes/**`, `**/*.graphql`, `**/openapi*` |
| Auth | Auth middleware, token handling | `**/auth/**`, `**/middleware/**` |
| Deployment | Containerization, CI/CD | `Dockerfile`, `.github/workflows/**` |

### Dependency Analysis

```bash
# Python
grep -r "^import\|^from" --include="*.py" | sort | uniq -c | sort -rn | head -30

# JavaScript/TypeScript
grep -r "require(\|from '" --include="*.js" --include="*.ts" | sort | uniq -c | sort -rn | head -30

# Go
grep -r "import" --include="*.go" | sort | uniq -c | sort -rn | head -30
```

## Phase 2: Architecture Extraction

### Component Identification

Trace the system's logical components:

```
1. Entry points (main, server, CLI)
   └─ What starts the system?

2. Routing / Dispatching
   └─ How are requests/commands routed?

3. Business Logic
   └─ Where are domain rules implemented?

4. Data Access
   └─ How does the system read/write data?

5. External Integrations
   └─ What external services are called?

6. Cross-Cutting Concerns
   └─ Auth, logging, caching, error handling
```

### Data Flow Tracing

For each major feature, trace the complete data flow:

```
User Action
  → Entry Point (route/command)
    → Validation (input checking)
      → Business Logic (rules, calculations)
        → Data Access (read/write)
          → Response (output formatting)
            → User Sees Result
```

### Grep Patterns for Architecture Discovery

```bash
# Route definitions
grep -rn "app\.\(get\|post\|put\|delete\|patch\)" --include="*.py" --include="*.js"
grep -rn "@app\.route\|@router\." --include="*.py"
grep -rn "router\.\(get\|post\|put\|delete\)" --include="*.ts" --include="*.js"

# Database models / schemas
grep -rn "class.*Model\|class.*Schema\|CREATE TABLE\|db\.Column" --include="*.py"
grep -rn "Schema\|model\|@Entity\|@Table" --include="*.ts" --include="*.js"

# Error handling patterns
grep -rn "try\|catch\|except\|raise\|throw\|Error(" --include="*.py" --include="*.ts" --include="*.js" | head -30

# Authentication / authorization
grep -rn "auth\|token\|jwt\|session\|permission\|role\|login" -i --include="*.py" --include="*.ts" --include="*.js" | head -30

# Configuration loading
grep -rn "os\.environ\|process\.env\|config\.\|settings\." --include="*.py" --include="*.ts" --include="*.js" | head -20
```

## Phase 3: Behavior Extraction

### Two-Hat Approach

Alternate between two perspectives:

#### Arch Hat (Architecture)

Focus on structure, components, data flows, and technical decisions:
- What are the major components and their responsibilities?
- How do components communicate?
- What are the data stores and their schemas?
- What patterns are used (repository, factory, observer)?
- What are the deployment boundaries?

#### QA Hat (Quality Assurance)

Focus on observable behaviors, edge cases, and failure modes:
- What does the user see when X happens?
- What happens when input is invalid?
- What are the error messages and HTTP status codes?
- What are the rate limits, timeouts, and retry policies?
- What are the security boundaries?

### Extracting Requirements from Code

| Code Pattern | Requirement Type | Example |
|-------------|-----------------|---------|
| Input validation | Constraint | "Email must be valid format" |
| Error handler | Error behavior | "Returns 404 when resource not found" |
| Rate limiter | Non-functional | "Max 100 requests per minute per user" |
| Cache TTL | Performance | "Results cached for 5 minutes" |
| Auth check | Security | "Only admin users can delete resources" |
| Timeout config | Reliability | "External API calls timeout at 30 seconds" |
| Retry logic | Resilience | "Retries failed payments 3 times with exponential backoff" |

### Test-Driven Discovery

Tests are the best documentation of intended behavior:

```bash
# Find test files
find . -name "*test*" -o -name "*spec*" | grep -v node_modules

# Extract test names (reveals intended behaviors)
grep -rn "def test_\|it(\|describe(\|test(\|should " --include="*test*" --include="*spec*"

# Find assertions (reveals expected outcomes)
grep -rn "assert\|expect\|should\.\|toBe\|toEqual" --include="*test*" --include="*spec*"
```

## Phase 4: Documentation Assembly

### Evidence Tracking

Every observation must link to code evidence:

```markdown
**Observation**: User registration requires email verification
**Evidence**:
- `src/auth/register.py:45` — Creates unverified user record
- `src/auth/register.py:52` — Sends verification email
- `src/auth/verify.py:18` — Activates account on token validation
- `tests/test_auth.py:89` — Test: unverified user cannot login
**Confidence**: HIGH (code + test evidence)
```

### Confidence Levels

| Level | Evidence | Action |
|-------|----------|--------|
| HIGH | Multiple code paths + tests confirm | Document as observed requirement |
| MEDIUM | Code suggests but no tests confirm | Document with caveat |
| LOW | Inferred from patterns, no direct evidence | Document in uncertainties section |
| UNKNOWN | Cannot determine from code | Flag as question for stakeholder |

### Iteration Strategy

```
Pass 1: Broad structure (30 minutes)
  → Components, routes, models, major patterns

Pass 2: Deep dive per feature (1-2 hours)
  → Trace each feature end-to-end, document behaviors

Pass 3: Cross-cutting concerns (30 minutes)
  → Auth, error handling, logging, caching

Pass 4: Edge cases and gaps (30 minutes)
  → Error paths, missing tests, undocumented behaviors

Pass 5: Review and consolidate (30 minutes)
  → Remove duplicates, check confidence levels, flag questions
```

## Common Pitfalls

| Pitfall | Impact | Prevention |
|---------|--------|-----------|
| Assuming intent from variable names | False requirements | Trace actual behavior, not names |
| Ignoring dead code | Documenting unused features | Check if code is reachable |
| Missing environment-specific behavior | Incomplete spec | Check all config/env patterns |
| Skipping error paths | Happy-path-only spec | Trace every catch/except block |
| Treating tests as truth | Tests may be outdated | Cross-reference tests with code |
| Premature conclusions | Biased analysis | Complete all passes before finalizing |
