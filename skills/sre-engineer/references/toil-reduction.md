# Toil Measurement and Reduction

## What is Toil?

Toil is work tied to running a production service that is manual, repetitive, automatable, tactical, devoid of lasting value, and scales linearly with service growth.

## The 6 Criteria

| Criterion | Question | Example of Toil | Example of NOT Toil |
|-----------|----------|-----------------|---------------------|
| Manual | Does a human have to do it? | Manually restarting pods | Auto-healing with liveness probes |
| Repetitive | Done more than once? | Resizing disk every month | One-time capacity planning |
| Automatable | Could a script do it? | Copy-pasting config changes | Creative architecture design |
| Tactical | Interrupt-driven, reactive? | Responding to "disk full" alerts | Proactive capacity planning |
| No lasting value | System returns to prior state? | Clearing log files | Building log rotation |
| Scales with service | More service = more work? | Adding users to permissions manually | Self-service IAM |

## Measuring Toil

### Toil Budget

**Target: Toil < 50% of SRE team time.** If toil exceeds 50%, it crowds out engineering work (automation, reliability improvements, new features).

### Tracking Method

```markdown
# Toil Inventory — Q1 2026

| Task | Frequency | Time per Occurrence | Monthly Total | Automatable? | Priority |
|------|-----------|--------------------:|-------------:|:------------:|----------|
| Manual deploys | 20/month | 15 min | 5 hours | Yes | P1 |
| Certificate renewal | 4/month | 30 min | 2 hours | Yes | P1 |
| User access provisioning | 30/month | 10 min | 5 hours | Yes | P2 |
| Database cleanup | 2/month | 1 hour | 2 hours | Yes | P2 |
| On-call alert triage | 50/month | 5 min | 4.2 hours | Partial | P1 |
| **Total** | | | **18.2 hours** | | |
| **% of team capacity** | | | **~11%** | | |
```

### Toil Ratio Formula

```
Toil ratio = Time spent on toil / Total engineering time
Target: < 50%
Healthy: < 30%
Excellent: < 15%
```

## Automation Prioritization

### Decision Matrix

| Factor | Weight | Score 1-5 |
|--------|--------|-----------|
| Frequency (how often) | High | Daily=5, Weekly=4, Monthly=3, Quarterly=2, Yearly=1 |
| Time per occurrence | High | >1h=5, 30min=4, 15min=3, 5min=2, <1min=1 |
| Error-prone (human mistakes) | Medium | Very=5, Somewhat=3, Rarely=1 |
| Affects reliability | Medium | Critical=5, Moderate=3, Low=1 |
| Automation complexity | Inverse | Simple=5, Moderate=3, Complex=1 |

**Priority score** = Sum of weighted scores. Automate highest scores first.

### Quick Wins (automate immediately)

| Pattern | Automation |
|---------|-----------|
| "Run this script when X happens" | Cron job or event trigger |
| "Copy this config to N servers" | Configuration management (Ansible, Terraform) |
| "Restart service when it crashes" | Process supervisor, Kubernetes liveness probes |
| "Scale up during peak hours" | Autoscaling policies |
| "Rotate credentials every N days" | Secrets manager with auto-rotation |

### Medium Effort

| Pattern | Automation |
|---------|-----------|
| "Triage alerts and decide action" | Decision tree in runbook → automated remediation |
| "Provision access for new team member" | Self-service IAM with approval workflow |
| "Deploy new version" | CI/CD pipeline with canary/rollback |
| "Investigate performance degradation" | Automated diagnostics dashboard |

### High Effort (but high value)

| Pattern | Automation |
|---------|-----------|
| "Capacity planning" | Predictive scaling models |
| "Database migration" | Automated migration pipeline with dry-run |
| "Incident response" | Automated runbooks (PagerDuty/Opsgenie) |

## Tracking Toil Reduction Over Time

```
Month 1: Baseline measurement (18.2 hours/month)
Month 2: Automate top 2 tasks (-7 hours)
Month 3: Automate next 2 tasks (-4 hours)
Month 4: Review new toil, update inventory

Goal: Reduce toil by 50% within 6 months
```

## Anti-Patterns

| Anti-Pattern | Why it's Bad | Fix |
|-------------|-------------|-----|
| "We'll automate it later" | Later never comes | Budget automation time each sprint |
| Automating rare tasks first | Low ROI | Prioritize frequency × time |
| Over-engineering automation | Automation becomes its own toil | Keep it simple, iterate |
| Not measuring toil | Can't improve what you don't measure | Start with a simple spreadsheet |
| Heroics culture | Rewards firefighting over prevention | Celebrate automation, not heroism |
