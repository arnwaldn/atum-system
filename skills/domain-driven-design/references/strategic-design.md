# Strategic Design and Distillation

## Domain Classification

Every system has three types of subdomains. The key strategic decision is how much effort to invest in each.

### Core Domain

The competitive advantage. What makes the business unique. Build it, invest the best developers.

| Signal | Example |
|--------|---------|
| "This is why customers choose us" | Pricing engine for an insurance company |
| "Nobody else does this exactly like us" | Recommendation algorithm for a media platform |
| "If we lose this, we lose the business" | Matching algorithm for a hiring platform |

**Investment**: Maximum. Senior engineers. Deep modeling. Extensive testing.

### Supporting Subdomain

Necessary for the business but not a differentiator. Build it, but don't over-invest.

| Signal | Example |
|--------|---------|
| "We need this but it's not our secret sauce" | Internal approval workflows |
| "Custom enough that we can't buy off-the-shelf" | Agent management for a real estate platform |
| "Important but not what sells" | Content moderation system |

**Investment**: Moderate. Solid implementation, good enough.

### Generic Subdomain

Commodity. Solved problems. Buy or use open-source.

| Signal | Example |
|--------|---------|
| "Everyone needs this" | Authentication, email sending, PDF generation |
| "There are 50 products that do this" | Payment processing → Stripe |
| "We gain nothing by building it ourselves" | File storage → S3/R2 |

**Investment**: Minimal. Use third-party services. Don't build what you can buy.

## Distillation

The process of extracting the Core Domain from the rest of the system, making it explicit and focused.

### Steps

1. **Identify** the Core Domain through domain expert conversations
2. **Separate** core from supporting and generic code
3. **Isolate** the Core Domain in its own module/service
4. **Protect** it with Anti-Corruption Layers at boundaries
5. **Invest** disproportionately in modeling, testing, and documentation

### Domain Vision Statement

A short document (1 page max) that describes the Core Domain and its value proposition.

```markdown
# Domain Vision: TourManager

Our Core Domain is **tour routing and optimization** — the ability to
generate optimal tour schedules considering venue availability,
travel distance, artist preferences, and budget constraints.

This is what differentiates us from generic calendar tools. Everything
else (payments, notifications, user accounts) is supporting or generic.
```

## Team Allocation Strategy

| Subdomain | Team | Investment | Buy vs Build |
|-----------|------|------------|-------------|
| Core | Senior, dedicated | High | Always build |
| Supporting | Mixed experience | Moderate | Build or simple framework |
| Generic | Junior or outsource | Low | Buy, SaaS, open-source |

## Code Organization by Subdomain

```
src/
  domain/
    core/                    # Core Domain — maximum investment
      pricing/
      routing/
    supporting/              # Supporting — solid but simpler
      approval-workflows/
      agent-management/
  infrastructure/
    generic/                 # Generic — thin wrappers around 3rd party
      auth/                  # Wraps Auth0/Clerk
      payments/              # Wraps Stripe
      email/                 # Wraps SendGrid
      storage/               # Wraps S3
```

## Context Mapping for Strategic Decisions

| Relationship | Strategic Implication |
|-------------|----------------------|
| Core ← ACL → External | Always protect core with anti-corruption layer |
| Core ←→ Core | Partnership — invest in clean interfaces |
| Supporting → Generic | Conformist is acceptable for generic dependencies |
| Core → Supporting | Customer-Supplier — supporting serves core's needs |

## Evolution Over Time

Domains evolve. What is Core today may become Generic tomorrow (as industry matures).

| Phase | Strategy |
|-------|----------|
| Startup | Core = almost everything (small team, custom solutions) |
| Growth | Identify core, extract generic (buy auth, payments) |
| Maturity | Core narrows, more supporting and generic subdomain outsourced |
| Disruption | New core emerges (AI, new market segment) |

Periodically re-evaluate: "Is this still our competitive advantage, or has it become commodity?"
