# Socratic Questioning — Expose My Assumptions

## Overview

Socratic questioning exposes hidden assumptions, unstated beliefs, and logical gaps by asking probing questions. The goal is not to destroy the idea but to surface what the thinker is taking for granted so the idea can be strengthened.

## The Method

```
1. Identify the thesis (steelman it first)
2. Extract assumptions (what must be true for this to work?)
3. Group assumptions by theme
4. Craft probing questions for each assumption
5. Suggest experiments to test key assumptions
6. Present the 3-5 strongest questions
```

## Question Categories

### Clarification Questions

Surface vague or undefined terms:

| Pattern | Example |
|---------|---------|
| "What exactly do you mean by X?" | "What exactly do you mean by 'scalable'? 10x users or 1000x?" |
| "Can you give a specific example?" | "Can you give an example of a user who would use this daily?" |
| "How would you define X?" | "How would you define 'success' for this feature at 3 months?" |
| "What does X look like in practice?" | "What does 'real-time' look like — sub-second or sub-minute?" |

**When to use**: The thesis contains abstract or buzzword-heavy language.

### Assumption-Probing Questions

Expose what is being taken for granted:

| Pattern | Example |
|---------|---------|
| "What are you assuming about X?" | "What are you assuming about user technical literacy?" |
| "Why do you believe X is true?" | "Why do you believe users will switch from their current tool?" |
| "What if X were not the case?" | "What if your target users don't actually have this problem?" |
| "Is X always true, or just sometimes?" | "Is latency always the bottleneck, or just at peak?" |
| "What evidence supports X?" | "What evidence supports the claim that users want this?" |

**When to use**: The thesis rests on beliefs that haven't been validated.

### Reason and Evidence Questions

Test the logical foundations:

| Pattern | Example |
|---------|---------|
| "What evidence would change your mind?" | "What metric, if you saw it, would make you abandon this approach?" |
| "How do you know X causes Y?" | "How do you know the slow queries cause the timeout, not the network?" |
| "Is there an alternative explanation?" | "Could the drop in signups be seasonal rather than a UX problem?" |
| "What's the strongest counter-evidence?" | "What's the best argument against microservices for this project?" |

**When to use**: The thesis makes causal claims or presents evidence selectively.

### Implication and Consequence Questions

Explore downstream effects:

| Pattern | Example |
|---------|---------|
| "If X is true, what follows?" | "If you need 99.99% uptime, what does that mean for your on-call team?" |
| "What are the second-order effects?" | "If you add this feature, what maintenance burden does it create?" |
| "Who else is affected?" | "If you change the API, which downstream consumers break?" |
| "What's the worst case?" | "If this fails completely, what's the recovery path?" |

**When to use**: The thesis focuses on benefits without considering costs or side effects.

### Viewpoint and Perspective Questions

Challenge the frame of reference:

| Pattern | Example |
|---------|---------|
| "How would X see this differently?" | "How would your most skeptical user see this feature?" |
| "What would someone who disagrees say?" | "What would a developer who prefers monoliths say about this?" |
| "Is there another way to interpret this?" | "Could the user data mean they're confused, not engaged?" |
| "What are you not seeing?" | "What perspectives are missing from this analysis?" |

**When to use**: The thesis reflects a single perspective or echo chamber thinking.

## Assumption Inventory Template

```markdown
## Assumption Inventory: {Thesis Title}

### Steelmanned Thesis
{Restate the thesis in its strongest, most charitable form}

### Extracted Assumptions

#### Theme 1: {e.g., User Behavior}
| # | Assumption | Confidence | Evidence | Risk if Wrong |
|---|-----------|------------|----------|---------------|
| A1 | {assumption} | {HIGH/MED/LOW} | {what supports it} | {impact} |
| A2 | {assumption} | {HIGH/MED/LOW} | {what supports it} | {impact} |

#### Theme 2: {e.g., Technical Feasibility}
| # | Assumption | Confidence | Evidence | Risk if Wrong |
|---|-----------|------------|----------|---------------|
| A3 | {assumption} | {HIGH/MED/LOW} | {what supports it} | {impact} |

#### Theme 3: {e.g., Market/Business}
| # | Assumption | Confidence | Evidence | Risk if Wrong |
|---|-----------|------------|----------|---------------|
| A4 | {assumption} | {HIGH/MED/LOW} | {what supports it} | {impact} |

### Probing Questions (Top 5)
1. {Question targeting the riskiest assumption}
2. {Question targeting the least-evidenced assumption}
3. {Question targeting the most consequential assumption}
4. {Question from an alternative perspective}
5. {Question about second-order effects}

### Suggested Experiments
| Assumption | Experiment | Cost | Duration |
|-----------|-----------|------|----------|
| {A1} | {how to test it} | {effort} | {time} |
| {A3} | {how to test it} | {effort} | {time} |
```

## Common Assumption Categories

### Technical Assumptions

| Assumption Pattern | Probing Question |
|-------------------|------------------|
| "Our stack can handle it" | "Have you load-tested at 10x current traffic?" |
| "The API is reliable" | "What's the actual SLA? What happens when it's down?" |
| "Migration will be straightforward" | "What's the rollback plan if migration fails halfway?" |
| "Performance won't be an issue" | "At what scale does this become a bottleneck?" |
| "Security is handled by X" | "What attack vectors does X not cover?" |

### Business Assumptions

| Assumption Pattern | Probing Question |
|-------------------|------------------|
| "Users want this feature" | "How many users have explicitly asked for it?" |
| "The market is growing" | "What if growth plateaus or a competitor enters?" |
| "We can ship by Q3" | "What dependencies could delay this, and what's Plan B?" |
| "This will reduce churn" | "What evidence connects this feature to retention?" |
| "Pricing is competitive" | "Would users switch to a free alternative with 80% of features?" |

### Team Assumptions

| Assumption Pattern | Probing Question |
|-------------------|------------------|
| "The team has the skills" | "Who specifically has done this before? What's the learning curve?" |
| "We have enough people" | "What gets delayed if this takes 2x longer than estimated?" |
| "Communication is fine" | "When was the last miscommunication that caused rework?" |

## Prioritizing Assumptions to Challenge

Score each assumption on two axes:

```
                  HIGH RISK IF WRONG
                        │
          ┌─────────────┼─────────────┐
          │  Challenge   │  Challenge  │
          │  Soon        │  FIRST      │
          │             │             │
LOW       ├─────────────┼─────────────┤ HIGH
CONFIDENCE│             │             │ CONFIDENCE
          │  Note but   │  Monitor    │
          │  deprioritize│  for change│
          │             │             │
          └─────────────┼─────────────┘
                        │
                  LOW RISK IF WRONG
```

Focus questioning on: HIGH risk + LOW confidence assumptions.

## Anti-Patterns

| Anti-Pattern | Why It Fails | Instead |
|-------------|-------------|---------|
| Rapid-fire questions | Feels like interrogation | Ask 1-2 questions, wait for response |
| Leading questions | "Don't you think X is bad?" | "What are the trade-offs of X?" |
| Questions you know the answer to | Feels condescending | Ask genuinely curious questions |
| Only challenging, never conceding | Destroys trust | Acknowledge strong points explicitly |
| Abstract philosophical questions | Not actionable | Ground questions in specific scenarios |
