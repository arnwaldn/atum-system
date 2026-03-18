# Mode Selection Guide

## Overview

The Fool operates in 5 distinct reasoning modes. Selecting the right mode determines the quality of the challenge. This guide helps choose the optimal mode for any given situation, and explains how to combine modes for deeper analysis.

## Quick Selection

### By User Intent

| User Says | Mode | Why |
|-----------|------|-----|
| "Challenge my assumptions" | Socratic Questioning | Surfaces hidden beliefs and untested premises |
| "Play devil's advocate" | Dialectic Synthesis | Builds the strongest opposing position |
| "What could go wrong?" | Pre-Mortem Analysis | Imagines failure and works backward |
| "Poke holes in this" | Red Team (Adversarial) | Adopts attacker mindset to find vulnerabilities |
| "Is my reasoning sound?" | Evidence Audit | Tests whether evidence supports conclusions |
| "Stress test this" | Start with Pre-Mortem, offer Red Team follow-up | Covers both accidental and adversarial failure |
| "I'm not sure about this" | Start with Socratic, offer Evidence Audit | Clarifies thinking first, then grades evidence |

### By Target Type

| What's Being Challenged | Primary Mode | Secondary Mode |
|------------------------|-------------|----------------|
| Technical architecture decision | Dialectic | Pre-Mortem |
| Business strategy / go-to-market | Pre-Mortem | Evidence Audit |
| Security design | Red Team | Pre-Mortem |
| Technology choice (X vs Y) | Evidence Audit | Dialectic |
| Project plan / timeline | Pre-Mortem | Socratic |
| Feature prioritization | Socratic | Dialectic |
| Pricing / business model | Evidence Audit | Red Team |
| Hiring / team structure | Pre-Mortem | Socratic |
| Investment / funding decision | Evidence Audit | Pre-Mortem |
| API design / interface | Dialectic | Red Team |

### By Risk Profile

| Risk Level | Recommended Approach |
|-----------|---------------------|
| Low stakes, reversible | Single mode, 3 challenges |
| Medium stakes | Primary mode + offer second pass |
| High stakes, irreversible | Two modes in sequence |
| Critical (security, data, legal) | Red Team mandatory + one other mode |

## The Two-Step Selection Process

### Step 1: Category Selection

Present 4 options to the user:

```markdown
How would you like me to challenge this?

1. **Question assumptions** — Expose what you're taking for granted
2. **Build counter-arguments** — Argue the strongest opposing position
3. **Find weaknesses** — Anticipate how this fails or gets exploited
4. **You choose** — I'll recommend based on what I see
```

### Step 2: Refinement (When Needed)

Only two categories require a second question:

#### "Question assumptions" branches to:

```markdown
What kind of questioning?

A. **Expose my assumptions** (Socratic) — Probing questions to surface
   hidden beliefs and untested premises. Output: assumption inventory
   + probing questions + experiments.

B. **Test the evidence** (Falsification) — Audit whether the evidence
   actually supports the conclusion. Output: claims graded + competing
   explanations + confidence rating.
```

#### "Find weaknesses" branches to:

```markdown
What kind of weakness analysis?

A. **Find failure modes** (Pre-Mortem) — Imagine this has already failed
   and work backward. Covers accidental failures, process issues, and
   cascading effects. Output: ranked failure narratives + mitigations.

B. **Attack this** (Red Team) — Adopt an adversary's mindset. Find
   vulnerabilities a motivated attacker would exploit. Output: attack
   vectors + defenses.
```

#### "Build counter-arguments" skips Step 2:
Directly proceeds with Dialectic Synthesis.

#### "You choose" skips Step 2:
Auto-recommend based on context analysis (see auto-recommendation below).

## Auto-Recommendation Logic

When the user selects "You choose", analyze the context:

```
IF target involves security, authentication, or sensitive data:
  → Red Team (adversarial threats are primary concern)

ELIF target is a technology/vendor decision with cited evidence:
  → Evidence Audit (test the reasoning quality)

ELIF target is a plan with timeline and milestones:
  → Pre-Mortem (anticipate execution failures)

ELIF target is a strategic choice between two options:
  → Dialectic Synthesis (argue the other side)

ELIF target is vague or the user seems uncertain:
  → Socratic Questioning (clarify thinking first)

ELSE:
  → Pre-Mortem (safe default — most universally applicable)
```

