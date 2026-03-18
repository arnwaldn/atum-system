# Pre-Mortem Analysis — Find the Failure Modes

## Overview

A pre-mortem imagines the project has already failed and works backward to identify what went wrong. Unlike risk assessment (which asks "what could go wrong?"), pre-mortem assumes failure has already happened (which bypasses optimism bias) and asks "what DID go wrong?"

## The Method

```
1. Steelman the plan (present it as strong and well-considered)
2. Announce failure ("It is 6 months from now. This project has failed.")
3. Generate failure narratives (each person writes independently)
4. Rank by likelihood and impact
5. Identify early warning signs for each failure
6. Design mitigations (prevent, detect, or reduce impact)
7. Apply the inversion check
```

## Step 1: Frame the Failure

### Failure Framing Template

```markdown
## Pre-Mortem: {Project/Decision Name}

### The Plan (Steelmanned)
{Clear description of what we're planning to do and why}

### Failure Scenario
It is {timeframe} from now. The project has failed.
{Define what "failure" means for this specific project:}
- Did not ship on time
- Shipped but users didn't adopt
- Shipped but caused incidents
- Shipped but was too expensive to maintain
- Was abandoned mid-development
```

## Step 2: Generate Failure Narratives

For each failure mode, write a specific, plausible story.

### Narrative Structure

```markdown
### Failure Mode {N}: {Title}

**The story**: {Write a 2-3 sentence narrative of how this failure
unfolded. Be specific — name the component, the timeline, the
cascade of events.}

**Root cause**: {The underlying reason this happened}

**Contributing factors**:
1. {Factor that enabled the failure}
2. {Factor that made it worse}
3. {Factor that prevented detection}

**Impact**: {What was the consequence — lost time, money, users, trust?}

**Likelihood**: {HIGH / MEDIUM / LOW}
**Impact severity**: {CRITICAL / HIGH / MEDIUM / LOW}
**Priority**: Likelihood x Severity = {score}
```

### Common Failure Categories

#### Technical Failures

| Category | Example Narrative |
|----------|------------------|
| Scaling failure | "At 10x traffic during the product launch, the database connection pool was exhausted. The autoscaler added more app servers, each opening more connections, making it worse. The cascade took the system down for 3 hours." |
| Integration failure | "The payment provider changed their API response format without notice. Our parser failed silently, creating orders marked as paid that weren't. We discovered it 2 days later when reconciliation ran." |
| Data migration failure | "The schema migration ran for 6 hours instead of the expected 20 minutes. The database was locked for writes the entire time. We couldn't roll back because the migration was partially applied." |
| Security breach | "An exposed admin endpoint without authentication was found by a scanner. An attacker accessed the user database and exfiltrated 50K email addresses before we detected it." |

#### Process Failures

| Category | Example Narrative |
|----------|------------------|
| Scope creep | "What started as a 2-week feature grew to 8 weeks as stakeholders kept adding requirements. By the time we shipped, the original deadline had passed and the competitor had launched." |
| Key person dependency | "The only engineer who understood the payment system went on leave. When a critical bug appeared, no one could debug it. It took 4 days to find a workaround." |
| Communication failure | "The frontend and backend teams had different assumptions about the API contract. This wasn't discovered until integration testing, requiring 2 weeks of rework." |
| Testing gap | "The feature passed all unit tests but failed in production because the tests mocked the very service that was the source of the bug." |

#### Business/Market Failures

| Category | Example Narrative |
|----------|------------------|
| Wrong problem | "We built the feature users said they wanted, but usage was <5%. Turns out they described their workaround as the solution, not the actual problem." |
| Timing | "We shipped 1 month after the competitor. By then, users had already migrated and switching costs were too high." |
| Cost overrun | "The ML feature worked in development but cost $50K/month in production inference. The revenue from the feature was $8K/month." |

## Step 3: Rank Failures

### Priority Matrix

```
                    CRITICAL IMPACT
                         │
          ┌──────────────┼──────────────┐
          │   MITIGATE   │  PREVENT     │
          │   (Plan B)   │  (Must fix)  │
 HIGH     │              │              │
 LIKELIHOOD├──────────────┼──────────────┤
          │   ACCEPT     │  MONITOR     │
          │   (Note risk)│  (Watch for) │
 LOW      │              │              │
 LIKELIHOOD└──────────────┼──────────────┘
                         │
                    LOW IMPACT
```

