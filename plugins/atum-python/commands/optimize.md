# Performance Optimization

Analyze and optimize project performance across multiple dimensions.

## Arguments

$ARGUMENTS — The optimization target (e.g., "bundle", "api", "cache", "db", "memory", "all")

## Instructions

### 1. Detect Project Type
- Frontend (React, Vue, Angular, Next.js, etc.)
- Backend (Node, Python, Go, Rust, Java, etc.)
- Fullstack (both)

### 2. Run Analysis Based on Target

#### `bundle` — Frontend Bundle Optimization
- Analyze bundle size: `npx vite-bundle-visualizer` or `npx @next/bundle-analyzer`
- Identify large dependencies and suggest alternatives
- Check for tree-shaking issues
- Verify code splitting and lazy loading
- Check image optimization (next/image, sharp, AVIF/WebP)
- Review CSS (unused styles, Tailwind purge)

#### `api` — API Performance
- Identify N+1 query patterns in ORM usage
- Check for missing pagination
- Review serialization overhead
- Identify cacheable endpoints
- Check response payload sizes
- Review database query complexity

#### `cache` — Caching Strategy
- Identify cacheable data (static, semi-static, dynamic)
- Recommend caching layers (CDN, Redis, in-memory, HTTP cache)
- Review cache invalidation strategy
- Check Cache-Control headers
- Identify stale-while-revalidate opportunities

#### `db` — Database Performance
- Analyze slow queries (if query logs available)
- Check missing indexes on foreign keys and WHERE columns
- Review N+1 patterns
- Check connection pooling configuration
- Review query complexity and suggest optimizations

#### `memory` — Memory Usage
- Check for memory leaks patterns (event listeners, closures)
- Review large object allocations
- Check streaming vs buffering for large data
- Review garbage collection hints

#### `all` — Full Performance Audit
Run all above analyses and produce a prioritized report.

### 3. Report Format
```
## Performance Report — [project name]

### Critical Issues (fix now)
1. [Issue + specific fix + estimated impact]

### High Priority (next sprint)
1. [Issue + fix + impact]

### Recommendations (backlog)
1. [Suggestion + trade-offs]

### Metrics
| Metric | Current | Target | Status |
|--------|---------|--------|--------|
```
