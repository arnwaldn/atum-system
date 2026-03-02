---
name: system-design
description: 'Design scalable distributed systems using structured approaches for load balancing, caching, database scaling, and message queues. Use when the user mentions "system design", "scale this", "high availability", "rate limiter", or "design a URL shortener". Covers common system designs and back-of-the-envelope estimation.'
version: "1.0.0"
---

# System Design Framework

A structured approach to designing large-scale distributed systems.

## Core Principle

**Start with requirements, not solutions.** Every system design begins by clarifying what you are building, for whom, and at what scale.

## Scoring

**Goal: 10/10.** Rate designs 0-10 based on: clear requirements, back-of-the-envelope estimates, appropriate building blocks, scaling/reliability addressed, tradeoffs acknowledged.

### 1. The Four-Step Process

1. **Understand the problem** (~5-10 min): Clarifying questions, functional/non-functional requirements, agree on scale
2. **High-level design** (~15-20 min): Diagram with APIs, services, data stores, data flow
3. **Deep dive** (~15-20 min): 2-3 hardest/most critical components in detail
4. **Wrap up** (~5 min): Summarize tradeoffs, identify bottlenecks, suggest improvements

### 2. Back-of-the-Envelope Estimation

- Powers of two: 2^10 = 1K, 2^20 = 1M, 2^30 = 1B, 2^40 = 1T
- Latency: memory ~100ns, SSD ~100us, disk ~10ms, same-DC RTT ~0.5ms, cross-continent ~150ms
- Availability: 99.9% = 8.77h/year, 99.99% = 52.6min/year
- QPS: DAU x actions/day / 86400; peak = 2-5x average
- Storage: records/day x size x retention

### 3. Building Blocks

| Block | Purpose |
|-------|---------|
| DNS/CDN | Name resolution; edge caching |
| Load balancer | L4 (transport) vs L7 (application) |
| Cache | cache-aside, read-through, write-through, write-behind |
| Message queue | Decouple producers/consumers, absorb spikes |
| Consistent hashing | Minimal key redistribution on node changes |

### 4. Database Design and Scaling

- Vertical first, horizontal when limits reached
- Replication: leader-follower (read-heavy), multi-leader (multi-region)
- Sharding: hash-based (even), range-based (range queries), directory-based
- SQL for ACID/joins; NoSQL for flexibility/scale/write throughput

### 5. Common System Designs

| System | Key Patterns |
|--------|-------------|
| URL shortener | base62 encoding, key-value store, 301 vs 302 |
| Rate limiter | token bucket or sliding window, 429 + Retry-After |
| News feed | fanout-on-write vs fanout-on-read; hybrid for celebrities |
| Chat system | WebSocket, message queue, presence via heartbeat |
| Search autocomplete | trie, top-k frequent, cache popular prefixes |
| Web crawler | BFS, URL frontier, politeness, content hash dedup |
| Unique ID | UUID (simple) vs Snowflake (time-sortable, 64-bit) |

### 6. Reliability and Operations

| Concern | Pattern |
|---------|---------|
| Health checks | Liveness + readiness probes |
| Monitoring | Metrics + logging + tracing (3 pillars) |
| Deployment | Rolling, blue-green, canary |
| DR | RPO (data loss) + RTO (recovery time) |
| Multi-DC | Active-passive or active-active |
| Autoscaling | CPU, memory, queue depth, custom metrics |

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Jump to architecture without requirements | Spend 5-10 min on scope first |
| No estimation | Calculate QPS, storage, bandwidth |
| Single point of failure | Redundancy at every layer |
| Premature sharding | Scale vertically, cache, replicate first |
| Cache without invalidation | Define TTL + explicit invalidation |
| Sync calls everywhere | Queues for non-latency-critical paths |
| No monitoring | Instrument from day one |

## Further Reading

- *"System Design Interview"* (Vol 1 and 2) by Alex Xu
- *"Designing Data-Intensive Applications"* by Martin Kleppmann
