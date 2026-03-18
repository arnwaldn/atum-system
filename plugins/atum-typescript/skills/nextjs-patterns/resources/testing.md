---
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
  - "**/*.jsx"
---
# TypeScript/JavaScript Testing

> Extends [common/testing.md](../common/testing.md) with TS/JS specifics.

## Framework Detection

Prefer **Vitest** for new projects (faster, native ESM, Vite-aligned).
Use **Jest** when already configured in the project.

Check `vitest.config.ts` or `jest.config.ts` to determine which.

## Unit Test Patterns

```typescript
describe('ModuleName', () => {
  it('should handle the expected case', () => {
    // Arrange
    const input = createTestInput();

    // Act
    const result = processInput(input);

    // Assert
    expect(result).toEqual(expectedOutput);
  });

  it('should throw on invalid input', () => {
    expect(() => processInput(null)).toThrow('Input required');
  });
});
```

Use `toEqual` for deep object comparison, `toBe` for primitives/references.

## Mocking

```typescript
// Module mock
vi.mock('./database', () => ({
  query: vi.fn().mockResolvedValue([{ id: 1 }]),
}));

// Spy on existing method
const spy = vi.spyOn(service, 'save');
spy.mockResolvedValue({ success: true });

// Restore after test
afterEach(() => vi.restoreAllMocks());
```

NEVER mock what you don't own — wrap external APIs behind your own interface and mock that.

## React Testing Library

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

it('submits the form', async () => {
  const onSubmit = vi.fn();
  render(<LoginForm onSubmit={onSubmit} />);

  await userEvent.type(screen.getByLabelText('Email'), 'test@test.com');
  await userEvent.click(screen.getByRole('button', { name: /submit/i }));

  expect(onSubmit).toHaveBeenCalledWith({ email: 'test@test.com' });
});
```

Query priority: `getByRole` > `getByLabelText` > `getByText` > `getByTestId`.

## API Integration Tests

```typescript
import request from 'supertest';

it('GET /api/users returns 200', async () => {
  const res = await request(app).get('/api/users');
  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty('data');
});
```

## Coverage

Run: `npx vitest --coverage` or `npx jest --coverage`
Minimum threshold: 80% (lines, branches, functions).

## E2E Testing

Use **Playwright** for critical user flows. See **e2e-runner** agent.

## Agent Support

- **tdd-guide** — Test-driven development workflow
- **e2e-runner** — Playwright E2E testing specialist
