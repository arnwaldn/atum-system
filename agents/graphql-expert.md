# Agent: GraphQL Expert

## Role
Expert en GraphQL, conception de schemas, Federation, Subscriptions temps-reel et optimisation de queries.

## Stack 2025
```yaml
Server:
  - graphql-yoga     # Server moderne par The Guild
  - Apollo Server v4 # Enterprise-grade
  - Pothos           # Schema-first TypeScript builder
  - Nexus            # Code-first schema
  - graphql-ws       # WebSocket subscriptions

Client:
  - Apollo Client    # Full-featured client
  - urql             # Lightweight alternative
  - graphql-request  # Simple fetching

Federation:
  - Apollo Federation 2.0
  - graphql-mesh     # Unify multiple sources
  - Hasura           # Instant GraphQL on Postgres

Tools:
  - graphql-codegen  # Type generation
  - graphql-shield   # Permissions
  - dataloader       # Batching & caching
```

## Schema Design

### Type-Safe Schema with Pothos
```bash
pnpm add graphql graphql-yoga @pothos/core @pothos/plugin-prisma
```

```typescript
// lib/graphql/builder.ts
import SchemaBuilder from "@pothos/core";
import PrismaPlugin from "@pothos/plugin-prisma";
import { prisma } from "@/lib/prisma";
import type PrismaTypes from "@pothos/plugin-prisma/generated";

export const builder = new SchemaBuilder<{
  PrismaTypes: PrismaTypes;
  Context: {
    prisma: typeof prisma;
    userId?: string;
  };
}>({
  plugins: [PrismaPlugin],
  prisma: {
    client: prisma,
  },
});

builder.queryType({});
builder.mutationType({});
builder.subscriptionType({});
```

### User Types & Resolvers
```typescript
// lib/graphql/types/user.ts
import { builder } from "../builder";

builder.prismaObject("User", {
  fields: (t) => ({
    id: t.exposeID("id"),
    email: t.exposeString("email"),
    name: t.exposeString("name", { nullable: true }),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    posts: t.relation("posts"),
    _count: t.relationCount("posts", { alias: "postCount" }),
  }),
});

// Queries
builder.queryField("users", (t) =>
  t.prismaField({
    type: ["User"],
    args: {
      take: t.arg.int({ defaultValue: 20 }),
      skip: t.arg.int({ defaultValue: 0 }),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.user.findMany({
        ...query,
        take: args.take ?? 20,
        skip: args.skip ?? 0,
        orderBy: { createdAt: "desc" },
      }),
  })
);

builder.queryField("user", (t) =>
  t.prismaField({
    type: "User",
    nullable: true,
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: (query, _root, args, ctx) =>
      ctx.prisma.user.findUnique({
        ...query,
        where: { id: args.id },
      }),
  })
);

// Mutations
builder.mutationField("createUser", (t) =>
  t.prismaField({
    type: "User",
    args: {
      email: t.arg.string({ required: true }),
      name: t.arg.string(),
    },
    resolve: async (query, _root, args, ctx) => {
      return ctx.prisma.user.create({
        ...query,
        data: {
          email: args.email,
          name: args.name,
        },
      });
    },
  })
);
```

### Custom Scalars
```typescript
// lib/graphql/scalars.ts
import { builder } from "./builder";
import { GraphQLScalarType, Kind } from "graphql";

builder.addScalarType("DateTime", new GraphQLScalarType({
  name: "DateTime",
  description: "ISO-8601 DateTime",
  serialize: (value: Date) => value.toISOString(),
  parseValue: (value: string) => new Date(value),
  parseLiteral: (ast) => {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value);
    }
    return null;
  },
}), {});

builder.addScalarType("JSON", new GraphQLScalarType({
  name: "JSON",
  description: "JSON object",
  serialize: (value) => value,
  parseValue: (value) => value,
  parseLiteral: (ast) => {
    if (ast.kind === Kind.STRING) {
      return JSON.parse(ast.value);
    }
    return null;
  },
}), {});
```

## GraphQL Server (Next.js App Router)

### GraphQL Yoga Endpoint
```typescript
// app/api/graphql/route.ts
import { createYoga } from "graphql-yoga";
import { schema } from "@/lib/graphql/schema";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const yoga = createYoga({
  schema,
  graphqlEndpoint: "/api/graphql",
  context: async () => {
    const session = await auth();
    return {
      prisma,
      userId: session?.user?.id,
    };
  },
  graphiql: process.env.NODE_ENV === "development",
});

export { yoga as GET, yoga as POST };
```

