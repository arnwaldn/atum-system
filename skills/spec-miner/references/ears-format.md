# EARS Format (Easy Approach to Requirements Syntax)

## Overview

EARS is a structured natural language syntax for writing requirements that reduces ambiguity. Each requirement follows a specific pattern based on its type. When reverse-engineering specifications, EARS format ensures extracted requirements are precise and testable.

## The 5 EARS Patterns

### 1. Ubiquitous (Always Active)

Requirements that are always true, with no trigger or condition.

**Pattern**: `The <system> shall <action>.`

```
The system shall encrypt all data at rest using AES-256.
The API shall return responses in JSON format.
The application shall log all authentication attempts.
The service shall enforce HTTPS for all connections.
```

**When to use**: Constants, constraints, policies that are always in effect.

**Code indicators**:
- Global middleware
- Base class behaviors
- Configuration constants
- Security policies applied everywhere

### 2. Event-Driven (Triggered by Event)

Requirements activated by a specific event or trigger.

**Pattern**: `When <event>, the <system> shall <action>.`

```
When a user submits the registration form, the system shall send a verification email.
When the API receives a request without a valid token, the system shall return HTTP 401.
When disk usage exceeds 90%, the service shall trigger a cleanup job.
When a payment fails, the system shall retry up to 3 times with exponential backoff.
```

**When to use**: Event handlers, webhooks, triggers, callbacks.

**Code indicators**:
- Event listeners / handlers
- Route handlers (HTTP endpoints)
- Message queue consumers
- File watchers
- Cron jobs / scheduled tasks

### 3. State-Driven (Active While in State)

Requirements that apply while the system is in a particular state.

**Pattern**: `While <state>, the <system> shall <action>.`

```
While the system is in maintenance mode, the API shall return HTTP 503 for all requests.
While a user session is active, the system shall refresh the token every 15 minutes.
While the circuit breaker is open, the service shall return cached responses.
While the database is in read-only mode, the system shall reject all write operations.
```

**When to use**: State machines, modes, flags, feature toggles.

**Code indicators**:
- State variables / enums
- Feature flags
- Circuit breaker states
- Maintenance mode checks
- Session state management

### 4. Conditional (If-Then)

Requirements that apply only when a condition is true.

**Pattern**: `If <condition>, then the <system> shall <action>.`

```
If the request body exceeds 10MB, then the API shall return HTTP 413.
If the user has admin role, then the system shall display the management panel.
If no results are found, then the search shall return an empty array with HTTP 200.
If the external service is unavailable, then the system shall use the local cache.
```

**When to use**: Conditional logic, role-based behavior, fallbacks, validations.

**Code indicators**:
- If/else blocks with business logic
- Role/permission checks
- Validation rules
- Fallback/default behaviors
- Feature flag conditionals

### 5. Optional (Allowed But Not Required)

Capabilities the system may provide.

**Pattern**: `The <system> may <action>.`

```
The system may cache search results for up to 5 minutes.
The API may return partial results if the query times out after 30 seconds.
The service may batch notifications and send them every 5 minutes.
```

**When to use**: Optimizations, nice-to-haves, behaviors that occur sometimes.

**Code indicators**:
- Caching with TTL
- Performance optimizations
- Batch processing
- Non-critical features behind flags

## Combining Patterns

Complex behaviors often combine multiple EARS patterns:

```
# Event + Condition
When a user attempts login, if the account is locked, then the system
shall return "Account locked" with HTTP 403.

# State + Event
While the system is in degraded mode, when a new request arrives,
the system shall route it to the backup service.

# Event + Ubiquitous
When a user is created, the system shall assign a unique UUID
(the system shall use UUIDv4 for all entity identifiers).
```

## Writing Quality Criteria

### Good Requirements

| Criterion | Test | Example |
|-----------|------|---------|
| Atomic | Covers exactly one behavior | "The API shall return 404 when the resource does not exist" |
| Testable | Can write a test for it | "Latency shall be < 200ms for 95% of requests" |
| Unambiguous | One possible interpretation | "The password shall be at least 8 characters" |
| Complete | Covers the full behavior | "When login fails 5 times, the account shall be locked for 30 minutes" |
| Traceable | Links to code evidence | "[src/auth.py:42] When token expires, the system shall return 401" |

### Bad Requirements (Anti-Patterns)

| Anti-Pattern | Example | Fix |
|-------------|---------|-----|
| Vague | "The system shall be fast" | "95% of API calls shall complete in < 200ms" |
| Compound | "The system shall validate and save and notify" | Split into 3 separate requirements |
| Implementation-specific | "The system shall use Redis to cache" | "The system shall cache results for 5 minutes" |
| Untestable | "The UI shall be user-friendly" | "The checkout flow shall require < 4 clicks" |
| Negative without alternative | "The system shall not crash" | "When an unhandled error occurs, the system shall return 500 and log the error" |

## Reverse-Engineering with EARS

### Step-by-Step Process

```
1. Identify the code behavior
   → Read the function/handler, understand what it does

2. Classify the EARS pattern
   → Is it always active? Triggered? Conditional? State-dependent?

3. Extract the requirement
   → Write it in EARS syntax

4. Add code evidence
   → Link to file:line

5. Assign confidence level
   → HIGH (code + tests), MEDIUM (code only), LOW (inferred)
```

### Example: Extracting from a Route Handler

```python
# Source: src/routes/users.py:23-45
@router.post("/users")
async def create_user(user: UserCreate):
    if await user_exists(user.email):
        raise HTTPException(status_code=409, detail="Email already registered")
    if len(user.password) < 8:
        raise HTTPException(status_code=422, detail="Password too short")
    new_user = await save_user(user)
    await send_verification_email(new_user.email)
    return {"id": new_user.id, "status": "pending_verification"}
```

**Extracted EARS requirements**:

```
REQ-USER-001 [Event-Driven]: When a user submits registration data,
  the system shall create a new user account with status "pending_verification".
  Evidence: src/routes/users.py:23-45. Confidence: HIGH.

REQ-USER-002 [Conditional]: If the email is already registered,
  then the system shall return HTTP 409 with message "Email already registered".
  Evidence: src/routes/users.py:26. Confidence: HIGH.

REQ-USER-003 [Conditional]: If the password is less than 8 characters,
  then the system shall return HTTP 422 with message "Password too short".
  Evidence: src/routes/users.py:28. Confidence: HIGH.

REQ-USER-004 [Event-Driven]: When a user account is created,
  the system shall send a verification email to the registered address.
  Evidence: src/routes/users.py:31. Confidence: HIGH.
```

## EARS Numbering Convention

```
REQ-{DOMAIN}-{NUMBER}

Domains:
  AUTH  — Authentication and authorization
  USER  — User management
  DATA  — Data operations
  API   — API behavior and contracts
  SEC   — Security requirements
  PERF  — Performance requirements
  ERR   — Error handling
  INT   — Integration with external systems
  NFR   — Non-functional requirements
```

## Template for Requirement Entry

```markdown
### REQ-{DOMAIN}-{NNN} [{EARS Pattern}]

{Requirement in EARS syntax}

- **Evidence**: `{file}:{line}` — {brief description of code}
- **Confidence**: {HIGH | MEDIUM | LOW}
- **Tests**: {test file:line if exists, or "No test coverage"}
- **Notes**: {any caveats, assumptions, or related requirements}
```
