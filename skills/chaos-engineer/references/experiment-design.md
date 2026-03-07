# Chaos Experiment Design

## Experiment Template

```markdown
# Chaos Experiment: [Title]

## Environment: STAGING / DEV (never production)

## Hypothesis
We believe that [system component] can tolerate [failure type]
without [user-visible impact] because [reason].

## Steady State
Define the metrics that represent "normal" before injecting chaos:
- Metric 1: [name] = [baseline value ± tolerance]
- Metric 2: [name] = [baseline value ± tolerance]

## Method
1. Verify steady state (baseline measurements)
2. Inject failure: [specific failure details]
3. Observe metrics for [duration]
4. Verify recovery within [time limit]
5. Rollback injection

## Blast Radius Controls
- **Scope**: [specific service/pod/container/percentage]
- **Duration**: [max time before auto-rollback]
- **Kill switch**: [how to abort immediately]
- **Monitoring**: [dashboards and alerts to watch]
- **Who's watching**: [team members on standby]

## Rollback Plan
1. [Immediate rollback step — should be < 30 seconds]
2. [Verification step — confirm rollback worked]
3. [Escalation — if rollback fails, who to call]

## Success Criteria
- [ ] Steady state maintained within [threshold]
- [ ] Recovery time < [target]
- [ ] No cascading failures observed
- [ ] No data loss or corruption
- [ ] Alerts fired correctly

## Results
- **Outcome**: [passed / failed / partial]
- **Observations**: [what actually happened]
- **Surprises**: [unexpected behaviors]
- **Action Items**: [improvements to make]
```

## Failure Injection Types

### Network Failures

| Failure | What | Tools | Hypothesis Example |
|---------|------|-------|-------------------|
| Latency injection | Add 100-500ms delay | toxiproxy, tc, Pumba | "Service handles 200ms upstream latency without timeout" |
| Packet loss | Drop 5-20% of packets | tc, Pumba | "Retries handle 10% packet loss transparently" |
| DNS failure | Block DNS resolution | iptables, toxiproxy | "Service uses cached DNS and degrades gracefully" |
| Network partition | Block traffic between services | iptables, Chaos Mesh | "Service A operates independently when Service B is unreachable" |
| Bandwidth throttle | Limit bandwidth | tc, toxiproxy | "Service handles 1Mbps bandwidth without errors" |

### Infrastructure Failures

| Failure | What | Tools | Hypothesis Example |
|---------|------|-------|-------------------|
| Server crash | Kill process/VM | kill -9, Chaos Monkey | "Load balancer routes around dead server in <10s" |
| Disk full | Fill disk to 100% | dd, fallocate | "Service logs error and stops writing, no crash" |
| CPU spike | Max out CPU | stress-ng | "Service still responds under 5s with CPU at 100%" |
| Memory exhaustion | Consume all memory | stress-ng | "OOM killer targets the right process, service restarts" |
| Clock skew | Shift system clock | date, chrony | "Service handles 5-minute clock drift without data corruption" |

### Application Failures

| Failure | What | Tools | Hypothesis Example |
|---------|------|-------|-------------------|
| Exception injection | Force exceptions in handlers | Custom middleware, feature flags | "Service returns 500 but doesn't crash" |
| Slow responses | Add artificial delay to endpoints | Custom middleware, toxiproxy | "Caller times out and uses fallback" |
| Dependency failure | Block calls to downstream service | Feature flag, toxiproxy | "Circuit breaker opens, fallback used" |
| Configuration error | Inject bad config value | Config management | "Service detects invalid config, uses defaults" |
| Resource leak | Gradually consume connections/memory | Custom script | "Service detects leak and restarts cleanly" |

### Kubernetes-Specific

| Failure | What | Tools | Hypothesis Example |
|---------|------|-------|-------------------|
| Pod kill | Delete running pods | kubectl, Litmus, Chaos Mesh | "Kubernetes restarts pod, <30s recovery" |
| Node drain | Evict all pods from a node | kubectl drain | "Pods reschedule to other nodes, no downtime" |
| Resource limits | Reduce CPU/memory limits | kubectl patch | "Service throttled but remains functional" |
| Container crash | Kill container process | docker kill, kubectl exec | "Init container handles cleanup, restart succeeds" |

### Database Failures

| Failure | What | Tools | Hypothesis Example |
|---------|------|-------|-------------------|
| Connection pool exhaustion | Max out connections | Custom script, toxiproxy | "New requests queue, no connection leak" |
| Slow queries | Add latency to DB responses | toxiproxy, pg_sleep | "Read replica timeout triggers cache fallback" |
| Replication lag | Delay replica sync | Network throttle | "Service tolerates 5s replication lag" |
| Failover | Kill primary database | Kill process | "Automatic failover completes in <60s" |

## Experiment Progression

Start simple, increase complexity:

```
Level 1: Kill a single non-critical pod
Level 2: Kill a critical service pod
Level 3: Network latency injection (50ms → 200ms → 500ms)
Level 4: Dependency failure (one service unavailable)
Level 5: Multi-failure (service down + high latency)
Level 6: Zone/region failure simulation
```

## Safety Checklist (Before Every Experiment)

- [ ] Environment confirmed as staging/dev (NOT production)
- [ ] Steady state metrics baseline recorded
- [ ] Kill switch tested and working
- [ ] Rollback procedure documented and tested
- [ ] Team notified and standing by
- [ ] Monitoring dashboards open
- [ ] Maximum duration timer set
- [ ] Previous experiment results reviewed
