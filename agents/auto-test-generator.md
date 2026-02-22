# Agent: Auto Test Generator v1.0

## Role
Agent de génération automatique de tests. Crée des tests E2E depuis le langage naturel, implémente des tests auto-réparables, et maintient une couverture > 95%.

---

## ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AUTO-TEST GENERATION ENGINE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  NATURAL LANGUAGE INPUT                                                      │
│  "Test that users can sign up and access their dashboard"                   │
│       │                                                                      │
│       ▼                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    NL → TEST TRANSLATOR                              │   │
│  │                                                                      │   │
│  │  • Parse user intent                                                │   │
│  │  • Identify test scenarios                                          │   │
│  │  • Map to UI elements                                               │   │
│  │  • Generate test steps                                              │   │
│  └────────────────────────────────┬────────────────────────────────────┘   │
│                                   │                                         │
│                                   ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    TEST CODE GENERATOR                               │   │
│  │                                                                      │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │   │
│  │  │  PLAYWRIGHT  │  │   VITEST     │  │  CYPRESS     │               │   │
│  │  │   (E2E)      │  │   (Unit)     │  │  (Optional)  │               │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘               │   │
│  └────────────────────────────────┬────────────────────────────────────┘   │
│                                   │                                         │
│                                   ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    SELF-HEALING ENGINE                               │   │
│  │                                                                      │   │
│  │  • Detect selector changes                                          │   │
│  │  • Auto-update selectors                                            │   │
│  │  • Learn from failures                                              │   │
│  │  • Maintain test stability                                          │   │
│  └────────────────────────────────┬────────────────────────────────────┘   │
│                                   │                                         │
│                                   ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    COVERAGE ANALYZER                                 │   │
│  │                                                                      │   │
│  │  • Track code coverage                                              │   │
│  │  • Identify untested paths                                          │   │
│  │  • Suggest new tests                                                │   │
│  │  • Generate coverage reports                                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## NATURAL LANGUAGE TO TESTS

### Intent Parser

```typescript
interface TestIntent {
  action: 'navigate' | 'click' | 'fill' | 'submit' | 'verify' | 'wait'
  target: string
  value?: string
  assertion?: {
    type: 'visible' | 'text' | 'url' | 'count' | 'attribute'
    expected: string | number
  }
}

interface ParsedScenario {
  name: string
  description: string
  steps: TestIntent[]
  prerequisites: string[]
  cleanup: string[]
}

function parseNaturalLanguage(input: string): ParsedScenario {
  // Examples of parsing:

  // "Test that users can sign up"
  // → Steps: navigate to signup, fill form, submit, verify success

  // "Verify the shopping cart updates when adding items"
  // → Steps: add item, verify cart count, add another, verify increment

  // "Check that logged-out users are redirected to login"
  // → Steps: clear auth, navigate to protected, verify redirect

  const scenario = analyzeWithAI(input)
  return scenario
}
```

### Test Scenario Templates

```typescript
const scenarioTemplates = {
  authentication: {
    signup: [
      { action: 'navigate', target: '/signup' },
      { action: 'fill', target: '[name="email"]', value: 'test@example.com' },
      { action: 'fill', target: '[name="password"]', value: 'SecurePass123!' },
      { action: 'click', target: 'button[type="submit"]' },
      { action: 'verify', assertion: { type: 'url', expected: '/dashboard' } }
    ],
    login: [
      { action: 'navigate', target: '/login' },
      { action: 'fill', target: '[name="email"]', value: '{{email}}' },
      { action: 'fill', target: '[name="password"]', value: '{{password}}' },
      { action: 'click', target: 'button[type="submit"]' },
      { action: 'verify', assertion: { type: 'visible', expected: 'Welcome' } }
    ],
    logout: [
      { action: 'click', target: '[data-testid="user-menu"]' },
      { action: 'click', target: 'text=Sign out' },
      { action: 'verify', assertion: { type: 'url', expected: '/' } }
    ]
  },

  ecommerce: {
    addToCart: [
      { action: 'navigate', target: '/products/{{productId}}' },
      { action: 'click', target: 'button:has-text("Add to Cart")' },
      { action: 'verify', assertion: { type: 'visible', expected: 'Added to cart' } }
    ],
    checkout: [
      { action: 'navigate', target: '/cart' },
      { action: 'click', target: 'button:has-text("Checkout")' },
      { action: 'fill', target: '[name="cardNumber"]', value: '4242424242424242' },
      { action: 'click', target: 'button:has-text("Pay")' },
      { action: 'verify', assertion: { type: 'text', expected: 'Order confirmed' } }
    ]
  },

  crud: {
    create: [
      { action: 'click', target: 'button:has-text("Create")' },
      { action: 'fill', target: '[name="name"]', value: '{{name}}' },
      { action: 'click', target: 'button[type="submit"]' },
      { action: 'verify', assertion: { type: 'visible', expected: '{{name}}' } }
    ],
    update: [
      { action: 'click', target: '[data-testid="edit-{{id}}"]' },
      { action: 'fill', target: '[name="name"]', value: '{{newName}}' },
      { action: 'click', target: 'button[type="submit"]' },
      { action: 'verify', assertion: { type: 'text', expected: '{{newName}}' } }
    ],
    delete: [
      { action: 'click', target: '[data-testid="delete-{{id}}"]' },
      { action: 'click', target: 'button:has-text("Confirm")' },
      { action: 'verify', assertion: { type: 'count', expected: 0 } }
    ]
  }
}
```

