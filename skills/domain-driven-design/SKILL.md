---
name: domain-driven-design
description: 'Model software around the business domain using bounded contexts, aggregates, and ubiquitous language. Use when the user mentions "domain modeling", "bounded context", "aggregate root", "ubiquitous language", or "anti-corruption layer". Covers entities vs value objects, domain events, and context mapping strategies.'
version: "1.0.1"
---

# Domain-Driven Design Framework

Framework for tackling software complexity by modeling code around the business domain. Based on a fundamental truth: the greatest risk in software is not technical failure -- it is building a model that does not reflect how the business actually works.

## Core Principle

**The model is the code; the code is the model.** Software should embody a deep, shared understanding of the business domain. When domain experts and developers speak the same language and that language is directly expressed in the codebase, complexity becomes manageable.

## Scoring

**Goal: 10/10.** When reviewing or creating domain models, rate them 0-10 based on adherence to the principles below. Always provide the current score and specific improvements needed to reach 10/10.

## Framework

### 1. Ubiquitous Language

A shared, rigorous language between developers and domain experts used consistently in conversation, documentation, and code.

**Key insights:**
- The language emerges from deep collaboration, not a glossary bolted on after the fact
- If a concept is hard to name, the model is likely wrong
- Code that uses technical jargon instead of domain terms hides domain logic
- Different bounded contexts may use the same word with different meanings

| Context | Pattern | Example |
|---------|---------|---------|
| Class naming | Name classes after domain concepts | LoanApplication, not RequestHandler |
| Method naming | Use verbs the business uses | policy.underwrite(), not policy.process() |
| Event naming | Past-tense domain actions | ClaimSubmitted, not DataSaved |
| Module structure | Organize by domain concept | shipping/, billing/, not controllers/ |
| Code review | Reject technical-only names | Flag Manager, Helper, Processor, Utils |

### 2. Bounded Contexts and Context Mapping

A bounded context is an explicit boundary within which a particular domain model is defined and applicable.

**Key insights:**
- A bounded context is not a microservice -- it is a linguistic and model boundary
- Context boundaries often align with team boundaries (Conway's Law)
- Anti-Corruption Layer is the most important defensive pattern
- Shared Kernel is dangerous: it couples two teams and should be small

| Context | Pattern | Example |
|---------|---------|---------|
| Service integration | Anti-Corruption Layer | Translate external API responses at the boundary |
| Team collaboration | Shared Kernel | Two teams co-own a small Money value object library |
| Legacy migration | Conformist / ACL | Wrap legacy system behind an adapter |
| API design | Open Host Service | Well-documented REST API with canonical schema |

### 3. Entities, Value Objects, and Aggregates

Entities have identity that persists across state changes. Value Objects are defined entirely by their attributes and are immutable. Aggregates are clusters with a single root entity that enforces consistency boundaries.

**Key insights:**
- Entity: "Am I the same thing even if all my attributes change?"
- Value Object: "Am I defined only by my attributes?" -- prefer immutability
- Most things should be Value Objects, not Entities
- Keep aggregates small -- reference other aggregates by ID
- Design for eventual consistency between aggregates

| Context | Pattern | Example |
|---------|---------|---------|
| Identity tracking | Entity with ID | Order identified by orderId |
| Immutable attributes | Value Object | Address(street, city, zip) -- replace, never mutate |
| Consistency boundary | Aggregate Root | Order is root; OrderLine exists only through it |
| Cross-aggregate | Reference by ID | Order stores customerId, not a Customer object |

### 4. Domain Events

A domain event captures something that happened in the domain. Events are named in past tense and represent immutable facts.

| Context | Pattern | Example |
|---------|---------|---------|
| State transitions | Raise event on domain action | order.place() raises OrderPlaced |
| Cross-context | Publish integration event | OrderPlaced triggers ShippingLabelRequested |
| Audit trail | Store events as history | OrderPlaced -> PaymentReceived -> OrderShipped |
| Eventual consistency | Async event handlers | InventoryReserved updates stock after OrderPlaced |

### 5. Repositories and Factories

Repositories provide the illusion of an in-memory collection, hiding persistence. Factories encapsulate complex creation logic ensuring valid state.

| Context | Pattern | Example |
|---------|---------|---------|
| Data access | Repository interface | OrderRepository.findByCustomer(customerId) |
| Complex creation | Factory method | Order.createFromQuote(quote) |
| Query encapsulation | Specification | spec = OverdueBy(days=30); repo.findMatching(spec) |

### 6. Strategic Design and Distillation

Identify the Core Domain (competitive advantage), Supporting Subdomains (necessary but not differentiating), and Generic Subdomains (commodity).

| Context | Pattern | Example |
|---------|---------|---------|
| Build vs. buy | Classify subdomain type | Build pricing engine (core); use Stripe (generic) |
| Team allocation | Best devs on Core Domain | Senior engineers model underwriting rules |
| Code organization | Separate core from generic | domain/pricing/ vs infrastructure/email/ |

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