Quadrant actions:
- **PREVENT** (high likelihood + critical impact): Redesign to eliminate this failure mode
- **MITIGATE** (high likelihood + lower impact): Reduce impact with fallbacks and Plan B
- **MONITOR** (low likelihood + critical impact): Add early warning signs and response plans
- **ACCEPT** (low likelihood + low impact): Document and move on

## Step 4: Early Warning Signs

For each high-priority failure, identify signals that it's starting to happen:

```markdown
### Early Warning Signs: {Failure Mode Title}

| Signal | Where to Look | Threshold | Action |
|--------|--------------|-----------|--------|
| {metric or observation} | {dashboard, log, meeting} | {when to worry} | {what to do} |
```

### Examples

| Failure Mode | Early Warning | Where | Threshold |
|-------------|--------------|-------|-----------|
| Scaling failure | p99 latency creeping up | APM dashboard | >2x baseline |
| Scope creep | Story points increasing each sprint | Sprint retro | >30% growth |
| Key person risk | Only 1 reviewer on critical PRs | GitHub stats | 1 person >80% reviews |
| Integration failure | Error rate on external calls | Monitoring | >1% error rate |
| Cost overrun | Cloud bill growth rate | Billing dashboard | >20% month-over-month |

## Step 5: Mitigations

### Mitigation Types

| Type | Description | Example |
|------|------------|---------|
| **Prevent** | Eliminate the failure mode entirely | "Add API contract tests that run on every build" |
| **Detect** | Find the problem before users do | "Add alerting on payment reconciliation mismatches" |
| **Contain** | Limit the blast radius | "Feature flag the new code path; instant rollback" |
| **Recover** | Minimize time to restore service | "Automated database rollback script tested monthly" |

### Mitigation Plan Template

```markdown
### Mitigation: {Failure Mode Title}

| Type | Action | Owner | Cost | Deadline |
|------|--------|-------|------|----------|
| Prevent | {action} | {who} | {effort} | {when} |
| Detect | {action} | {who} | {effort} | {when} |
| Contain | {action} | {who} | {effort} | {when} |
| Recover | {action} | {who} | {effort} | {when} |
```

## Step 6: The Inversion Check

After listing mitigations, apply inversion: "What would we do to GUARANTEE this project fails?"

```
To guarantee failure, we would:
1. {Deliberately harmful action — e.g., "Skip all testing"}
2. {Another — e.g., "Have no monitoring in production"}
3. {Another — e.g., "Never talk to actual users"}
4. {Another — e.g., "Let scope grow without pushback"}
5. {Another — e.g., "Deploy on Friday afternoon"}
```

Now check: Are we accidentally doing any of these? This surfaces risks that narrative-based thinking missed.

## Full Deliverable Template

```markdown
## Pre-Mortem Report: {Project Name}

### Plan Summary
{What we're building and why — steelmanned}

### Failure Definition
{What "failure" means for this project}

### Failure Modes (Ranked)

#### 1. {Title} — Priority: PREVENT
{Narrative + root cause + contributing factors}
- **Likelihood**: HIGH | **Impact**: CRITICAL
- **Early warnings**: {signals}
- **Mitigations**: {prevent / detect / contain / recover}

#### 2. {Title} — Priority: MITIGATE
{...}

#### 3. {Title} — Priority: MONITOR
{...}

### Inversion Check
To guarantee failure: {list}
Currently doing: {any matches}

### Action Items
| # | Action | Type | Owner | Priority | Due |
|---|--------|------|-------|----------|-----|
| 1 | {action} | Prevent | {who} | P1 | {date} |

### Second-Order Effects
{Things that might go wrong as a result of our mitigations}
```

## Anti-Patterns

| Anti-Pattern | Why It Fails | Correct Approach |
|-------------|-------------|------------------|
| Only technical failures | Misses process and business risks | Cover all three categories |
| Vague narratives | "Something might go wrong" is not useful | Be specific: component, timeline, cascade |
| No action items | Pre-mortem without mitigations is just worrying | Every high-priority failure needs a mitigation |
| Single person brainstorm | Limited perspective | Each team member writes independently first |
| Only catastrophic scenarios | Misses likely smaller failures | Include "death by a thousand cuts" scenarios |
| Mitigations worse than the risk | Over-engineering prevention | Compare mitigation cost to expected impact |