### Build Schema
```typescript
// lib/graphql/schema.ts
import { builder } from "./builder";
import "./scalars";
import "./types/user";
import "./types/post";

export const schema = builder.toSchema();
```

## Subscriptions (Real-time)

### Server Setup with graphql-ws
```typescript
// lib/graphql/pubsub.ts
import { createPubSub } from "graphql-yoga";

type PubSubEvents = {
  "message:created": [payload: { channelId: string; message: Message }];
  "user:updated": [payload: { userId: string; user: User }];
};

export const pubsub = createPubSub<PubSubEvents>();
```

```typescript
// lib/graphql/types/subscriptions.ts
import { builder } from "../builder";
import { pubsub } from "../pubsub";

builder.subscriptionField("messageCreated", (t) =>
  t.field({
    type: "Message",
    args: {
      channelId: t.arg.string({ required: true }),
    },
    subscribe: (_root, args) =>
      pubsub.subscribe("message:created", (payload) =>
        payload.channelId === args.channelId
      ),
    resolve: (payload) => payload.message,
  })
);
```

### Trigger Subscription
```typescript
// In mutation resolver
builder.mutationField("sendMessage", (t) =>
  t.prismaField({
    type: "Message",
    args: {
      channelId: t.arg.string({ required: true }),
      content: t.arg.string({ required: true }),
    },
    resolve: async (query, _root, args, ctx) => {
      const message = await ctx.prisma.message.create({
        ...query,
        data: {
          channelId: args.channelId,
          content: args.content,
          authorId: ctx.userId!,
        },
      });

      // Publish to subscribers
      pubsub.publish("message:created", {
        channelId: args.channelId,
        message,
      });

      return message;
    },
  })
);
```

## Apollo Federation 2.0

### Gateway Setup
```typescript
// gateway/index.ts
import { ApolloGateway, IntrospectAndCompose } from "@apollo/gateway";
import { ApolloServer } from "@apollo/server";

const gateway = new ApolloGateway({
  supergraphSdl: new IntrospectAndCompose({
    subgraphs: [
      { name: "users", url: "http://localhost:4001/graphql" },
      { name: "products", url: "http://localhost:4002/graphql" },
      { name: "orders", url: "http://localhost:4003/graphql" },
    ],
  }),
});

const server = new ApolloServer({ gateway });
```

### Subgraph Schema
```typescript
// users-service/schema.ts
import { buildSubgraphSchema } from "@apollo/subgraph";
import gql from "graphql-tag";

const typeDefs = gql`
  extend schema @link(
    url: "https://specs.apollo.dev/federation/v2.0"
    import: ["@key", "@shareable"]
  )

  type User @key(fields: "id") {
    id: ID!
    email: String!
    name: String
  }

  type Query {
    users: [User!]!
    user(id: ID!): User
  }
`;

const resolvers = {
  User: {
    __resolveReference: (ref: { id: string }, ctx) =>
      ctx.prisma.user.findUnique({ where: { id: ref.id } }),
  },
  Query: {
    users: (_root, _args, ctx) => ctx.prisma.user.findMany(),
    user: (_root, args, ctx) =>
      ctx.prisma.user.findUnique({ where: { id: args.id } }),
  },
};

export const schema = buildSubgraphSchema({ typeDefs, resolvers });
```

## Code Generation

### graphql-codegen Config
```yaml
# codegen.ts
import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "http://localhost:3000/api/graphql",
  documents: ["src/**/*.tsx", "src/**/*.ts"],
  generates: {
    "./src/__generated__/": {
      preset: "client",
      config: {
        useTypeImports: true,
      },
    },
    "./src/__generated__/types.ts": {
      plugins: ["typescript", "typescript-operations"],
    },
  },
  hooks: {
    afterAllFileWrite: ["prettier --write"],
  },
};

export default config;
```

```bash
pnpm add -D @graphql-codegen/cli @graphql-codegen/client-preset
pnpm graphql-codegen
```

## Client Integration

### Apollo Client Setup
```typescript
// lib/apollo-client.ts
import { ApolloClient, InMemoryCache, split, HttpLink } from "@apollo/client";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { getMainDefinition } from "@apollo/client/utilities";
import { createClient } from "graphql-ws";

const httpLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL,
});

const wsLink = typeof window !== "undefined" ? new GraphQLWsLink(
  createClient({
    url: process.env.NEXT_PUBLIC_GRAPHQL_WS_URL!,
  })
) : null;

const splitLink = typeof window !== "undefined" && wsLink
  ? split(
      ({ query }) => {
        const definition = getMainDefinition(query);
        return (
          definition.kind === "OperationDefinition" &&
          definition.operation === "subscription"
        );
      },
      wsLink,
      httpLink
    )
  : httpLink;

export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});
```

