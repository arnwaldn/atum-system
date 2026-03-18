# Evidence Audit — Test the Evidence

## Overview

Falsificationism tests whether the evidence actually supports the conclusion. Instead of looking for confirmation, this mode systematically identifies what evidence would DISPROVE the claim, grades the quality of existing evidence, and surfaces competing explanations. Based on Karl Popper's principle: a claim is only scientific if it can be falsified.

## The Method

```
1. Extract claims (break the thesis into individual testable claims)
2. For each claim, define falsification criteria (what would disprove it?)
3. Grade existing evidence (how strong is the support?)
4. Identify competing explanations (what else could explain the data?)
5. Rate overall confidence
6. Recommend experiments to strengthen or refute
```

## Step 1: Claim Extraction

Break the thesis into atomic, testable claims:

### Example

```
Thesis: "We should migrate to a microservices architecture to improve
deployment speed and team autonomy."

Extracted claims:
C1: Our current deployment speed is a bottleneck
C2: The bottleneck is caused by monolithic coupling
C3: Microservices would reduce deployment coupling
C4: Reduced coupling would improve deployment speed
C5: Team autonomy would increase with microservices
C6: The migration cost is justified by the improvement
C7: Our team can operate a distributed system effectively
```

### Claim Classification

| Type | Description | Example |
|------|------------|---------|
| Factual | Verifiable with data | "Deploys take 45 minutes on average" |
| Causal | X causes Y | "Monolithic coupling causes slow deploys" |
| Predictive | Future outcome | "Microservices will reduce deploy time to 5 minutes" |
| Comparative | X is better than Y | "Microservices are better than modular monolith for us" |
| Value | Subjective judgment | "The trade-off is worth it" |

## Step 2: Falsification Criteria

For each claim, define what would disprove it:

### Template

```markdown
### Claim: {claim text}

**Type**: {Factual / Causal / Predictive / Comparative / Value}

**Falsification criteria**: This claim is FALSE if:
- {Observable condition that would disprove it}
- {Another observable condition}

**Required evidence**: To believe this claim, I would need:
- {Specific data or observation}
- {Another data point}
```

### Examples

| Claim | Falsified If | Required Evidence |
|-------|-------------|-------------------|
| "Deploys take 45 min on average" | Deployment logs show median < 15 min | Last 30 days of deploy timestamps |
| "Coupling causes slow deploys" | Teams that changed only their module still had slow deploys | Deploy time by module-change scope |
| "Microservices will speed deploys" | Teams with microservices report same or worse deploy times | Case studies, industry benchmarks |
| "Team can operate distributed systems" | Team has no experience with service mesh, observability, distributed debugging | Team skills inventory |

## Step 3: Evidence Grading

### Evidence Quality Scale

| Grade | Name | Definition | Example |
|-------|------|-----------|---------|
| A | Direct measurement | Quantitative data from the actual system | "Deploy logs show p50=42min, p99=67min" |
| B | Relevant proxy | Data from a similar context | "Company X with similar stack saw 5x improvement" |
| C | Expert opinion | Informed but not data-backed | "Our senior engineer believes this will work" |
| D | Anecdotal | Individual stories, uncontrolled | "I read a blog post that said it worked" |
| E | Assumption | No evidence, taken on faith | "It's industry best practice" |
| F | Contradicted | Evidence exists AGAINST the claim | "Our last microservices attempt failed" |

### Grading Template

```markdown
### Evidence Audit: {Claim}

| # | Evidence | Grade | Source | Notes |
|---|---------|-------|--------|-------|
| E1 | {evidence} | {A-F} | {source} | {caveats} |
| E2 | {evidence} | {A-F} | {source} | {caveats} |

**Overall evidence grade**: {Weighted assessment}
**Key gap**: {What evidence is missing}
```

### Common Evidence Pitfalls

