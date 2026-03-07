# Tactical Patterns

## Entities

Objects defined by their identity, not their attributes. An Entity persists across state changes.

### Key Question: "Am I the same thing even if all my attributes change?"

| Rule | Example |
|------|---------|
| Has a unique identifier | `Order(id=123)` — even if items change, it's the same order |
| Mutable state (but controlled) | `order.cancel()` changes status, same entity |
| Equality by ID | `order1 == order2` if `order1.id == order2.id` |
| Lifecycle tracking | Created → Active → Cancelled → Archived |

```
class Customer:
    id: CustomerId          # Identity
    name: str               # Can change
    email: Email            # Can change
    registered_at: datetime  # Immutable fact

    def change_email(self, new_email: Email) -> None:
        self.email = new_email  # Still the same customer
```

## Value Objects

Objects defined entirely by their attributes. Immutable. No identity.

### Key Question: "Am I defined only by my attributes?"

| Rule | Example |
|------|---------|
| Immutable | `Money(100, "EUR")` — never mutated, always replaced |
| Equality by attributes | `Money(100, "EUR") == Money(100, "EUR")` → True |
| Self-validating | `Email("invalid")` raises error at construction |
| Side-effect free | `money.add(other)` returns NEW Money |
| Prefer over Entities | Most things should be VOs, not Entities |

```
@dataclass(frozen=True)
class Address:
    street: str
    city: str
    postal_code: str
    country: str
    # No ID — two addresses with same fields ARE the same address
```

**Common Value Objects**: Money, Email, PhoneNumber, Address, DateRange, Coordinates, URL, Color, Percentage.

## Aggregates

A cluster of domain objects treated as a single unit for data changes. One entity is the Aggregate Root.

### Design Rules

| Rule | Rationale |
|------|-----------|
| Single root entity | Only the root is referenced externally |
| Reference other aggregates by ID | `Order` stores `customer_id`, not a `Customer` object |
| Keep aggregates small | Large aggregates = contention, slow loads |
| Enforce invariants within aggregate | `Order` ensures `total == sum(lines)` |
| Transactional boundary | One transaction per aggregate modification |
| Eventual consistency between aggregates | `OrderPlaced` event triggers `InventoryReserved` |

```
# Order Aggregate
class Order:                     # Aggregate Root
    id: OrderId
    customer_id: CustomerId      # Reference by ID (not Customer object)
    lines: list[OrderLine]       # Owned by this aggregate
    status: OrderStatus

    def add_line(self, product_id: ProductId, qty: int, price: Money):
        # Invariant enforcement inside aggregate
        if self.status != OrderStatus.DRAFT:
            raise DomainError("Cannot modify non-draft order")
        self.lines.append(OrderLine(product_id, qty, price))
```

### Anti-Patterns

| Anti-Pattern | Fix |
|-------------|-----|
| Giant aggregate with 10+ entities | Split into smaller aggregates |
| Storing full objects instead of IDs | Reference by ID across aggregates |
| Updating multiple aggregates in one transaction | Use domain events for cross-aggregate consistency |
| Aggregate without invariants | Probably not an aggregate — simplify |

## Domain Events

Something that happened in the domain, named in past tense. Events are immutable facts.

### Naming Convention: Past tense verb

| Event | Triggered By | Consumers |
|-------|-------------|-----------|
| `OrderPlaced` | `order.place()` | Inventory, Payment, Notification |
| `PaymentReceived` | `payment.confirm()` | Order (update status), Receipt |
| `ShipmentDispatched` | `shipment.dispatch()` | Notification, Tracking |

### Internal vs Integration Events

| Type | Scope | Transport |
|------|-------|-----------|
| Internal (Domain Event) | Within bounded context | In-memory dispatcher |
| Integration Event | Across bounded contexts | Message broker (Kafka, RabbitMQ) |

### Event Sourcing (Optional Advanced Pattern)

Store the sequence of events rather than current state. Current state = replay of all events.

| Pros | Cons |
|------|------|
| Full audit trail | Complexity |
| Temporal queries | Event schema evolution |
| Easy debugging | Eventually consistent reads |

## Repositories

Provide the illusion of an in-memory collection of domain objects.

| Rule | Example |
|------|---------|
| One per Aggregate Root | `OrderRepository`, not `OrderLineRepository` |
| Domain interface, infra implementation | Interface in domain, SQL impl in infrastructure |
| Return domain objects, not DB rows | `find_by_id(id) -> Order`, not `find_by_id(id) -> Row` |
| Encapsulate query logic | `find_overdue(days=30)`, not raw SQL |

## Factories

Encapsulate complex creation logic, ensuring valid initial state.

| Type | When |
|------|------|
| Factory Method on Entity | `Order.create_from_cart(cart)` |
| Standalone Factory | Complex assembly involving multiple aggregates |
| Builder Pattern | Many optional parameters |

```
class Order:
    @staticmethod
    def create_from_quote(quote: Quote) -> 'Order':
        order = Order(id=OrderId.generate(), status=OrderStatus.DRAFT)
        for item in quote.items:
            order.add_line(item.product_id, item.quantity, item.price)
        return order
```
