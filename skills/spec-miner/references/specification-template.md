# Specification Template

## Output Document Structure

Use this template when assembling the final reverse-engineered specification. The document captures everything discovered during analysis, organized for stakeholder review.

---

## Template

```markdown
# Reverse-Engineered Specification: {Project Name}

**Generated**: {Date}
**Analyzed by**: Spec Miner (Claude Code)
**Source**: {Repository URL or path}
**Commit**: {Git SHA at time of analysis}
**Analysis scope**: {Full system | Specific module/feature}

---

## 1. Executive Summary

{2-3 paragraphs describing what this system does, who uses it, and its core purpose.
Write for a non-technical stakeholder who needs to understand the system at a high level.}

### Key Numbers

| Metric | Value |
|--------|-------|
| Total source files | {N} |
| Languages | {list} |
| External dependencies | {N} |
| API endpoints | {N} |
| Database tables/collections | {N} |
| Test files | {N} |
| Estimated test coverage | {HIGH / MEDIUM / LOW / NONE} |

---

## 2. Technology Stack

### Core

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Language | {e.g., Python} | {3.12} | {any notes} |
| Framework | {e.g., FastAPI} | {0.109} | {any notes} |
| Database | {e.g., PostgreSQL} | {16} | {any notes} |
| Cache | {e.g., Redis} | {7.2} | {if applicable} |
| Message Queue | {e.g., RabbitMQ} | {3.12} | {if applicable} |

### Infrastructure

| Component | Technology | Notes |
|-----------|-----------|-------|
| Containerization | {Docker / None} | |
| Orchestration | {K8s / Docker Compose / None} | |
| CI/CD | {GitHub Actions / GitLab CI / etc.} | |
| Hosting | {AWS / GCP / Azure / Heroku / etc.} | |
| Monitoring | {Datadog / Prometheus / etc.} | |

### Key Dependencies

| Dependency | Purpose | Risk Level |
|-----------|---------|-----------|
| {package name} | {what it does} | {LOW / MEDIUM / HIGH} |

---

## 3. Architecture

### System Diagram

{ASCII or text description of the system architecture}

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client   │────>│   API    │────>│ Database │
│ (Browser) │<────│ (Server) │<────│ (Store)  │
└──────────┘     └────┬─────┘     └──────────┘
                      │
                      v
                 ┌──────────┐
                 │ External │
                 │ Service  │
                 └──────────┘
```

### Module Structure

```
{project root}/
├── {directory}/ — {purpose}
│   ├── {subdirectory}/ — {purpose}
│   └── {file} — {purpose}
├── {directory}/ — {purpose}
└── {directory}/ — {purpose}
```

### Component Responsibilities

| Component | Purpose | Key Files |
|-----------|---------|-----------|
| {name} | {what it does} | {files} |

### Data Flow

{Describe the primary data flows through the system}

```
{Flow name}:
User → {step 1} → {step 2} → {step 3} → Result
```

---

## 4. Data Model

### Entities

{For each database table / collection / model}

#### {Entity Name}

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| {name} | {type} | {PK / FK / NOT NULL / UNIQUE / etc.} | {notes} |

**Relationships**:
- {Entity} has many {Entity} (via {foreign key})
- {Entity} belongs to {Entity}

### Entity Relationship Summary

```
{Entity A} 1──* {Entity B}
{Entity B} *──1 {Entity C}
{Entity C} *──* {Entity D} (via {junction table})
```

---

## 5. API Specification

### Endpoints

{For each API endpoint}

#### {METHOD} {path}

| Attribute | Value |
|-----------|-------|
| **Purpose** | {what it does} |
| **Auth required** | {Yes / No — what role} |
| **Rate limited** | {Yes / No — what limit} |
| **Evidence** | `{file}:{line}` |

**Request**:
```json
{
  "field": "type — description"
}
```

**Success response** ({status code}):
```json
{
  "field": "type — description"
}
```

**Error responses**:

| Status | Condition | Body |
|--------|-----------|------|
| {code} | {when} | {response} |

---

## 6. Observed Requirements (EARS Format)

### Authentication & Authorization

{Requirements extracted using EARS syntax}

