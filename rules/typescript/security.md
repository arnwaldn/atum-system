---
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
  - "**/*.jsx"
---
# TypeScript/JavaScript Security

> Extends [common/security.md](../common/security.md) with TS/JS specifics.

## Secret Management

Use environment variables. Validate at startup:
```typescript
const apiKey = process.env.API_KEY;
if (!apiKey) throw new Error('API_KEY not configured');
```

NEVER hardcode secrets. The `secret-scanner` hook will block commits with leaked keys.

## XSS Prevention

React escapes JSX by default — `{userInput}` in JSX is safe.
NEVER inject raw HTML into the DOM. If absolutely necessary, sanitize with DOMPurify first.
Avoid React's raw HTML injection prop entirely when possible.

## Input Validation

Use **zod** for all API input validation:
```typescript
import { z } from 'zod';

const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  age: z.number().int().positive().optional(),
});

// In route handler
const result = CreateUserSchema.safeParse(req.body);
if (!result.success) return res.status(400).json({ error: result.error });
```

## Authentication Patterns

- Store tokens in **httpOnly** cookies (not localStorage)
- Use **SameSite=Strict** or **Lax** for CSRF protection
- Verify JWT signature on every request server-side
- Set short token expiry, use refresh token rotation

## CSP Headers (Next.js)

```typescript
// next.config.ts
const securityHeaders = [
  { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self'" },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
];
```

## Dependency Security

- Run `npm audit` before deployment
- Keep dependencies updated
- Never use dynamic code execution with user input

## Agent Support

- Use **security-reviewer** skill for comprehensive security audits
