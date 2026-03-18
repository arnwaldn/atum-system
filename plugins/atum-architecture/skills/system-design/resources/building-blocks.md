# System Design Building Blocks

## DNS and CDN

### DNS
- Translates domain names to IP addresses
- Round-robin for basic load distribution
- Weighted routing for gradual rollouts
- Geo-routing for latency optimization
- TTL controls cache duration

### CDN
- Edge caching for static assets (images, CSS, JS, video)
- Push CDN: content uploaded proactively (good for small, rarely updated content)
- Pull CDN: content fetched on first request (good for high-traffic sites)
- Key players: CloudFront, Cloudflare, Fastly, Akamai

## Load Balancing

| Type | Layer | Use Case |
|------|-------|----------|
| L4 (Transport) | TCP/UDP | Raw performance, simple routing |
| L7 (Application) | HTTP | Content-based routing, SSL termination, header inspection |

### Algorithms

| Algorithm | When to Use |
|-----------|-------------|
| Round Robin | Equal-capacity servers |
| Weighted Round Robin | Different server capacities |
| Least Connections | Long-lived connections (WebSocket) |
| IP Hash | Session affinity (sticky sessions) |
| Consistent Hashing | Distributed caches, minimize redistribution |

## Caching Strategies

| Strategy | Flow | Best For |
|----------|------|----------|
| Cache-aside | App checks cache → miss → read DB → populate cache | General purpose, read-heavy |
| Read-through | Cache auto-reads from DB on miss | Simplify app logic |
| Write-through | Write to cache + DB simultaneously | Strong consistency |
| Write-behind | Write to cache, async write to DB | Write-heavy, eventual consistency OK |
| Write-around | Write to DB only, cache on read | Write-heavy, infrequent reads |

### Cache Invalidation
- **TTL**: Simple, eventual consistency (seconds to minutes)
- **Event-driven**: Publish invalidation events on data change
- **Versioned keys**: `user:123:v5` — new version = new key
- **Cache stampede prevention**: Locking, probabilistic early expiration

## Message Queues

### When to Use
- Decouple producers from consumers
- Absorb traffic spikes (buffer)
- Enable async processing
- Guarantee delivery (at-least-once, exactly-once)
- Fan-out to multiple consumers

### Comparison

| System | Strength | Model |
|--------|----------|-------|
| Kafka | High throughput, log-based, replay | Pub/sub + consumer groups |
| RabbitMQ | Flexible routing, acknowledgements | Queue-based |
| SQS | Managed, no ops, FIFO option | Queue-based |
| Redis Streams | Low latency, in-memory | Stream-based |

## Database Design and Scaling

### Vertical vs Horizontal Scaling

| Approach | Pros | Cons |
|----------|------|------|
| Vertical (scale up) | Simple, no code changes | Hardware limits, single point of failure |
| Horizontal (scale out) | Theoretically unlimited | Complexity, data distribution, consistency |

### Replication Patterns

| Pattern | Use Case | Trade-off |
|---------|----------|-----------|
| Leader-Follower | Read-heavy workloads | Replication lag on reads |
| Multi-Leader | Multi-region writes | Conflict resolution needed |
| Leaderless | High availability | Quorum reads/writes, tunable consistency |

### Sharding Strategies

| Strategy | How | Pros | Cons |
|----------|-----|------|------|
| Hash-based | hash(key) % N | Even distribution | Resharding is expensive |
| Range-based | key ranges per shard | Range queries efficient | Hot spots possible |
| Directory-based | Lookup table | Flexible | Lookup table = bottleneck |
| Consistent hashing | Hash ring | Minimal redistribution | Uneven with few nodes (use virtual nodes) |

### SQL vs NoSQL Decision

| Choose SQL When | Choose NoSQL When |
|-----------------|-------------------|
| ACID transactions needed | Flexible/evolving schema |
| Complex joins | Write-heavy at scale |
| Structured, relational data | Document or key-value patterns |
| Strong consistency required | Eventual consistency acceptable |

## Consistent Hashing

- Maps both keys and servers onto a hash ring
- Keys assigned to the nearest server clockwise
- Adding/removing a server only affects neighboring keys
- Virtual nodes improve balance (each server gets multiple positions)
- Used by: Cassandra, DynamoDB, memcached, CDN routing