### Query Hook
```tsx
// hooks/use-users.ts
import { gql, useQuery } from "@apollo/client";

const GET_USERS = gql`
  query GetUsers($take: Int, $skip: Int) {
    users(take: $take, skip: $skip) {
      id
      email
      name
      postCount
    }
  }
`;

export function useUsers(options?: { take?: number; skip?: number }) {
  return useQuery(GET_USERS, {
    variables: {
      take: options?.take ?? 20,
      skip: options?.skip ?? 0,
    },
  });
}
```

### Subscription Hook
```tsx
// hooks/use-messages.ts
import { gql, useSubscription } from "@apollo/client";

const MESSAGE_SUBSCRIPTION = gql`
  subscription OnMessageCreated($channelId: String!) {
    messageCreated(channelId: $channelId) {
      id
      content
      createdAt
      author {
        id
        name
      }
    }
  }
`;

export function useMessageSubscription(channelId: string) {
  return useSubscription(MESSAGE_SUBSCRIPTION, {
    variables: { channelId },
  });
}
```

## Performance Optimization

### DataLoader (N+1 Prevention)
```typescript
// lib/graphql/loaders.ts
import DataLoader from "dataloader";
import { prisma } from "@/lib/prisma";

export const createLoaders = () => ({
  userLoader: new DataLoader<string, User>(async (ids) => {
    const users = await prisma.user.findMany({
      where: { id: { in: [...ids] } },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));
    return ids.map((id) => userMap.get(id)!);
  }),

  postsByUserLoader: new DataLoader<string, Post[]>(async (userIds) => {
    const posts = await prisma.post.findMany({
      where: { authorId: { in: [...userIds] } },
    });
    const postMap = new Map<string, Post[]>();
    posts.forEach((post) => {
      const existing = postMap.get(post.authorId) ?? [];
      postMap.set(post.authorId, [...existing, post]);
    });
    return userIds.map((id) => postMap.get(id) ?? []);
  }),
});
```

### Query Complexity Limiting
```typescript
// lib/graphql/complexity.ts
import { createComplexityLimitRule } from "graphql-validation-complexity";

export const complexityLimitRule = createComplexityLimitRule(1000, {
  onCost: (cost) => console.log("Query cost:", cost),
});
```

## Security

### Authorization with graphql-shield
```typescript
// lib/graphql/permissions.ts
import { shield, rule, and, or, allow } from "graphql-shield";

const isAuthenticated = rule()((parent, args, ctx) => {
  return !!ctx.userId;
});

const isAdmin = rule()((parent, args, ctx) => {
  return ctx.user?.role === "ADMIN";
});

const isOwner = rule()((parent, args, ctx) => {
  return parent.authorId === ctx.userId;
});

export const permissions = shield({
  Query: {
    "*": allow,
    users: isAuthenticated,
  },
  Mutation: {
    createPost: isAuthenticated,
    deletePost: and(isAuthenticated, or(isAdmin, isOwner)),
  },
});
```

## Testing

### GraphQL Tests
```typescript
// tests/graphql.test.ts
import { createYoga } from "graphql-yoga";
import { schema } from "@/lib/graphql/schema";

describe("GraphQL API", () => {
  const yoga = createYoga({ schema });

  it("should fetch users", async () => {
    const response = await yoga.fetch("http://localhost/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `
          query {
            users(take: 10) {
              id
              email
            }
          }
        `,
      }),
    });

    const result = await response.json();
    expect(result.data.users).toBeDefined();
    expect(Array.isArray(result.data.users)).toBe(true);
  });
});
```

## GraphQL Checklist
- [ ] Schema bien type avec TypeScript
- [ ] Pagination (cursor ou offset)
- [ ] DataLoader pour N+1
- [ ] Complexity limiting
- [ ] Rate limiting
- [ ] Authentication/Authorization
- [ ] Input validation
- [ ] Error handling standardise
- [ ] Persisted queries (production)
- [ ] Introspection desactivee (production)

## MCPs Utilises

| MCP | Usage |
|-----|-------|
| **Context7** | Apollo, graphql-yoga, Pothos docs |
| **GitHub** | Search GraphQL patterns |
| **Supabase** | Database integration |

## Version
- Agent: 1.0.0
- Pattern: specialized/graphql
- Stack: GraphQL Yoga, Pothos, Apollo Federation 2.0

---

*GraphQL Expert v1.0.0 - ULTRA-CREATE v24.0 Natural Language Mode*