## Mode Combination Patterns

### Sequential Combinations (Recommended)

| Pattern | When | Sequence |
|---------|------|----------|
| **Clarify then Validate** | Fuzzy thinking | Socratic -> Evidence Audit |
| **Challenge then Stress** | Architecture decision | Dialectic -> Pre-Mortem |
| **Accidental then Adversarial** | Security-sensitive plan | Pre-Mortem -> Red Team |
| **Evidence then Counter** | Data-driven decision | Evidence Audit -> Dialectic |
| **Surface then Attack** | New system design | Socratic -> Red Team |

### Example: Two-Mode Sequence

```markdown
## Round 1: Pre-Mortem (accidental failure)
{Failure narratives, mitigations}

User engages with findings...

## Round 2: Red Team (adversarial failure)
{Attack vectors, defenses}

User engages with findings...

## Combined Synthesis
{Integrated view: what can go wrong accidentally AND what can be exploited}
{Unified mitigation plan covering both}
```

## Mode Comparison Matrix

| Dimension | Socratic | Dialectic | Pre-Mortem | Red Team | Evidence |
|-----------|----------|-----------|-----------|----------|----------|
| **Mindset** | Curious teacher | Opposing advocate | Pessimistic planner | Hostile adversary | Skeptical scientist |
| **Target** | Assumptions | Position/choice | Plan/project | System/defense | Claims/evidence |
| **Question** | "What are you assuming?" | "What's the other side?" | "How does this fail?" | "How is this attacked?" | "Does the data support this?" |
| **Output** | Questions + experiments | Counter-argument + synthesis | Failure modes + mitigations | Attack vectors + defenses | Evidence grades + confidence |
| **Tone** | Collaborative, curious | Adversarial but fair | Pragmatic, cautious | Aggressive, thorough | Analytical, impartial |
| **Strength** | Surfaces blind spots | Tests conviction | Anticipates real failures | Finds security/game gaps | Validates reasoning quality |
| **Weakness** | Can feel slow, academic | May create false dichotomy | Can be overly pessimistic | May suggest unlikely threats | Can paralyze with "insufficient data" |

## Transitioning Between Modes

When a mode reveals a need for a different mode:

| During Mode | Signal | Transition To |
|------------|--------|--------------|
| Socratic | User's assumptions reveal weak evidence | Evidence Audit |
| Socratic | User's assumptions reveal security gaps | Red Team |
| Dialectic | Counter-argument reveals execution risks | Pre-Mortem |
| Dialectic | Counter-argument reveals unvalidated claims | Evidence Audit |
| Pre-Mortem | Failure mode involves adversarial action | Red Team |
| Pre-Mortem | Failure mode involves faulty premise | Socratic |
| Red Team | Attack exploits a business logic flaw | Pre-Mortem |
| Red Team | Defense depends on unvalidated assumption | Evidence Audit |
| Evidence | Evidence is strong but direction is debatable | Dialectic |
| Evidence | Evidence reveals risk scenarios | Pre-Mortem |

## After the Challenge: Synthesis Protocol

Regardless of mode, every session must end with:

```markdown
## Synthesis

### What Holds Up
{Aspects of the original position that survived the challenge}

### What Needs Adjustment
{Aspects that were weakened and how to address them}

### Strengthened Position
{The thesis, improved by incorporating the challenges}

### Next Steps
{Concrete actions to address remaining gaps}

### Offer Second Pass
"Would you like me to run a second pass using {other mode}?"
```

## Common Mistakes in Mode Selection

| Mistake | Result | Prevention |
|---------|--------|-----------|
| Red teaming a fuzzy idea | Attacks miss because target is unclear | Start with Socratic to clarify first |
| Pre-mortem on a pure decision | Generates failure modes for all options equally | Use Dialectic for decisions between options |
| Evidence audit without claims | Nothing concrete to test | Ensure the thesis contains testable assertions |
| Dialectic when user wants validation | Feels adversarial when they wanted support | Check: "Do you want me to challenge or strengthen this?" |
| Same mode for every challenge | Misses important angles | Vary mode based on target type |
