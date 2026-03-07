# SLO/SLI Framework

## Defining SLIs (Service Level Indicators)

An SLI is a quantitative measure of some aspect of the service. Choose SLIs that reflect user experience.

### Categories

| Category | SLI Type | Measurement | Example |
|----------|----------|-------------|---------|
| Availability | Success rate | Successful requests / total requests | 99.95% of requests return non-5xx |
| Latency | Response time | % requests < threshold | 95% of requests < 200ms, 99% < 500ms |
| Throughput | Processing rate | Items processed per time unit | Process 10K events/second |
| Correctness | Data accuracy | Correct results / total results | 99.99% of calculations match |
| Freshness | Data recency | % data updated within threshold | 95% of data < 1 minute old |
| Durability | Data preservation | Data loss events / total writes | 99.999999% of writes durable |

### Good SLI Properties

| Property | Why |
|----------|-----|
| User-visible | Measures what users actually experience |
| Quantitative | A number, not "the service feels fast" |
| Specific threshold | p99 < 300ms, not just "low latency" |
| Measurable | Can be computed from existing data |

### Anti-Patterns

| Bad SLI | Why | Better SLI |
|---------|-----|-----------|
| "CPU < 80%" | Users don't care about CPU | "p99 latency < 300ms" |
| "No errors" | Unrealistic, not quantitative | "Error rate < 0.1%" |
| "System is up" | Vague | "99.9% of health checks pass" |

## Defining SLOs (Service Level Objectives)

An SLO is a target value for an SLI. It defines "good enough" for a service.

### SLO Selection Guidelines

| User Impact | SLO Target | Error Budget |
|------------|------------|-------------|
| Revenue-critical (checkout) | 99.99% | 4.38 min/month |
| User-facing (dashboard) | 99.9% | 43.8 min/month |
| Internal tools | 99.5% | 3.65 hours/month |
| Batch processing | 99% | 7.31 hours/month |

### Example SLO Document

```markdown
# SLO: Payment Processing Service

## SLI Definitions
- **Availability**: % of payment requests that return non-5xx within 30 seconds
- **Latency**: % of payment requests completing within 2 seconds

## SLO Targets (rolling 30-day window)
- Availability: 99.95% (error budget: 21.9 minutes/month)
- Latency (p50): 99% of requests < 500ms
- Latency (p99): 95% of requests < 2000ms

## Measurement
- Source: Load balancer access logs
- Window: 30-day rolling
- Calculation: Good events / Total events (excluding planned maintenance)

## Error Budget Policy
- > 50% remaining: Ship freely
- 25-50% remaining: Slow releases, prioritize reliability
- < 25% remaining: Feature freeze, fix reliability
- Exhausted: Full stop on features
```

## Error Budget Calculation

```
Error Budget = 1 - SLO Target

Example: 99.9% SLO
  Error budget = 0.1%
  Per month (30 days):  0.001 × 30 × 24 × 60 = 43.2 minutes
  Per year:             0.001 × 365 × 24 × 60 = 525.6 minutes (8.76 hours)
```

### Error Budget Table

| SLO | Monthly Budget | Yearly Budget | Allowed Incidents |
|-----|---------------|---------------|-------------------|
| 99% | 7.31 hours | 3.65 days | ~7 × 1-hour outages/year |
| 99.5% | 3.65 hours | 1.83 days | ~4 × 1-hour outages/year |
| 99.9% | 43.2 min | 8.76 hours | ~1 × 1-hour outage/month |
| 99.95% | 21.9 min | 4.38 hours | ~2 × 15-min outages/month |
| 99.99% | 4.38 min | 52.6 min | ~1 × 5-min outage/month |
| 99.999% | 26.3 sec | 5.26 min | Essentially zero tolerance |

## Error Budget Policy

### Graduated Response

| Budget Remaining | Dev Velocity | Reliability Investment | Release Gate |
|-----------------|-------------|----------------------|-------------|
| > 50% | Full speed | Standard practices | Normal review |
| 25-50% | Reduced | Prioritize reliability work | Extra review |
| 10-25% | Minimal | Reliability-only sprints | VP approval |
| < 10% | Frozen | All hands on reliability | Emergency only |
| Exhausted | Full stop | Post-freeze review | CTO approval |

### Budget Burn Rate

```
Burn rate = Error budget consumed / Time elapsed
Fast burn (>10x normal): Likely incident, trigger alert
Slow burn (2-5x normal): Degradation, investigate
Normal burn (<1x): Healthy
```

## Multi-Window Alerting

| Window | Burn Rate | Alert Type |
|--------|-----------|------------|
| 5 min | 14.4x | Page: likely major incident |
| 30 min | 6x | Page: confirmed incident |
| 6 hours | 1x | Ticket: slow burn investigation |
| 3 days | Negative | Info: budget recovering |

## SLO Review Cadence

| Frequency | Activity |
|-----------|----------|
| Daily | Check error budget dashboards |
| Weekly | Review burn rate trends |
| Monthly | SLO attainment report, adjust if needed |
| Quarterly | Full SLO review with stakeholders |
