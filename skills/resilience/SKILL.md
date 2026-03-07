# Resilience Engineering

Checklist et patterns pour le code backend qui appelle des services externes (APIs, bases de donnees, services tiers).

## Declencheurs

- Code qui appelle des APIs externes, bases de donnees, ou services tiers
- "resilience", "circuit breaker", "retry", "timeout", "fallback"
- Backend work avec appels reseau

## Checklist (avant de marquer du code backend comme termine)

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
