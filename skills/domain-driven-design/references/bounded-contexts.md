# Bounded Contexts and Context Mapping

## What is a Bounded Context?

A bounded context is an explicit boundary within which a particular domain model is defined and applicable. The same word can mean different things in different contexts.

### Example: "Product"

| Context | Meaning |
|---------|---------|
| Catalog | Name, description, images, categories |
| Pricing | Base price, discount rules, tax category |
| Inventory | SKU, warehouse location, stock level |
| Shipping | Weight, dimensions, fragility, origin |

Each context has its own model of "Product" — and that's correct.

## Key Insights

- A bounded context is **NOT** a microservice — it's a linguistic and model boundary
- Context boundaries often align with team boundaries (Conway's Law)
- Bounded contexts can be deployed together (monolith) or separately (microservices)
- The Anti-Corruption Layer is the most important defensive pattern
- Shared Kernel is dangerous: it couples two teams and should be kept small

## Context Mapping Patterns

### Partnership

Two teams with mutual dependency. Both succeed or fail together.

| When | Behavior |
|------|----------|
| Tightly coupled features | Joint planning, synchronized releases |
| Shared timeline pressure | Regular integration, mutual accommodation |

### Shared Kernel

Two contexts share a small, explicitly defined subset of the domain model.

| When | Risk |
|------|------|
| Two teams need identical core concepts | Any change affects both teams |
| Very small shared surface | Must be co-owned with strict change control |

### Customer-Supplier

Upstream (supplier) provides what downstream (customer) needs.

| When | Behavior |
|------|----------|
| One team depends on another's output | Downstream communicates needs; upstream prioritizes |
| Clear producer/consumer relationship | Negotiated interfaces, versioned APIs |

### Conformist

Downstream conforms to upstream's model without influence.

| When | Behavior |
|------|----------|
| No negotiating power (e.g., third-party API) | Downstream adopts upstream's model as-is |
| Cost of translation > cost of conforming | Accept the model, minimize integration code |

### Anti-Corruption Layer (ACL)

Downstream creates a translation layer that isolates its model from upstream's model.

| When | Implementation |
|------|---------------|
| Legacy system integration | Adapter that converts legacy format to domain model |
| Third-party API with unstable/poor model | Facade that wraps external API behind domain interfaces |
| Prevent foreign concepts leaking in | All external data passes through translation at boundary |

```
External API → ACL (Adapter/Translator) → Domain Model
```

**This is the most important defensive pattern.** Always use ACL when integrating with:
- Legacy systems
- Third-party services
- External APIs you don't control

### Open Host Service

Upstream defines a well-documented protocol (API) that any downstream can use.

| When | Implementation |
|------|---------------|
| Multiple consumers of the same service | REST/GraphQL API with versioning, OpenAPI spec |
| Public-facing API | Published Language (canonical schema) |

### Published Language

A well-documented, shared language (schema) for exchanging information between contexts.

| When | Examples |
|------|----------|
| Standard data exchange | JSON Schema, Protocol Buffers, Avro |
| Industry standards | FHIR (healthcare), FIX (finance), EDI (commerce) |

### Separate Ways

No integration. Two contexts operate independently.

| When | Behavior |
|------|----------|
| Integration cost > benefit | Accept duplication |
| Unrelated domains | Don't force a connection |

## Context Map Diagram

```
[Catalog] ←Partnership→ [Pricing]
    ↓ (Open Host)
[Search] (Conformist)

[Orders] ←ACL→ [Legacy Billing]
[Orders] ←Customer-Supplier→ [Shipping]
[Orders] ←Shared Kernel→ [Inventory] (small: ProductId, SKU)
```

## Anti-Pattern: Big Ball of Mud

When there are no clear bounded contexts, the model degrades into an inconsistent mess where every change has unpredictable ripple effects. Solution: identify boundaries, define contexts, establish ACLs.
