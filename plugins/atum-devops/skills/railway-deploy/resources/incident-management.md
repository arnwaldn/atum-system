# Incident Management

## Incident Severity Levels

| Severity | Impact | Response Time | Who |
|----------|--------|--------------|-----|
| SEV1 (Critical) | Service down, revenue impact | < 15 min | On-call + incident commander |
| SEV2 (Major) | Degraded performance, partial outage | < 30 min | On-call team |
| SEV3 (Minor) | Limited impact, workaround exists | < 4 hours | Engineering team |
| SEV4 (Low) | Cosmetic, no user impact | Next business day | Backlog |

## Incident Lifecycle

```
Detection → Triage → Investigate → Mitigate → Resolve → Postmortem
```

### 1. Detection
- Automated alerting (preferred)
- Customer report
- Internal observation
- Synthetic monitoring

### 2. Triage
- Classify severity
- Assign incident commander (SEV1/SEV2)
- Open incident channel (Slack/Teams)
- Notify stakeholders

### 3. Investigation
- Check recent changes (deploys, config changes)
- Review metrics dashboards
- Check error logs
- Test hypotheses systematically

### 4. Mitigation
- Rollback recent changes
- Failover to healthy region
- Scale up resources
- Apply temporary fix

### 5. Resolution
- Verify metrics return to normal
- Confirm user impact resolved
- Document timeline
- Close incident

## Postmortem Template

```markdown
# Incident Postmortem: [TITLE]

**Date**: [YYYY-MM-DD]
**Severity**: SEV[1-4]
**Duration**: [start] to [end] ([total time])
**Author**: [Name]
**Reviewers**: [Names]

## Summary
[1-2 sentences: what happened, what was the impact]

## Impact
- **Users affected**: [number or percentage]
- **Revenue impact**: [estimated, if applicable]
- **Error budget consumed**: [X minutes of Y remaining]
- **SLO breach**: [Yes/No — which SLOs]

## Timeline (all times in UTC)
| Time | Event |
|------|-------|
| HH:MM | [First anomaly detected / alert fired] |
| HH:MM | [Incident declared, severity assigned] |
| HH:MM | [Investigation started — checked X] |
| HH:MM | [Root cause identified] |
| HH:MM | [Mitigation applied — rollback/fix] |
| HH:MM | [Metrics returned to normal] |
| HH:MM | [Incident resolved, all-clear] |

## Root Cause
[Technical explanation of what went wrong. Be specific but blame-free.]
[Include the chain of events that led to the incident.]

## Contributing Factors
1. [Factor that enabled or worsened the incident]
2. [Missing safeguard or monitoring gap]
3. [Process gap]

## Detection
- **How detected**: [Alert / Customer report / Manual observation]
- **Time to detect**: [Duration from start to first alert]
- **Detection gap**: [What could have detected it sooner]

## Response
- **What worked well**:
  - [Effective action 1]
  - [Effective action 2]
- **What didn't work well**:
  - [Ineffective action 1]
  - [Communication gap]
- **Where we got lucky**:
  - [Lucky circumstance that limited impact]

## Action Items
| # | Action | Type | Owner | Priority | Due Date | Status |
|---|--------|------|-------|----------|----------|--------|
| 1 | [Prevent recurrence] | Prevent | [Name] | P1 | [Date] | Open |
| 2 | [Improve detection] | Detect | [Name] | P2 | [Date] | Open |
| 3 | [Improve response] | Respond | [Name] | P2 | [Date] | Open |

## Lessons Learned
- [Key takeaway 1]
- [Key takeaway 2]
```

## Postmortem Best Practices

### Blameless Culture

| Do | Don't |
|----|-------|
| Focus on systems and processes | Blame individuals |
| Ask "what failed" not "who failed" | Assign fault or punishment |
| Assume everyone acted with best intentions | Question motives |
| Focus on prevention | Focus on accountability |

### Action Item Types

| Type | Purpose | Example |
|------|---------|---------|
| Prevent | Stop this from happening again | Add input validation |
| Detect | Find this faster next time | Add specific alert |
| Respond | Handle this better next time | Update runbook |
| Mitigate | Reduce blast radius | Add circuit breaker |

## On-Call Best Practices

| Practice | Detail |
|----------|--------|
| Rotation length | 1 week (shorter = too many handoffs, longer = burnout) |
| Handoff | Written handoff document with active issues |
| Escalation | Clear path: primary → secondary → manager |
| Follow-the-sun | Distribute across time zones if possible |
| Compensation | On-call pay or time off in lieu |
| Maximum pages/shift | Alert on >5 pages/day — fix alert quality |
| Shadow on-call | New team members shadow before going primary |

## MTTR Components

```
MTTR = Time to Detect + Time to Triage + Time to Resolve

Focus areas:
- Detect: Better monitoring, synthetic checks
- Triage: Runbooks, automated diagnostics
- Resolve: Rollback automation, feature flags
```
