---
name: system-design
description: 'Design scalable distributed systems using structured approaches for load balancing, caching, database scaling, and message queues. Use when the user mentions "system design", "scale this", "high availability", "rate limiter", or "design a URL shortener". Covers common system designs and back-of-the-envelope estimation.'
version: "1.1.0"
---

# System Design Framework

A structured approach to designing large-scale distributed systems.

## Core Principle

**Start with requirements, not solutions.** Every system design begins by clarifying what you are building, for whom, and at what scale.

## Scoring

**Goal: 10/10.** Rate designs 0-10 based on: clear requirements, back-of-the-envelope estimates, appropriate building blocks, scaling/reliability addressed, tradeoffs acknowledged.

## The Four-Step Process

1. **Understand the problem** (~5-10 min): Clarifying questions, functional/non-functional requirements, agree on scale
2. **High-level design** (~15-20 min): Diagram with APIs, services, data stores, data flow
3. **Deep dive** (~15-20 min): 2-3 hardest/most critical components in detail
4. **Wrap up** (~5 min): Summarize tradeoffs, identify bottlenecks, suggest improvements

## Reference Guide

| Topic | Reference | Load When |
|-------|-----------|-----------|
| Estimation | `references/estimation.md` | Calculating QPS, storage, bandwidth, availability |
| Building Blocks | `references/building-blocks.md` | DNS, CDN, load balancers, caching, queues, database scaling |
| Common Designs | `references/common-designs.md` | URL shortener, rate limiter, news feed, chat, search, crawler |

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
