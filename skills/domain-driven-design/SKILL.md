---
name: domain-driven-design
description: 'Model software around the business domain using bounded contexts, aggregates, and ubiquitous language. Use when the user mentions "domain modeling", "bounded context", "aggregate root", "ubiquitous language", or "anti-corruption layer". Covers entities vs value objects, domain events, and context mapping strategies.'
version: "1.1.0"
metadata:
  domain: architecture
  triggers: domain modeling, bounded context, aggregate root, ubiquitous language, anti-corruption layer, entities, value objects, domain events
  role: architect
  scope: architecture
  output-format: architecture
  related-skills: clean-architecture, system-design
---

# Domain-Driven Design Framework

Framework for tackling software complexity by modeling code around the business domain.

## Core Principle

**The model is the code; the code is the model.** Software should embody a deep, shared understanding of the business domain. When domain experts and developers speak the same language and that language is directly expressed in the codebase, complexity becomes manageable.

## Scoring

**Goal: 10/10.** Rate domain models 0-10 based on adherence to the principles below.

## Ubiquitous Language

A shared, rigorous language between developers and domain experts used consistently in conversation, documentation, and code.

| Context | Pattern | Example |
|---------|---------|---------|
| Class naming | Name classes after domain concepts | LoanApplication, not RequestHandler |
| Method naming | Use verbs the business uses | policy.underwrite(), not policy.process() |
| Event naming | Past-tense domain actions | ClaimSubmitted, not DataSaved |
| Module structure | Organize by domain concept | shipping/, billing/, not controllers/ |
| Code review | Reject technical-only names | Flag Manager, Helper, Processor, Utils |

## Reference Guide

| Topic | Reference | Load When |
|-------|-----------|-----------|
| Bounded Contexts | `references/bounded-contexts.md` | Context mapping, ACL, partnerships, shared kernel |
| Tactical Patterns | `references/tactical-patterns.md` | Entities, value objects, aggregates, domain events, repositories |
| Strategic Design | `references/strategic-design.md` | Core/supporting/generic domains, distillation, team allocation |

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Technical names instead of domain language | Rename to domain terms |
| One model to rule them all | Define bounded contexts |
| Giant aggregates | Keep small; reference by ID |
| Anemic domain model | Move behavior into entities and VOs |
| No Anti-Corruption Layer | Wrap every external system |
| Bounded contexts as microservices | Model boundary, not deployment unit |

## Further Reading

- *"Domain-Driven Design: Tackling Complexity in the Heart of Software"* by Eric Evans
