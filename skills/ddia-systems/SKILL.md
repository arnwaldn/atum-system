---
name: ddia-systems
description: 'Design data systems by understanding storage engines, replication, partitioning, transactions, and consistency models. Use when the user mentions "database choice", "replication lag", "partitioning strategy", "consistency vs availability", or "stream processing". Covers data models, batch/stream processing, and distributed consensus.'
version: "1.0.0"
---

# Designing Data-Intensive Applications Framework

A principled approach to building reliable, scalable, and maintainable data systems.

## Core Principle

**Data outlives code.** Applications are rewritten, languages change, frameworks come and go -- but data persists for decades. Prioritize correctness, durability, and evolvability of the data layer.

## Scoring

**Goal: 10/10.** Rate data architectures 0-10 based on deliberate trade-off choices for data models, storage engines, replication, partitioning, transactions, and processing pipelines.

### 1. Data Models and Query Languages

- **Relational**: many-to-many, ad-hoc queries, ACID
- **Document**: one-to-many, data locality, flexible schema
- **Graph**: highly interconnected, recursive traversals
- Polyglot persistence -- different stores for different access patterns

### 2. Storage Engines

- **LSM trees**: append-only, excellent write throughput, higher read amplification
- **B-trees**: in-place updates, predictable read latency
- **Column-oriented**: analytical queries, compression, vectorized processing
- **In-memory**: fast from avoiding encoding overhead

### 3. Replication

- **Single-leader**: simple, strong consistency, leader is bottleneck
- **Multi-leader**: better write availability across DCs, complex conflicts
- **Leaderless**: highest availability, quorum reads/writes
- CRDTs and last-writer-wins have different correctness guarantees

### 4. Partitioning

- **Key-range**: efficient range scans, risk of hotspots
- **Hash**: even distribution, destroys sort order
- **Secondary indexes**: local (scatter-gather) vs global (cross-partition)

### 5. Transactions and Consistency

- Isolation levels: read uncommitted, read committed, snapshot, serializable
- Most DBs default to read committed or snapshot -- NOT serializable
- Write skew: two txns read same data, write different records
- SSI: serializable with optimistic concurrency
- Distributed 2PC: expensive and fragile; prefer sagas

### 6. Batch and Stream Processing

- MapReduce -> Spark/Flink dataflow engines
- Event sourcing: immutable event history as source of truth
- CDC: database writes as consumable stream
- Stream-table duality: stream = changelog; table = materialized state
- Exactly-once: requires idempotent ops or transactional output

### 7. Reliability and Fault Tolerance

- Fault (component) vs failure (system) -- prevent faults from becoming failures
- Hardware faults: random/independent; software faults: correlated
- Timeouts: fundamental fault detector in distributed systems
- Circuit breaker: open after threshold of failures

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| DB choice based on popularity | Match engine to read/write patterns |
| Ignoring replication lag | Read-your-writes consistency |
| Distributed txns everywhere | Single-partition + sagas |
| Hash partitioning everything | Key-range for time-series |
| Assuming serializable isolation | Check actual default |
| Conflating batch and stream | Match to data boundedness |

## Further Reading

- *"Designing Data-Intensive Applications"* by Martin Kleppmann
