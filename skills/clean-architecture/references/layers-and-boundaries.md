# Layers and Boundaries

## The Four Concentric Circles

From innermost to outermost:

### 1. Entities (Enterprise Business Rules)

The most general, highest-level rules. They encapsulate enterprise-wide critical business rules.

| Principle | Implementation |
|-----------|---------------|
| No framework dependencies | Entity classes are plain objects (POJO, dataclass, struct) |
| Encapsulate business rules | `Order.calculateTotal()`, `Policy.isEligible()` |
| Identity-based (if entity) | Identified by ID, not by attribute equality |
| Immutable value objects | `Money(amount, currency)` — replace, never mutate |

```
# Example: Entity
class Order:
    id: OrderId
    lines: list[OrderLine]
    status: OrderStatus

    def calculate_total(self) -> Money:
        return sum(line.subtotal for line in self.lines)

    def can_be_cancelled(self) -> bool:
        return self.status in (OrderStatus.PENDING, OrderStatus.CONFIRMED)
```

### 2. Use Cases (Application Business Rules)

Contain application-specific business rules. Orchestrate the flow of data to and from Entities.

| Principle | Implementation |
|-----------|---------------|
| One use case per operation | `PlaceOrder`, `CancelOrder`, `RefundOrder` |
| Input/Output ports | `CreateOrderInput` / `CreateOrderOutput` DTOs |
| Orchestrate entities | Use case calls entity methods, never contains business logic |
| No framework imports | No HTTP, no ORM, no framework classes |

```
# Example: Use Case (Interactor)
class PlaceOrderUseCase:
    def __init__(self, order_repo: OrderRepository, payment: PaymentGateway):
        self.order_repo = order_repo
        self.payment = payment

    def execute(self, input: PlaceOrderInput) -> PlaceOrderOutput:
        order = Order.create_from(input.items)
        self.payment.charge(order.total)
        self.order_repo.save(order)
        return PlaceOrderOutput(order_id=order.id)
```

### 3. Interface Adapters

Convert data between the format most convenient for Use Cases and the format most convenient for external agencies (DB, web, etc.).

| Adapter Type | Role | Example |
|-------------|------|---------|
| Controller | HTTP → Use Case Input | `OrderController.create(req)` calls `PlaceOrderUseCase` |
| Presenter | Use Case Output → View Model | Formats dates, currencies for display |
| Gateway | Repository impl with specific DB | `SqlOrderRepository` implements `OrderRepository` |
| Mapper | Entity ↔ DB model | `OrderMapper.toEntity(row)`, `OrderMapper.toRow(order)` |

### 4. Frameworks and Drivers

The outermost layer. Glue code that connects the system to the outside world.

| Component | Examples |
|-----------|---------|
| Web framework | Express, FastAPI, Spring Boot |
| Database driver | PostgreSQL, MongoDB, Redis clients |
| External APIs | Stripe SDK, SendGrid, AWS SDK |
| UI framework | React, Vue, Angular |

## Data Crossing Boundaries

**Critical rule**: Data that crosses a boundary must be in a form convenient for the inner circle.

| Crossing | Correct | Wrong |
|----------|---------|-------|
| Controller → Use Case | Plain DTO / Input object | HTTP Request object |
| Use Case → Repository | Domain Entity | ORM Model |
| Repository → Use Case | Domain Entity | Database Row |
| Use Case → Presenter | Output DTO | Domain Entity with internal state |

## Humble Object Pattern

Split hard-to-test code from easy-to-test code at boundaries:

| Hard to Test (Humble) | Easy to Test (Logic) |
|------------------------|---------------------|
| Database queries | Query builder / specification |
| HTTP request handling | Input validation + business logic |
| UI rendering | View model preparation |
| File system I/O | Data transformation logic |

The Humble Object contains minimal logic — just enough to call the testable part and pass results to the infrastructure.

## Composition Root (Main)

The `main` component lives in the outermost circle and is the **only** place where concrete implementations are wired together:

```
# main.py — Composition Root
db = PostgresConnection(config.db_url)
order_repo = SqlOrderRepository(db)
payment = StripePaymentGateway(config.stripe_key)
place_order = PlaceOrderUseCase(order_repo, payment)
controller = OrderController(place_order)
app.route("/orders", controller.create)
```

All dependency arrows point inward from this wiring point.