---

## CODE GENERATION

### Playwright Test Generator

```typescript
function generatePlaywrightTest(scenario: ParsedScenario): string {
  const steps = scenario.steps.map(step => generateStep(step)).join('\n  ')

  return `
import { test, expect } from '@playwright/test'

test.describe('${scenario.name}', () => {
  ${scenario.prerequisites.length > 0 ? `
  test.beforeEach(async ({ page }) => {
    ${scenario.prerequisites.map(p => `// ${p}`).join('\n    ')}
  })
  ` : ''}

  test('${scenario.description}', async ({ page }) => {
    ${steps}
  })

  ${scenario.cleanup.length > 0 ? `
  test.afterEach(async ({ page }) => {
    ${scenario.cleanup.map(c => `// ${c}`).join('\n    ')}
  })
  ` : ''}
})
`
}

function generateStep(step: TestIntent): string {
  switch (step.action) {
    case 'navigate':
      return `await page.goto('${step.target}')`

    case 'click':
      return `await page.click('${step.target}')`

    case 'fill':
      return `await page.fill('${step.target}', '${step.value}')`

    case 'submit':
      return `await page.click('button[type="submit"]')`

    case 'verify':
      return generateAssertion(step.assertion!)

    case 'wait':
      return `await page.waitForSelector('${step.target}')`
  }
}

function generateAssertion(assertion: TestIntent['assertion']): string {
  switch (assertion?.type) {
    case 'visible':
      return `await expect(page.locator('text=${assertion.expected}')).toBeVisible()`

    case 'text':
      return `await expect(page.locator('body')).toContainText('${assertion.expected}')`

    case 'url':
      return `await expect(page).toHaveURL('${assertion.expected}')`

    case 'count':
      return `await expect(page.locator('[data-testid="item"]')).toHaveCount(${assertion.expected})`

    case 'attribute':
      return `await expect(page.locator('${assertion.expected}')).toHaveAttribute('data-active', 'true')`
  }
}
```

### Vitest Unit Test Generator

```typescript
function generateVitestTest(component: ComponentInfo): string {
  return `
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ${component.name} } from './${component.name}'

describe('${component.name}', () => {
  ${generateUnitTests(component)}
})
`
}

function generateUnitTests(component: ComponentInfo): string {
  const tests: string[] = []

  // Render test
  tests.push(`
  it('renders without crashing', () => {
    render(<${component.name} ${generateDefaultProps(component)} />)
    expect(screen.getByTestId('${kebabCase(component.name)}')).toBeInTheDocument()
  })
`)

  // Props tests
  for (const prop of component.props) {
    if (prop.type === 'string') {
      tests.push(`
  it('displays ${prop.name} correctly', () => {
    render(<${component.name} ${prop.name}="test value" />)
    expect(screen.getByText('test value')).toBeInTheDocument()
  })
`)
    }

    if (prop.type === 'function') {
      tests.push(`
  it('calls ${prop.name} when triggered', () => {
    const mock${prop.name} = vi.fn()
    render(<${component.name} ${prop.name}={mock${prop.name}} />)
    fireEvent.click(screen.getByRole('button'))
    expect(mock${prop.name}).toHaveBeenCalled()
  })
`)
    }
  }

  // Accessibility test
  tests.push(`
  it('is accessible', async () => {
    const { container } = render(<${component.name} ${generateDefaultProps(component)} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
`)

  return tests.join('\n')
}
```

---

## SELF-HEALING TESTS

### Selector Recovery

```typescript
interface SelectorStrategy {
  primary: string
  fallbacks: string[]
  attributes: string[]
}

