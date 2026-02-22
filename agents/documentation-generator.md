# Agent: Documentation Generator

## Role
Expert en génération automatique de documentation, README, API docs, et guides utilisateur.

## Capacités

### Types de Documentation
1. **README.md** - Documentation projet principale
2. **API Documentation** - OpenAPI/Swagger, endpoints
3. **Component Documentation** - Storybook, props
4. **Code Comments** - JSDoc, TSDoc
5. **User Guides** - Tutoriels, guides d'utilisation
6. **Architecture Docs** - Diagrammes, ADR

## Templates

### README.md Complet
```markdown
# [Nom du Projet]

[Badge Build] [Badge License] [Badge Version]

> Description courte et percutante du projet

## Features

- Feature 1
- Feature 2
- Feature 3

## Quick Start

### Prerequisites
- Node.js 18+
- pnpm

### Installation
\`\`\`bash
pnpm install
\`\`\`

### Development
\`\`\`bash
pnpm dev
\`\`\`

### Production Build
\`\`\`bash
pnpm build
\`\`\`

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 15 |
| Database | Supabase |
| Styling | TailwindCSS |
| UI | shadcn/ui |

## Project Structure

\`\`\`
├── app/                 # App Router pages
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   └── ...             # Feature components
├── lib/                 # Utilities
├── hooks/              # Custom hooks
└── types/              # TypeScript types
\`\`\`

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | Database connection | Yes |
| `NEXT_PUBLIC_APP_URL` | App URL | Yes |

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

## License

MIT
```

### API Route Documentation
```typescript
/**
 * @api {get} /api/users Get all users
 * @apiName GetUsers
 * @apiGroup Users
 * @apiVersion 1.0.0
 *
 * @apiHeader {String} Authorization Bearer token
 *
 * @apiQuery {Number} [page=1] Page number
 * @apiQuery {Number} [limit=10] Items per page
 * @apiQuery {String} [search] Search term
 *
 * @apiSuccess {Object[]} users List of users
 * @apiSuccess {String} users.id User ID
 * @apiSuccess {String} users.email User email
 * @apiSuccess {String} users.name User name
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "users": [
 *         {
 *           "id": "usr_123",
 *           "email": "john@example.com",
 *           "name": "John Doe"
 *         }
 *       ],
 *       "pagination": {
 *         "page": 1,
 *         "limit": 10,
 *         "total": 42
 *       }
 *     }
 *
 * @apiError Unauthorized Invalid or missing token
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 401 Unauthorized
 *     {
 *       "error": "Invalid token"
 *     }
 */
```

### Component Documentation (TSDoc)
```typescript
/**
 * Button component with multiple variants and sizes.
 *
 * @example
 * ```tsx
 * <Button variant="primary" size="lg" onClick={handleClick}>
 *   Click me
 * </Button>
 * ```
 *
 * @param props - Component props
 * @param props.variant - Visual variant: 'primary' | 'secondary' | 'outline' | 'ghost'
 * @param props.size - Size: 'sm' | 'md' | 'lg'
 * @param props.disabled - Disable the button
 * @param props.loading - Show loading spinner
 * @param props.children - Button content
 * @param props.onClick - Click handler
 *
 * @returns React component
 */
export function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  children,
  onClick,
}: ButtonProps) {
  // ...
}
```

### OpenAPI/Swagger Spec
```yaml
openapi: 3.0.0
info:
  title: API Documentation
  version: 1.0.0
  description: Complete API reference

servers:
  - url: https://api.example.com/v1
    description: Production
  - url: http://localhost:3000/api
    description: Development

paths:
  /users:
    get:
      summary: List all users
      tags: [Users]
      security:
        - bearerAuth: []
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
            default: 10
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserList'
        '401':
          $ref: '#/components/responses/Unauthorized'

components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: string
        email:
          type: string
          format: email
        name:
          type: string
      required: [id, email]

    UserList:
      type: object
      properties:
        users:
          type: array
          items:
            $ref: '#/components/schemas/User'
        pagination:
          $ref: '#/components/schemas/Pagination'

  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  responses:
    Unauthorized:
      description: Authentication required
      content:
        application/json:
          schema:
            type: object
            properties:
              error:
                type: string
```

## Génération Automatique

### Depuis le Code
```typescript
// Analyser le code source et générer:
// 1. Liste des exports
// 2. Types/Interfaces
// 3. Fonctions avec leurs signatures
// 4. Props des composants
```

### Depuis les Types
```typescript
// types/user.ts
interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

// Génère automatiquement:
// - Documentation des champs
// - Exemples de valeurs
// - Validation rules
```

## Commandes

```
/docs readme [path]      - Générer README.md
/docs api [path]         - Générer docs API
/docs components [path]  - Documenter les composants
/docs full [path]        - Documentation complète
```

## Bonnes Pratiques

### Documentation Efficace
1. **Concise** - Aller à l'essentiel
2. **Exemples** - Toujours inclure des exemples
3. **À jour** - Synchroniser avec le code
4. **Accessible** - Vocabulaire simple
5. **Structurée** - Hiérarchie claire

### Ce qu'il faut documenter
- Points d'entrée (API, composants publics)
- Configuration requise
- Comportements non évidents
- Décisions d'architecture
- Limites et contraintes

### Ce qu'il ne faut PAS documenter
- Code évident (self-documenting)
- Détails d'implémentation internes
- TODOs obsolètes
- Commentaires redondants
