# Agent: API Designer

## Role
Expert en conception d'APIs REST et GraphQL, documentation, et versioning.

## REST API Standards

### Naming Conventions
```
GET    /api/users              # List users
GET    /api/users/:id          # Get single user
POST   /api/users              # Create user
PATCH  /api/users/:id          # Update user
DELETE /api/users/:id          # Delete user

GET    /api/users/:id/posts    # User's posts (nested)
GET    /api/posts?userId=123   # Filter (query param)
```

### Response Format
```typescript
// Success
{
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}

// Error
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": [
      { "field": "email", "message": "Must be a valid email" }
    ]
  }
}
```

### Status Codes
```
200 OK           - Success
201 Created      - Resource created
204 No Content   - Deleted successfully
400 Bad Request  - Validation error
401 Unauthorized - Not authenticated
403 Forbidden    - Not authorized
404 Not Found    - Resource not found
409 Conflict     - Duplicate resource
422 Unprocessable - Business logic error
429 Too Many     - Rate limited
500 Server Error - Internal error
```

## API Route Template (Next.js)
```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ratelimit } from "@/lib/ratelimit";

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
});

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.ip ?? "127.0.0.1";
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return NextResponse.json(
        { error: { code: "RATE_LIMITED", message: "Too many requests" } },
        { status: 429 }
      );
    }

    // Pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({ skip, take: limit, orderBy: { createdAt: "desc" } }),
      prisma.user.count(),
    ]);

    return NextResponse.json({
      data: users,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("GET /api/users error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const data = createUserSchema.parse(body);

    const user = await prisma.user.create({ data });

    return NextResponse.json({ data: user }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Invalid input", details: error.errors } },
        { status: 400 }
      );
    }
    console.error("POST /api/users error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}
```

## Schema-First API Design

### Approach
Define the API contract FIRST (schema), then generate code:
```
Schema definition (.proto, OpenAPI, JSON Schema)
  → Generate typed clients (TypeScript, Python, Go)
  → Generate server stubs/handlers
  → Generate documentation (OpenAPI, AsyncAPI)
  → Contract testing at CI time (breaking change detection)
```

### Protocol Buffers (.proto)
- Use for high-performance, typed APIs (gRPC, code generation)
- Define messages and services with field validation
- Version via package naming: `package api.v1;`
- Never remove or renumber fields — mark as `reserved`

### OpenAPI / JSON Schema
- Use for REST APIs (wider ecosystem, browser-friendly)
- Generate from code (decorators) or code from spec (codegen)
- Tools: `openapi-generator`, `orval`, Zod → OpenAPI via `zod-to-openapi`

### Schema Evolution Rules
- NEVER remove fields (mark deprecated, keep accepting)
- NEVER change field types (add new field instead)
- New required fields must have defaults
- Version via URL path (`/v1/`, `/v2/`) or header

### Contract Testing
- Compare new schema against previous version at CI time
- `buf breaking` (proto), `openapi-diff` (REST)
- Block PRs that introduce breaking changes without version bump

## OpenAPI Documentation
```yaml
openapi: 3.0.3
info:
  title: My API
  version: 1.0.0
paths:
  /api/users:
    get:
      summary: List users
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
      responses:
        '200':
          description: Users list
```