#### REQ-AUTH-001 [Event-Driven]
When {event}, the system shall {behavior}.
- **Evidence**: `{file}:{line}`
- **Confidence**: {HIGH | MEDIUM | LOW}
- **Test**: `{test file}:{line}` or "No test coverage"

### User Management

{More EARS requirements by domain...}

### Data Operations

{...}

### Error Handling

{...}

### Security

{...}

---

## 7. Non-Functional Observations

### Performance

| Observation | Evidence | Impact |
|------------|----------|--------|
| {what was found} | `{file}:{line}` | {potential impact} |

### Security

| Pattern | Present | Evidence |
|---------|---------|----------|
| Input validation | {Yes / Partial / No} | `{file}` |
| SQL injection prevention | {Yes / Partial / No} | `{file}` |
| XSS prevention | {Yes / Partial / No} | `{file}` |
| CSRF protection | {Yes / Partial / No} | `{file}` |
| Authentication | {Type: JWT / Session / etc.} | `{file}` |
| Authorization | {Type: RBAC / ABAC / etc.} | `{file}` |
| Secret management | {Env vars / Vault / Hardcoded} | `{file}` |
| HTTPS enforcement | {Yes / No} | `{file}` |

### Error Handling

| Pattern | Observation |
|---------|-------------|
| Global error handler | {present / absent} |
| Structured error responses | {consistent / inconsistent} |
| Error logging | {present / absent / partial} |
| Retry policies | {present for X / absent} |
| Circuit breakers | {present / absent} |

### Logging & Observability

| Aspect | Observation |
|--------|-------------|
| Log format | {structured JSON / plain text / mixed} |
| Log levels | {used consistently / inconsistently} |
| Request tracing | {correlation IDs present / absent} |
| Metrics | {collected / not collected} |
| Health endpoints | {present / absent} |

---

## 8. Inferred Acceptance Criteria

{For each major feature, infer acceptance criteria from code and tests}

### Feature: {Name}

- [ ] {Criterion derived from code behavior}
- [ ] {Criterion derived from test assertions}
- [ ] {Criterion derived from validation rules}

---

## 9. Uncertainties & Questions

{Items that could not be determined from code alone}

| # | Question | Context | Impact |
|---|----------|---------|--------|
| 1 | {What is unclear} | {What code suggested} | {Why it matters} |

---

## 10. Recommendations

### Immediate (Quality/Security)

| # | Recommendation | Severity | Effort |
|---|---------------|----------|--------|
| 1 | {recommendation} | {HIGH / MEDIUM / LOW} | {S / M / L} |

### Future (Architecture/Scalability)

| # | Recommendation | Rationale | Effort |
|---|---------------|-----------|--------|
| 1 | {recommendation} | {why} | {S / M / L} |

---

## Appendix: Analysis Log

| Phase | Duration | Files Examined | Findings |
|-------|----------|---------------|----------|
| Reconnaissance | {time} | {N} | {summary} |
| Architecture | {time} | {N} | {summary} |
| Behavior | {time} | {N} | {summary} |
| Edge Cases | {time} | {N} | {summary} |
```

---

## Section-by-Section Guidance

### Executive Summary

- Write for a non-technical stakeholder
- Answer: What does this do? Who uses it? Why does it exist?
- Keep it to 2-3 paragraphs maximum
- Include the "key numbers" table for quick scanning

### Technology Stack

- Be specific about versions (matters for security and compatibility)
- Note any outdated or end-of-life dependencies
- Flag deprecated packages in the "Risk Level" column

### Architecture

- ASCII diagrams are preferred (no external tools needed)
- Show data flow direction with arrows
- List every directory with its purpose
- Identify clear component boundaries

### Data Model

- Capture all fields, types, and constraints
- Document relationships between entities
- Note any denormalization or unusual patterns
- Flag missing indexes or constraints

### API Specification

- Document both success and error responses
- Include auth requirements per endpoint
- Note rate limiting if present
- Capture request/response schemas

### Observed Requirements

- Use EARS format exclusively (see ears-format.md)
- Link every requirement to code evidence
- Assign confidence levels honestly
- Group by domain for readability

### Uncertainties

- Be honest about what you could not determine
- Provide context for each question
- Rate the impact of not knowing the answer
- These are valuable for stakeholder discussions
