# Monorepo Patterns

## Supported Tools
- **Turborepo**: Task orchestration, caching, remote cache
- **Nx**: Task graph, affected commands, plugins
- **pnpm workspaces**: Package management, hoisting
- **npm/yarn workspaces**: Package management

## Structure
```
monorepo/
  apps/
    web/          # Next.js frontend
    mobile/       # React Native / Expo
    api/          # Backend service
  packages/
    ui/           # Shared component library
    config/       # Shared ESLint, TS configs
    types/        # Shared TypeScript types
    utils/        # Shared utilities
  turbo.json      # Turborepo pipeline config
  pnpm-workspace.yaml
  package.json    # Root scripts, devDependencies
```

## Key Principles
- Shared dependencies at root level
- Package-specific dependencies in each package
- Internal packages use `workspace:*` protocol
- TypeScript project references for type checking

## Task Orchestration
- Define dependency graph in `turbo.json` or `nx.json`
- Cache build outputs (local + remote)
- Run only affected tasks: `turbo run test --filter=...[HEAD^]`
- Parallel execution for independent tasks

## Dependency Management
- Avoid version conflicts: single version policy
- Use `pnpm` for strict hoisting and disk efficiency
- Internal packages: `"@myorg/ui": "workspace:*"`
- Shared configs: extend from `packages/config/`

## CI/CD
- Cache `node_modules` and build outputs
- Use `--filter` to build/test only affected packages
- Deploy apps independently (not all at once)
- Version independently or use changesets
