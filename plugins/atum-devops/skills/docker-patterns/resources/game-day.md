# Game Day Planning

## What is a Game Day?

A structured exercise where teams deliberately inject failures into staging/dev systems to test resilience, practice incident response, and discover weaknesses before they become production incidents.

## Pre-Game Day (1 week before)

### Planning Checklist

| Task | Owner | Done |
|------|-------|------|
| Define 3-5 scenarios with hypotheses | Chaos lead | [ ] |
| Prepare failure injection scripts | Engineers | [ ] |
| Write runbooks for expected recovery | Engineers | [ ] |
| Brief all participants on roles | Chaos lead | [ ] |
| Verify staging environment matches production topology | DevOps | [ ] |
| Confirm monitoring and alerting is active | SRE | [ ] |
| Test kill switches for each experiment | Engineers | [ ] |
| Schedule 2-4 hour block (no meetings) | Chaos lead | [ ] |
| Prepare observation template | Chaos lead | [ ] |

### Roles

| Role | Responsibility |
|------|---------------|
| Chaos Lead | Runs the exercise, controls timing, calls stops |
| Operators | Execute failure injection scripts |
| Observers | Document what happens, take notes |
| Responders | Practice incident response (as in real incident) |
| Safety Officer | Monitors blast radius, triggers kill switch if needed |

### Scenario Template

```markdown
## Scenario: [Name]

**Hypothesis**: When [failure], the system [expected behavior] because [reason].

**Injection**: [Exact steps to inject failure]

**Expected recovery**: [What should happen automatically]

**Monitoring**: [Specific dashboards to watch]

**Success**: [Measurable criteria]

**Kill switch**: [How to immediately abort]

**Duration**: [Max time before forced rollback]
```

## Game Day Execution

### Agenda (4-hour block)

| Time | Activity |
|------|----------|
| 0:00-0:15 | Kickoff: review scenarios, confirm roles |
| 0:15-0:30 | Baseline: verify steady state, open dashboards |
| 0:30-1:30 | Scenario 1: inject → observe → discuss → rollback |
| 1:30-1:45 | Break + reset environment |
| 1:45-2:45 | Scenario 2: inject → observe → discuss → rollback |
| 2:45-3:00 | Break + reset environment |
| 3:00-3:30 | Scenario 3: inject → observe → discuss → rollback |
| 3:30-4:00 | Debrief: findings, surprises, action items |

### Execution Protocol (Per Scenario)

1. **Announce**: "Starting scenario [N]: [description]"
2. **Baseline**: Confirm all metrics are normal
3. **Inject**: Execute failure injection
4. **Observe**: Watch metrics, logs, alerts for [duration]
5. **Document**: Observers note everything that happens
6. **Discuss**: "What did we expect? What happened? Why?"
7. **Rollback**: Remove failure injection
8. **Verify**: Confirm system returned to steady state
9. **Score**: Did the hypothesis hold? What surprised us?

### Observation Template

```markdown
## Scenario [N] Observations

**Start time**: [HH:MM]
**End time**: [HH:MM]

### Expected Behavior
- [What we expected to happen]

### Actual Behavior
- [What actually happened]

### Metrics
- Latency: [before] → [during] → [after]
- Error rate: [before] → [during] → [after]
- Recovery time: [measured]

### Alerts
- [ ] Expected alerts fired: [list]
- [ ] Unexpected alerts: [list]
- [ ] Missing alerts: [list]

### Surprises
- [Unexpected behavior 1]
- [Unexpected behavior 2]

### Action Items (preliminary)
- [Action 1]
- [Action 2]
```

## Post-Game Day

### Findings Report

```markdown
# Game Day Report — [Date]

## Overview
- **Duration**: [total time]
- **Scenarios executed**: [N]
- **Participants**: [names/teams]

## Results Summary
| Scenario | Hypothesis | Result | Key Finding |
|----------|-----------|--------|-------------|
| 1. [Name] | [Brief] | Pass/Fail | [One-liner] |
| 2. [Name] | [Brief] | Pass/Fail | [One-liner] |
| 3. [Name] | [Brief] | Pass/Fail | [One-liner] |

## Detailed Findings
[Per-scenario analysis]

## Action Items
| # | Action | Owner | Priority | Due Date |
|---|--------|-------|----------|----------|
| 1 | [Action] | [Name] | P1 | [Date] |

## Next Game Day
- **Proposed date**: [Date]
- **Focus area**: [Area to explore]
- **New scenarios**: [Ideas from this session]
```

### Follow-Up

| Timing | Activity |
|--------|----------|
| Same day | Share findings report with team |
| 1 week | Create Jira/Linear tickets for action items |
| 2 weeks | Check action item progress |
| 1 month | Schedule next game day |
| Quarterly | Review game day program effectiveness |

## Game Day Maturity Levels

| Level | Characteristics |
|-------|----------------|
| 1: Ad-hoc | First game day, simple scenarios, manual injection |
| 2: Regular | Quarterly game days, documented scenarios, trained team |
| 3: Automated | CI/CD chaos tests, scenario library, metrics-driven |
| 4: Continuous | Always-on chaos in staging, self-healing verification |
