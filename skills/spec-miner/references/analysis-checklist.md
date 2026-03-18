# Analysis Checklist

## Purpose

Use this checklist to ensure thorough, systematic analysis. Check off each item as you investigate. Incomplete items represent gaps in the specification that should be flagged in the Uncertainties section.

## Pre-Analysis

- [ ] Repository cloned / accessible
- [ ] Branch and commit SHA recorded
- [ ] README.md read (if exists)
- [ ] CHANGELOG.md read (if exists)
- [ ] Package manifest read (package.json, requirements.txt, go.mod, Cargo.toml)
- [ ] Analysis scope defined (full system or specific modules)

## Structure & Stack

### Project Structure
- [ ] Root directory structure mapped
- [ ] Source code directories identified
- [ ] Test directories identified
- [ ] Configuration files located
- [ ] Build/deployment files located
- [ ] Documentation files located (if any)

### Technology Stack
- [ ] Primary language(s) identified
- [ ] Framework(s) identified with versions
- [ ] Database type identified
- [ ] Cache layer identified (if present)
- [ ] Message queue identified (if present)
- [ ] External service integrations listed

### Dependencies
- [ ] Direct dependencies listed
- [ ] Outdated dependencies flagged
- [ ] Security-sensitive dependencies noted (crypto, auth, HTTP)
- [ ] Dev vs production dependencies distinguished

## Architecture

### Components
- [ ] Entry points identified (main, server start, CLI)
- [ ] Routing/dispatching mechanism documented
- [ ] Business logic modules mapped
- [ ] Data access layer documented
- [ ] External integration points listed
- [ ] Background jobs/workers identified

### Communication Patterns
- [ ] Synchronous communication paths traced (HTTP, RPC)
- [ ] Asynchronous communication paths traced (queues, events)
- [ ] Internal service-to-service calls mapped
- [ ] External API calls identified

### Data Architecture
- [ ] Database schema extracted
- [ ] Entity relationships mapped
- [ ] Migration history reviewed
- [ ] Indexes documented
- [ ] Data validation rules captured

## Feature Analysis

### For Each Major Feature

- [ ] User-facing entry point identified
- [ ] Request/input validation rules documented
- [ ] Happy path traced end-to-end
- [ ] Error paths traced (what happens when things fail)
- [ ] Edge cases identified (empty input, max values, concurrent access)
- [ ] Response/output format documented
- [ ] Requirements written in EARS format
- [ ] Code evidence linked to each requirement

### API Endpoints (For Each)
- [ ] HTTP method and path documented
- [ ] Request schema captured (headers, body, query params)
- [ ] Success response schema captured
- [ ] Error response codes and bodies captured
- [ ] Authentication requirement noted
- [ ] Rate limiting noted (if present)
- [ ] Pagination pattern noted (if applicable)

## Cross-Cutting Concerns

### Authentication & Authorization
- [ ] Auth mechanism identified (JWT, session, OAuth, API key)
- [ ] Token lifecycle documented (creation, refresh, expiry)
- [ ] Role/permission model documented
- [ ] Protected vs public endpoints listed
- [ ] Auth middleware/decorator located

### Error Handling
- [ ] Global error handler identified
- [ ] Error response format documented
- [ ] Error logging mechanism noted
- [ ] Retry policies documented (if present)
- [ ] Circuit breaker patterns identified (if present)
- [ ] Timeout configurations noted

### Logging & Observability
- [ ] Log format identified (structured/unstructured)
- [ ] Log levels used correctly
- [ ] Request ID / correlation ID present
- [ ] Health check endpoints documented
- [ ] Metrics collection identified (if present)

### Security
- [ ] Input validation patterns assessed
- [ ] SQL injection prevention verified
- [ ] XSS prevention verified (if web)
- [ ] CSRF protection verified (if web)
- [ ] Secret management approach documented
- [ ] HTTPS enforcement checked
- [ ] Sensitive data handling reviewed (PII, passwords, tokens)
- [ ] CORS configuration documented (if API)

### Configuration
- [ ] Config loading mechanism documented
- [ ] Environment variables listed
- [ ] Default values noted
- [ ] Secret vs non-secret config distinguished
- [ ] Per-environment differences identified

## Testing Analysis

### Test Coverage
- [ ] Test framework identified
- [ ] Unit test locations mapped
- [ ] Integration test locations mapped
- [ ] E2E test locations mapped (if present)
- [ ] Test coverage estimated (HIGH / MEDIUM / LOW / NONE)
- [ ] Untested critical paths flagged

### Test Quality
- [ ] Tests actually pass (if runnable)
- [ ] Tests test behavior (not implementation)
- [ ] Edge cases covered in tests
- [ ] Error paths covered in tests
- [ ] Mock/stub patterns documented

## Non-Functional Requirements

### Performance
- [ ] Caching strategy documented
- [ ] Database query patterns assessed (N+1, full scans)
- [ ] Connection pooling identified
- [ ] Pagination implemented for large datasets
- [ ] Bulk operation support noted

### Scalability
- [ ] Stateless design verified (or state management documented)
- [ ] Database connection limits noted
- [ ] Horizontal scaling capability assessed
- [ ] Rate limiting implementation documented

### Reliability
- [ ] Health check endpoints present
- [ ] Graceful shutdown implemented
- [ ] Retry/backoff policies documented
- [ ] Timeout configurations noted
- [ ] Data backup strategy identified (if applicable)

## Post-Analysis

### Documentation Assembly
- [ ] Executive summary written
- [ ] All requirements numbered and in EARS format
- [ ] All requirements linked to code evidence
- [ ] Confidence levels assigned to all requirements
- [ ] Uncertainties section complete
- [ ] Recommendations prioritized

### Quality Check
- [ ] No requirements without code evidence
- [ ] No "probably" or "likely" without LOW confidence tag
- [ ] All API endpoints documented
- [ ] All database entities documented
- [ ] All external integrations documented
- [ ] Inferred acceptance criteria derived for major features

### Final Verification
- [ ] Specification reviewed for internal consistency
- [ ] Cross-references between sections verified
- [ ] Uncertainties are actionable (stakeholder can answer them)
- [ ] Recommendations are specific and prioritized
- [ ] Document saved as `specs/{project}_reverse_spec.md`

## Completeness Score

After analysis, count checked items and calculate:

```
Completeness = checked_items / total_applicable_items * 100

90-100%: Thorough analysis — high confidence in spec
70-89%:  Good analysis — some gaps to flag
50-69%:  Partial analysis — significant uncertainties
<50%:    Incomplete — more investigation needed
```

Note: Not all items apply to every project. Mark inapplicable items as N/A (they don't count against completeness).

## Quick Reference: What to Check by Project Type

### Web API (REST/GraphQL)
Priority: API endpoints, auth, data model, error handling, rate limiting

### CLI Tool
Priority: Command parsing, input validation, output format, exit codes, configuration

### Library/Package
Priority: Public API surface, type signatures, error handling, backward compatibility

### Full-Stack Web App
Priority: Routes, components, state management, API calls, auth flow, data model

### Microservices
Priority: Service boundaries, communication patterns, data ownership, failure handling

### Data Pipeline
Priority: Input sources, transformations, output destinations, error handling, idempotency