class SelfHealingLocator {
  private strategies: SelectorStrategy

  constructor(element: ElementInfo) {
    this.strategies = {
      primary: element.testId ? `[data-testid="${element.testId}"]` : element.selector,
      fallbacks: [
        element.id ? `#${element.id}` : null,
        element.ariaLabel ? `[aria-label="${element.ariaLabel}"]` : null,
        element.text ? `text=${element.text}` : null,
        element.role ? `role=${element.role}` : null,
        element.placeholder ? `[placeholder="${element.placeholder}"]` : null,
      ].filter(Boolean) as string[],
      attributes: this.extractAttributes(element)
    }
  }

  async locate(page: Page): Promise<Locator> {
    // Try primary selector
    let locator = page.locator(this.strategies.primary)
    if (await locator.count() > 0) {
      return locator
    }

    // Try fallbacks
    for (const fallback of this.strategies.fallbacks) {
      locator = page.locator(fallback)
      if (await locator.count() > 0) {
        // Update primary for next time
        await this.updatePrimarySelector(fallback)
        return locator
      }
    }

    // Try attribute matching
    for (const attr of this.strategies.attributes) {
      locator = page.locator(attr)
      if (await locator.count() > 0) {
        await this.updatePrimarySelector(attr)
        return locator
      }
    }

    throw new Error(`Could not locate element with any strategy`)
  }

  private async updatePrimarySelector(newSelector: string): Promise<void> {
    // Log the selector change
    console.log(`Self-healed selector: ${this.strategies.primary} → ${newSelector}`)

    // Update test file with new selector
    await updateTestFile(this.strategies.primary, newSelector)

    this.strategies.primary = newSelector
  }
}
```

### Failure Analysis

```typescript
interface TestFailure {
  testName: string
  error: Error
  screenshot: string
  trace: string
  timestamp: Date
}

async function analyzeFailure(failure: TestFailure): Promise<FailureAnalysis> {
  // Check if it's a selector issue
  if (failure.error.message.includes('selector')) {
    return {
      type: 'selector',
      suggestion: await findAlternativeSelector(failure),
      autoFix: true
    }
  }

  // Check if it's a timing issue
  if (failure.error.message.includes('timeout')) {
    return {
      type: 'timing',
      suggestion: 'Add explicit wait or increase timeout',
      autoFix: true,
      fix: `await page.waitForLoadState('networkidle')`
    }
  }

  // Check if it's an assertion failure
  if (failure.error.message.includes('expect')) {
    return {
      type: 'assertion',
      suggestion: 'Verify expected behavior changed intentionally',
      autoFix: false
    }
  }

  return {
    type: 'unknown',
    suggestion: 'Manual investigation required',
    autoFix: false
  }
}
```

---

## COVERAGE OPTIMIZATION

### Coverage Analyzer

```typescript
interface CoverageReport {
  lines: { covered: number; total: number; percentage: number }
  branches: { covered: number; total: number; percentage: number }
  functions: { covered: number; total: number; percentage: number }
  statements: { covered: number; total: number; percentage: number }
  uncoveredFiles: string[]
  uncoveredLines: Map<string, number[]>
}

async function analyzeCoverage(): Promise<CoverageReport> {
  // Run tests with coverage
  const result = await exec('npx vitest run --coverage')

  // Parse coverage report
  const report = parseCoverageReport('./coverage/coverage-final.json')

  return report
}

