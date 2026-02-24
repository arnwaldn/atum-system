# Resilience Engineering

## Auto-Trigger

Apply these checks when code calls external APIs, databases, or third-party services.

## Checklist (before marking backend code complete)

- [ ] **Timeouts** — Every external call has an explicit timeout (no infinite waits)
- [ ] **Retry + backoff** — Transient failures retry with exponential backoff + jitter
- [ ] **Fallback chain** — Critical paths degrade gracefully (primary → secondary → cached → default)
- [ ] **Stale-on-error** — Cache last successful response; serve stale data on upstream failure
- [ ] **Circuit breaker** — Failing endpoints are short-circuited (cooldown before retry)
- [ ] **In-flight dedup** — Concurrent identical requests share a single upstream call
- [ ] **Negative caching** — Failed lookups are cached briefly to prevent retry storms
- [ ] **Rate-aware requests** — Rate-limited APIs use staggered sequential calls, not parallel
- [ ] **Backpressure** — Producers slow down when consumers can't keep up

## Pattern Reference

```
Request → Timeout guard → Circuit breaker check
  → Cache lookup (hit → return)
  → In-flight dedup check (pending → await existing)
  → Upstream call (with retry + backoff)
    → Success → Update cache → Return
    → Failure → Serve stale cache → Trip circuit breaker
```

## When NOT to apply

- Internal function calls (no network boundary)
- Local file reads (OS handles retries)
- Development/test environments (keep it simple)
- One-shot scripts (no long-running process)