| Pitfall | Detection Pattern | Example |
|---------|------------------|---------|
| Survivorship bias | Only success stories cited | "Netflix uses microservices successfully" (ignoring thousands that don't) |
| Confirmation bias | Only supporting evidence gathered | Searching for "microservices benefits" but not "microservices failures" |
| Authority bias | "Expert says so" without reasoning | "The CTO recommends it" without data |
| Recency bias | Latest trend = best approach | "Everyone is doing it now" |
| Availability bias | Most memorable = most likely | "That one outage was terrible" (but was a 1-in-5-year event) |
| Base rate neglect | Ignoring how common the outcome is | "This succeeds 90% of the time" (but so does doing nothing) |

## Step 4: Competing Explanations

For every causal claim, identify alternative explanations:

### Template

```markdown
### Competing Explanations: {Claim}

**Claimed cause**: {X causes Y}

| # | Alternative Explanation | Plausibility | Evidence |
|---|----------------------|-------------|----------|
| ALT1 | {different cause for same effect} | {HIGH/MED/LOW} | {supporting data} |
| ALT2 | {another cause} | {HIGH/MED/LOW} | {supporting data} |
| ALT3 | {correlation, not causation} | {HIGH/MED/LOW} | {supporting data} |

**Diagnostic test**: To distinguish between these explanations:
- {Experiment or observation that would differentiate}
```

### Example

```markdown
### Competing Explanations: "Monolithic coupling causes slow deploys"

**Claimed cause**: Code coupling in the monolith forces full deployment

| # | Alternative Explanation | Plausibility | Evidence |
|---|----------------------|-------------|----------|
| ALT1 | Slow CI pipeline (bad test suite) | HIGH | CI logs show 30 min in tests alone |
| ALT2 | Manual approval bottleneck | MEDIUM | 3 people must approve every deploy |
| ALT3 | Deployment infrastructure is old | MEDIUM | Using Capistrano from 2018 |
| ALT4 | Fear of breaking things (cultural) | LOW-MED | Team deploys only 2x/week by choice |

**Diagnostic test**: Measure deploy time breakdown:
  Build (X min) + Test (X min) + Approval (X min) + Deploy (X min)
  If test + approval > 70%, coupling isn't the primary bottleneck.
```

## Step 5: Confidence Rating

### Overall Assessment Template

```markdown
## Evidence Audit Summary: {Thesis}

### Claims Assessment

| Claim | Evidence Grade | Falsification Status | Competing Explanations |
|-------|---------------|---------------------|----------------------|
| C1 | {A-F} | {Unfalsified / Weakened / Falsified} | {N alternatives} |
| C2 | {A-F} | {Unfalsified / Weakened / Falsified} | {N alternatives} |

### Overall Confidence: {HIGH / MEDIUM / LOW / INSUFFICIENT}

**HIGH**: All key claims have Grade A-B evidence, no strong competing explanations
**MEDIUM**: Most claims supported, but some rely on Grade C-D evidence
**LOW**: Key claims lack evidence or have strong competing explanations
**INSUFFICIENT**: Cannot assess — critical evidence is missing

### Strongest Points
- {What holds up well under scrutiny}

### Weakest Points
- {What lacks evidence or has strong alternatives}

### Recommended Experiments
| # | Experiment | Tests Claim | Cost | Duration |
|---|-----------|------------|------|----------|
| 1 | {experiment} | {which claim} | {effort} | {time} |
| 2 | {experiment} | {which claim} | {effort} | {time} |
```

## Full Deliverable Template

```markdown
## Evidence Audit: {Thesis Title}

### Steelmanned Thesis
{Strongest version of the position}

### Extracted Claims
1. {C1}
2. {C2}
3. {C3}

### Audit Results

#### C1: {claim}
- **Falsification criteria**: FALSE if {condition}
- **Evidence**: {Grade A-F} — {summary}
- **Competing explanations**: {alternatives}
- **Verdict**: {Unfalsified / Weakened / Falsified}

{Repeat for each claim}

### Confidence Assessment
**Overall**: {HIGH / MEDIUM / LOW / INSUFFICIENT}
- Strongest: {what holds}
- Weakest: {what doesn't}

### Experiments to Run
{Prioritized list of tests that would strengthen or refute key claims}
```

## Anti-Patterns

| Anti-Pattern | Why It Fails | Correct Approach |
|-------------|-------------|------------------|
| Demanding impossible proof | "Prove it 100%" kills all action | Ask for best available evidence, grade it honestly |
| Treating all evidence equally | Blog post is not equal to measured data | Use the grading scale consistently |
| Ignoring base rates | "90% success" without knowing the default | Always ask "compared to what?" |
| Only looking for disconfirmation | Becomes nihilistic | Grade evidence fairly — strong evidence is strong |
| Confusing absence of evidence with evidence of absence | "No data = claim is false" | "No data = INSUFFICIENT, need more info" |
| Accepting "industry standard" as evidence | Popularity is not truth | Ask "standard for what context? With what outcomes?" |
