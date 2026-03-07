# Back-of-the-Envelope Estimation

## Powers of Two

| Power | Value | Approx | Common Use |
|-------|-------|--------|------------|
| 2^10 | 1,024 | 1 Thousand | 1 KB |
| 2^20 | 1,048,576 | 1 Million | 1 MB |
| 2^30 | 1,073,741,824 | 1 Billion | 1 GB |
| 2^40 | ~1.1 Trillion | 1 Trillion | 1 TB |

## Latency Numbers Every Engineer Should Know

| Operation | Latency | Notes |
|-----------|---------|-------|
| L1 cache reference | ~1 ns | |
| L2 cache reference | ~4 ns | |
| Main memory reference | ~100 ns | |
| SSD random read | ~100 us | 1000x memory |
| HDD random read | ~10 ms | 100x SSD |
| Send 1 KB over 1 Gbps | ~10 us | |
| Same-datacenter RTT | ~0.5 ms | |
| Cross-continent RTT | ~150 ms | |
| Disk seek | ~10 ms | |

## Availability Table

| Availability | Downtime/year | Downtime/month | Downtime/week |
|-------------|--------------|----------------|---------------|
| 99% (two 9s) | 3.65 days | 7.31 hours | 1.68 hours |
| 99.9% (three 9s) | 8.77 hours | 43.8 min | 10.1 min |
| 99.99% (four 9s) | 52.6 min | 4.38 min | 1.01 min |
| 99.999% (five 9s) | 5.26 min | 26.3 sec | 6.05 sec |

## QPS Estimation

```
Daily Active Users (DAU) x Actions per user per day
÷ 86,400 seconds/day
= Average QPS

Peak QPS = Average QPS x 2~5 (depending on traffic pattern)
```

### Example: Twitter-like Service

```
DAU: 300M
Tweets/day/user: 2
Read/write ratio: 100:1

Write QPS: 300M x 2 / 86400 = ~7,000 QPS
Peak write: 7,000 x 3 = ~21,000 QPS

Read QPS: 7,000 x 100 = 700,000 QPS
Peak read: 700,000 x 3 = 2,100,000 QPS
```

## Storage Estimation

```
Records per day x Average record size x Retention period = Total storage

Add 30% overhead for indexes, metadata, replication
```

### Example: Chat System

```
DAU: 50M
Messages/day/user: 40
Avg message size: 200 bytes

Daily storage: 50M x 40 x 200 = 400 GB/day
Yearly: 400 GB x 365 = 146 TB/year
With 3x replication: ~438 TB/year
```

## Bandwidth Estimation

```
Total data / Time period = Required bandwidth

Incoming: write QPS x avg request size
Outgoing: read QPS x avg response size
```

## Quick Reference Formulas

| What | Formula |
|------|---------|
| QPS | DAU x actions / 86400 |
| Peak QPS | avg QPS x 2~5 |
| Storage | records/day x size x retention |
| Bandwidth | QPS x avg_size |
| Servers needed | peak QPS / single_server_QPS |
| Cache size | working_set x avg_object_size |