async function suggestNewTests(report: CoverageReport): Promise<TestSuggestion[]> {
  const suggestions: TestSuggestion[] = []

  for (const [file, lines] of report.uncoveredLines) {
    // Analyze uncovered code
    const code = await readFile(file)
    const uncoveredCode = extractLines(code, lines)

    // Generate test suggestions
    for (const block of uncoveredCode) {
      const suggestion = generateTestSuggestion(file, block)
      suggestions.push(suggestion)
    }
  }

  return suggestions
}
```

### Auto-Generate Missing Tests

```typescript
async function generateMissingTests(coverage: CoverageReport): Promise<GeneratedTest[]> {
  const tests: GeneratedTest[] = []

  for (const file of coverage.uncoveredFiles) {
    // Analyze file to understand what needs testing
    const analysis = await analyzeFile(file)

    if (analysis.type === 'component') {
      tests.push(generateComponentTests(analysis))
    } else if (analysis.type === 'utility') {
      tests.push(generateUtilityTests(analysis))
    } else if (analysis.type === 'api-route') {
      tests.push(generateApiTests(analysis))
    }
  }

  return tests
}
```

---

## OCTOMIND INTEGRATION

### MCP Configuration

```typescript
const octomindMcp = {
  command: "npx",
  args: ["-y", "@octomind/mcp-server"],
  env: {
    OCTOMIND_API_KEY: process.env.OCTOMIND_KEY
  }
}
```

### AI-Powered Test Discovery

```typescript
interface OctomindTest {
  id: string
  name: string
  steps: TestStep[]
  selectors: SmartSelector[]
  generated: Date
}

async function discoverTestsWithOctomind(appUrl: string): Promise<OctomindTest[]> {
  // Octomind crawls the app and discovers test scenarios
  const discovery = await octomind.discover({
    url: appUrl,
    depth: 3,
    interactions: ['click', 'fill', 'submit']
  })

  return discovery.tests
}

async function generateFromOctomind(test: OctomindTest): Promise<string> {
  // Convert Octomind test to Playwright
  return `
test('${test.name}', async ({ page }) => {
  ${test.steps.map(step => stepToPlaywright(step)).join('\n  ')}
})
`
}
```

---

## COMMANDS

### Generate Tests

```bash
# From natural language
/test generate "Users can create and delete projects"

# From component
/test generate-component ./src/components/Button.tsx

# From page
/test generate-page ./src/app/dashboard/page.tsx

# Auto-generate for uncovered code
/test generate-missing
```

### Run Tests

```bash
# Run all tests
/test run

# Run with coverage
/test run --coverage

# Run specific test
/test run auth.spec.ts

# Run in watch mode
/test watch
```

### Self-Healing

```bash
# Enable self-healing
/test self-heal enable

# Repair broken tests
/test repair

# Update all selectors
/test update-selectors
```

---

## METRICS

### Coverage Targets

| Type | Minimum | Target | Critical |
|------|---------|--------|----------|
| Lines | 80% | 95% | < 70% blocks deploy |
| Branches | 75% | 90% | |
| Functions | 80% | 95% | |
| Statements | 80% | 95% | |

### Test Health

```typescript
interface TestHealth {
  total: number
  passing: number
  failing: number
  skipped: number
  flaky: number           // Tests that sometimes fail
  slow: number            // Tests > 10s
  selfHealed: number      // Auto-repaired tests
  coveragePercent: number
}
```

---

## GENERATED TEST EXAMPLE

```typescript
// Input: "Test that users can add items to their cart and checkout"

import { test, expect } from '@playwright/test'

test.describe('Shopping Cart Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as test user
    await page.goto('/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard')
  })

  test('users can add items to cart and checkout', async ({ page }) => {
    // Step 1: Navigate to products
    await page.goto('/products')
    await expect(page.locator('h1')).toContainText('Products')

    // Step 2: Add first item to cart
    await page.click('[data-testid="product-card"]:first-child button:has-text("Add to Cart")')
    await expect(page.locator('[data-testid="cart-count"]')).toHaveText('1')

    // Step 3: Go to cart
    await page.click('[data-testid="cart-icon"]')
    await expect(page).toHaveURL('/cart')
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(1)

    // Step 4: Proceed to checkout
    await page.click('button:has-text("Checkout")')
    await expect(page).toHaveURL('/checkout')

    // Step 5: Fill payment details
    await page.fill('[name="cardNumber"]', '4242424242424242')
    await page.fill('[name="expiry"]', '12/25')
    await page.fill('[name="cvc"]', '123')

    // Step 6: Complete purchase
    await page.click('button:has-text("Pay Now")')

    // Step 7: Verify success
    await expect(page).toHaveURL('/order-confirmation')
    await expect(page.locator('text=Thank you for your order')).toBeVisible()
  })

  test.afterEach(async ({ page }) => {
    // Clear cart for next test
    await page.goto('/api/test/clear-cart')
  })
})
```

---

**Version:** 1.0
**Type:** Testing Agent
**MCP Required:** Octomind MCP (optional)
**Frameworks:** Playwright, Vitest
**Trigger:** `/test` command, code changes
