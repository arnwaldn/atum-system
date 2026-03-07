# Component Principles

## Cohesion Principles (What belongs together)

### REP — Reuse/Release Equivalence Principle

> Classes and modules that are grouped together into a component should be releasable together.

If you reuse a component, you reuse everything in it. So everything in it should be cohesive — related to the same purpose.

| Signal | Action |
|--------|--------|
| "I only need half of this package" | Split into smaller, focused packages |
| "These classes always change together" | Good — they belong in the same component |
| "This utility class has nothing to do with the rest" | Move it to a utility component |

### CCP — Common Closure Principle

> Gather into components those classes that change for the same reasons and at the same times. Separate into different components those classes that change at different times and for different reasons.

This is SRP applied to components. A change in requirements should affect only one component.

| Signal | Action |
|--------|--------|
| "I changed the billing model and touched 5 packages" | Group billing classes into one component |
| "This component changes for UI AND business reasons" | Split: UI component + business component |
| "Two teams always edit the same files" | Realign components with team boundaries |

### CRP — Common Reuse Principle

> Don't force users of a component to depend on things they don't need.

If you depend on a component, you depend on everything in it. Every class must be necessary.

| Signal | Action |
|--------|--------|
| "I imported a 500KB lib for one function" | Find a smaller lib or write the function |
| "Half the types in this package are irrelevant" | Split into focused sub-packages |
| "Updating this component broke an unrelated feature" | Decouple — the component is too broad |

## Coupling Principles (Relationships between components)

### ADP — Acyclic Dependencies Principle

> Allow no cycles in the component dependency graph.

Cycles make everything harder: build order, testing, understanding, deployment.

| Detection | Fix |
|-----------|-----|
| A → B → C → A | Apply DIP: introduce an interface in A that C implements |
| Mutual dependency: A ↔ B | Extract shared abstraction into new component C |
| Build order is ambiguous | If you can't determine build order, there's a cycle |

### SDP — Stable Dependencies Principle

> Depend in the direction of stability.

A component that many others depend on is hard to change (stable). A component that depends on many others is easy to change (unstable).

```
Instability = Outgoing dependencies / (Incoming + Outgoing)
I = 0 → maximally stable (many depend on it)
I = 1 → maximally unstable (depends on many, nobody depends on it)
```

**Rule**: A component should only depend on components more stable than itself.

### SAP — Stable Abstractions Principle

> A component should be as abstract as it is stable.

Stable components should be abstract (interfaces, abstract classes) so they can be extended without modification. Unstable components should be concrete.

```
Abstractness = Abstract classes / Total classes
A = 0 → fully concrete
A = 1 → fully abstract
```

**The Main Sequence**: Plot (I, A) — components should fall near the line from (0,1) to (1,0).
- Zone of Pain: (0,0) — stable and concrete → rigid, hard to change
- Zone of Uselessness: (1,1) — unstable and abstract → over-engineered

## SOLID Principles (Class-level)

### SRP — Single Responsibility Principle

> A module should have one, and only one, reason to change. A module should be responsible to one, and only one, actor.

Not "do one thing" — rather "serve one actor (stakeholder)".

### OCP — Open-Closed Principle

> Software entities should be open for extension, but closed for modification.

Add new behavior by adding new code, not changing existing code. Achieved through polymorphism and dependency inversion.

### LSP — Liskov Substitution Principle

> Subtypes must be substitutable for their base types without altering the correctness of the program.

If `Square extends Rectangle`, then `setWidth(5); setHeight(10); assert area == 50` must hold.

### ISP — Interface Segregation Principle

> No client should be forced to depend on methods it does not use.

Prefer many small, focused interfaces over one large interface. A `Printable` interface is better than a `Printable + Scannable + Faxable` multi-interface.

### DIP — Dependency Inversion Principle

> High-level modules should not depend on low-level modules. Both should depend on abstractions. Abstractions should not depend on details. Details should depend on abstractions.

The high-level module (Use Case) defines the interface. The low-level module (Database) implements it. The dependency arrow is inverted.
