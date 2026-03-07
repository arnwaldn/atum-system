# Common System Designs

## URL Shortener

**Key decisions**: base62 encoding, key-value store, 301 (permanent) vs 302 (temporary) redirect

| Component | Design |
|-----------|--------|
| Short URL generation | Counter-based (base62) or random + collision check |
| Storage | KV store (Redis, DynamoDB) — key: shortCode, value: longURL |
| Redirect | 301 for SEO, 302 for analytics tracking |
| Analytics | Async event to analytics pipeline on each redirect |
| Scale | ~100M URLs/year = ~3KB x 100M = 300GB; cache top 20% |

## Rate Limiter

**Key decisions**: token bucket or sliding window, 429 + Retry-After header

| Algorithm | How it Works | Pros | Cons |
|-----------|-------------|------|------|
| Token bucket | Fixed-rate token refill, each request costs 1 token | Allows bursts, memory efficient | Parameter tuning |
| Leaking bucket | FIFO queue, process at fixed rate | Smooth output rate | Slow for bursts |
| Fixed window | Counter per time window | Simple | Burst at window edges |
| Sliding window log | Timestamp log per request | Accurate | Memory heavy |
| Sliding window counter | Weighted between windows | Good balance | Approximate |

## News Feed / Timeline

**Key decisions**: fanout-on-write vs fanout-on-read

| Approach | How | Pros | Cons |
|----------|-----|------|------|
| Fanout-on-write (push) | Pre-compute feed on post | Fast reads | Slow writes for celebrities, wasted for inactive users |
| Fanout-on-read (pull) | Compute feed at read time | Simple, no waste | Slow reads |
| Hybrid | Push for normal users, pull for celebrities | Best of both | Complex |

## Chat System

| Component | Technology |
|-----------|-----------|
| Real-time delivery | WebSocket (bidirectional, persistent) |
| Message storage | Time-series DB or wide-column (Cassandra) |
| Presence | Heartbeat every N seconds, pub/sub for status |
| Group chat | Fan-out to group members, message queue per group |
| Push notifications | APNs (iOS), FCM (Android) for offline users |
| Media | Object storage (S3) + CDN |

## Search Autocomplete

| Component | Design |
|-----------|--------|
| Data structure | Trie (prefix tree) with top-k at each node |
| Updates | Offline batch rebuild (not real-time) |
| Caching | Cache popular prefixes (top 1000) |
| Ranking | Frequency-weighted, personalization layer |
| Scale | Shard by first 2 characters |

## Web Crawler

| Concern | Solution |
|---------|----------|
| Traversal | BFS with URL frontier (priority queue) |
| Politeness | Per-domain rate limiting, respect robots.txt |
| Deduplication | Content hash (SimHash for near-duplicates) |
| URL normalization | Lowercase, remove trailing slash, resolve relative |
| Freshness | Re-crawl based on change frequency |
| Scale | Distributed workers, partitioned URL frontier |

## Unique ID Generator

| Approach | Format | Pros | Cons |
|----------|--------|------|------|
| UUID | 128-bit random | Simple, no coordination | Not sortable, large |
| Snowflake | 64-bit: timestamp + worker + sequence | Time-sortable, compact | Clock sync needed |
| Database auto-increment | Sequential integer | Simple | Single point, not distributed |
| Ticket server | Centralized ID dispenser | Predictable | SPOF unless replicated |

## Reliability and Operations

| Concern | Pattern | Details |
|---------|---------|---------|
| Health checks | Liveness + readiness probes | Liveness: is process alive? Readiness: can it serve traffic? |
| Monitoring | 3 pillars | Metrics (counters, gauges), Logs (structured), Traces (distributed) |
| Deployment | Rolling / Blue-Green / Canary | Rolling: gradual; Blue-Green: instant switch; Canary: small % first |
| DR | RPO + RTO | RPO: max data loss; RTO: max recovery time |
| Multi-DC | Active-passive / Active-active | Passive: failover; Active: both serve (consistency challenges) |
| Autoscaling | Metric-based | CPU, memory, queue depth, custom metrics; cooldown periods |
