---
description: Migration framework/version (user)
---

# /migrate - Framework & Version Migration

## USAGE
```
/migrate next14-to-15
/migrate react18-to-19
/migrate tailwind3-to-4
/migrate codebase "old-pattern" "new-pattern"
```

## MIGRATIONS SUPPORTEES

### Next.js
```
/migrate next14-to-15
```
- App Router changes
- Server Actions updates
- Turbopack config
- New hooks

### React
```
/migrate react18-to-19
```
- Concurrent features
- New hooks (use, useOptimistic)
- Server Components

### Tailwind
```
/migrate tailwind3-to-4
```
- Config to CSS
- New utilities
- Breaking changes

### Custom
```
/migrate codebase "require(" "import"
```

## WORKFLOW

### 1. Analyse pre-migration
```javascript
// Scanner le codebase
Glob('**/*.{ts,tsx,js,jsx}')

// Identifier patterns a migrer
patterns_found:
  - pattern: "getServerSideProps"
    files: [list]
    count: 15
  - pattern: "pages/"
    files: [list]
    count: 20
```

### 2. Plan migration
```yaml
migration_plan:
  source: Next.js 14
  target: Next.js 15

  breaking_changes:
    - change: "Dynamic APIs now async"
      affected: 10 files
      migration: "Add await to cookies(), headers()"

    - change: "fetch() caching default"
      affected: 5 files
      migration: "Add cache: 'force-cache' explicit"

  steps:
    1. Update package.json
    2. Run npm install
    3. Fix breaking changes
    4. Test
    5. Update config
```

### 3. Execution par etapes
```bash
# 1. Dependencies
npm install next@15 react@19 react-dom@19

# 2. Fixes automatiques
npx @next/codemod@latest upgrade
```

### 4. Fixes manuels
Pour chaque breaking change:
```typescript
// AVANT
export async function Page() {
  const cookieStore = cookies()
  const theme = cookieStore.get('theme')
}

// APRES
export async function Page() {
  const cookieStore = await cookies()
  const theme = cookieStore.get('theme')
}
```

### 5. Verification
```bash
npm run build
npm test
```

## OPTIONS
| Option | Description |
|--------|-------------|
| --dry-run | Preview sans modifier |
| --interactive | Confirmer chaque change |
| --backup | Backup avant migration |
| --rollback | Annuler migration |

## MIGRATIONS COMMUNES

| Migration | Commande |
|-----------|----------|
| Next 14→15 | `/migrate next14-to-15` |
| React 18→19 | `/migrate react18-to-19` |
| Tailwind 3→4 | `/migrate tailwind3-to-4` |
| CJS→ESM | `/migrate cjs-to-esm` |
| Class→Hooks | `/migrate class-to-hooks` |
| Jest→Vitest | `/migrate jest-to-vitest` |

## MCP UTILISES
- Context7 (migration guides)
- Read/Edit (modifications)
- Bash (npm, codemods)
