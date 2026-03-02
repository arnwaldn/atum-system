---
name: clean-architecture
description: 'Structure software around the Dependency Rule: source code dependencies point inward from frameworks to use cases to entities. Use when the user mentions "architecture layers", "dependency rule", "ports and adapters", "hexagonal architecture", or "use case boundary". Covers component principles, boundaries, and SOLID.'
version: "1.0.0"
---

# Clean Architecture Framework

A disciplined approach to structuring software so that business rules remain independent of frameworks, databases, and delivery mechanisms.

## Core Principle

**Source code dependencies must point inward -- toward higher-level policies.** Nothing in an inner circle can know anything about something in an outer circle.

## Scoring

**Goal: 10/10.** Rate software architecture 0-10 based on adherence to these principles.

### 1. Dependency Rule and Concentric Circles

Innermost: Entities (enterprise business rules). Next: Use Cases (application rules). Then: Interface Adapters. Outermost: Frameworks and Drivers.

| Context | Pattern | Example |
|---------|---------|---------|
| Layer direction | Inner defines interfaces; outer implements | UserRepository interface in Use Cases; PostgresUserRepository in Adapters |
| Data crossing | DTOs cross boundaries, not ORM entities | Use Case returns UserResponse DTO |
| Framework isolation | Wrap framework behind interfaces | EmailSender interface hides SendGrid or SES |
| Database independence | Repository pattern abstracts persistence | Business logic calls repo.save(user) |

### 2. Entities and Use Cases

Entities encapsulate enterprise-wide business rules. Use Cases contain application-specific rules that orchestrate Entities.

| Context | Pattern | Example |
|---------|---------|---------|
| Entity design | No framework dependencies | Order.calculateTotal() knows nothing about HTTP |
| Use Case boundary | Input Port and Output Port | CreateOrderInput / CreateOrderOutput |
| Single responsibility | One Use Case per operation | PlaceOrder, CancelOrder, RefundOrder |

### 3. Interface Adapters and Frameworks

Adapters convert data between Use Case format and external format. Frameworks are glue code in the outermost layer.

| Context | Pattern | Example |
|---------|---------|---------|
| Controller | Translates delivery to Use Case input | OrderController.create(req) calls Interactor |
| Gateway | Implements repository with specific DB | SqlOrderRepository implements OrderRepository |
| Main as plugin | Composition root assembles system | main() wires concrete implementations |

### 4. Component Principles

- **REP**: Classes releasable together belong together
- **CCP**: Classes that change for same reason belong together
- **CRP**: Do not force users to depend on unused things
- **ADP**: No cycles in dependency graph
- **SDP**: Depend toward stability
- **SAP**: Stable components should be abstract

### 5. SOLID Principles

- **SRP**: Module serves one actor
- **OCP**: Extend by adding, not modifying
- **LSP**: Subtypes usable through base type
- **ISP**: No forced dependency on unused methods
- **DIP**: Depend on abstractions defined by high-level module

### 6. Boundaries and Humble Object Pattern

The Humble Object pattern makes code at boundaries testable by splitting behavior into testable logic and hard-to-test infrastructure.

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| ORM leaking into business logic | Separate domain from persistence models |
| Business rules in controllers | Move logic into Use Case Interactors |
| Framework-first architecture | Treat framework as outermost plugin |
| Circular dependencies | Apply DIP or extract shared abstraction |
| Giant Use Cases | Split into single-operation Use Cases |

## Quick Diagnostic

| Question | If No | Action |
|----------|-------|--------|
| Test business rules without DB/web? | Coupled to infra | Extract behind interfaces |
| Dependencies point inward? | Rule violated | Introduce interfaces; invert |
| Can swap database? | Persistence leaking | Repository pattern |
| Use Cases delivery-independent? | HTTP leaking | Use plain DTOs |
| Framework in outermost circle? | Framework is architecture | Push to edges |

## Further Reading

- *"Clean Architecture"* by Robert C. Martin
