---
description: Test-Driven Development workflow (user)
---

# /tdd - Test-Driven Development

## USAGE
```
/tdd "function calculateTotal with discounts"
/tdd "UserService.createUser method"
/tdd feature "shopping cart"
```

## DESCRIPTION
Workflow TDD strict: Red → Green → Refactor

## CYCLE TDD

```
┌──────────────────────────────────────┐
│           1. RED                     │
│   Ecrire test qui ECHOUE            │
└──────────────────┬───────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│           2. GREEN                   │
│   Code MINIMAL pour passer          │
└──────────────────┬───────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│           3. REFACTOR                │
│   Ameliorer sans casser tests       │
└──────────────────┬───────────────────┘
                   │
                   └──────→ Repeat
```

## WORKFLOW

### Phase 1: RED
```typescript
// Ecrire le test AVANT le code
describe('calculateTotal', () => {
  it('applies percentage discount', () => {
    const items = [{ price: 100, qty: 2 }]
    const discount = { type: 'percent', value: 10 }

    const total = calculateTotal(items, discount)

    expect(total).toBe(180) // 200 - 10%
  })
})
```

```bash
npm test  # DOIT ECHOUER (fonction n'existe pas)
```

### Phase 2: GREEN
```typescript
// Code MINIMAL pour passer
function calculateTotal(items, discount) {
  const subtotal = items.reduce((sum, item) =>
    sum + item.price * item.qty, 0
  )

  if (discount?.type === 'percent') {
    return subtotal * (1 - discount.value / 100)
  }

  return subtotal
}
```

```bash
npm test  # DOIT PASSER
```

### Phase 3: REFACTOR
```typescript
// Ameliorer le code
interface Item { price: number; qty: number }
interface Discount { type: 'percent' | 'fixed'; value: number }

function calculateTotal(items: Item[], discount?: Discount): number {
  const subtotal = items.reduce((sum, { price, qty }) =>
    sum + price * qty, 0
  )

  if (!discount) return subtotal

  return discount.type === 'percent'
    ? subtotal * (1 - discount.value / 100)
    : subtotal - discount.value
}
```

```bash
npm test  # DOIT TOUJOURS PASSER
```

## MODES

### default
TDD pour une fonction/methode
```
/tdd "validateEmail function"
```

### feature
TDD pour feature complete
```
/tdd feature "user authentication"
```
Output: Multiple cycles TDD

### kata
Exercice TDD (practice)
```
/tdd kata "fizzbuzz"
```

## REGLES TDD

1. **Pas de code prod sans test qui echoue**
2. **Ecrire juste assez de test pour echouer**
3. **Ecrire juste assez de code pour passer**
4. **Refactor uniquement si tests verts**

## EXEMPLE COMPLET

```
/tdd "ShoppingCart with add, remove, total"
```

Output:
```typescript
// 1. RED: Test add
it('adds item to cart', () => {
  const cart = new ShoppingCart()
  cart.add({ id: 1, name: 'Book', price: 20 })
  expect(cart.items).toHaveLength(1)
})

// 2. GREEN: Implementation minimale
class ShoppingCart {
  items = []
  add(item) { this.items.push(item) }
}

// 3. REFACTOR: Types + validation
// ... puis cycle suivant pour remove, total, etc.
```

## OPTIONS
| Option | Description |
|--------|-------------|
| --strict | Forcer cycle strict |
| --verbose | Afficher chaque etape |
| --pairs | Pair programming style |
