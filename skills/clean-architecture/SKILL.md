---
name: clean-architecture
description: 'Structure software around the Dependency Rule: source code dependencies point inward from frameworks to use cases to entities. Use when the user mentions "architecture layers", "dependency rule", "ports and adapters", "hexagonal architecture", or "use case boundary". Covers component principles, boundaries, and SOLID.'
version: "1.1.0"
metadata:
  domain: architecture
  triggers: clean architecture, dependency rule, ports and adapters, hexagonal architecture, use case boundary, SOLID, onion architecture
  role: architect
  scope: architecture
  output-format: architecture
  related-skills: domain-driven-design, system-design
---

# Clean Architecture Framework

A disciplined approach to structuring software so that business rules remain independent of frameworks, databases, and delivery mechanisms.

## Core Principle

**Source code dependencies must point inward -- toward higher-level policies.** Nothing in an inner circle can know anything about something in an outer circle.

## Scoring

**Goal: 10/10.** Rate software architecture 0-10 based on adherence to these principles.

## Concentric Circles (Summary)

Innermost → Outermost:
1. **Entities** — Enterprise business rules (plain objects, no framework dependencies)
2. **Use Cases** — Application rules (one per operation, orchestrate entities)
3. **Interface Adapters** — Controllers, gateways, presenters (convert data formats)
4. **Frameworks & Drivers** — Web, DB, external APIs (outermost glue code)

**Data crossing boundaries**: Always in a form convenient for the inner circle (DTOs, not ORM models).

## Reference Guide

| Topic | Reference | Load When |
|-------|-----------|-----------|
| Layers & Boundaries | `references/layers-and-boundaries.md` | Detailed layer patterns, humble object, composition root |
| Component & SOLID Principles | `references/component-principles.md` | REP, CCP, CRP, ADP, SDP, SAP, SRP, OCP, LSP, ISP, DIP |

## Quick Diagnostic

| Question | If No | Action |
|----------|-------|--------|
| Test business rules without DB/web? | Coupled to infra | Extract behind interfaces |
| Dependencies point inward? | Rule violated | Introduce interfaces; invert |
| Can swap database? | Persistence leaking | Repository pattern |
| Use Cases delivery-independent? | HTTP leaking | Use plain DTOs |
| Framework in outermost circle? | Framework is architecture | Push to edges |

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| ORM leaking into business logic | Separate domain from persistence models |
| Business rules in controllers | Move logic into Use Case Interactors |
| Framework-first architecture | Treat framework as outermost plugin |
| Circular dependencies | Apply DIP or extract shared abstraction |
| Giant Use Cases | Split into single-operation Use Cases |

## Further Reading

- *"Clean Architecture"* by Robert C. Martin
