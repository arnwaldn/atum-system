# Agent: Migration Expert

## Role
Expert en migration de projets legacy, mise à jour de dépendances, et modernisation de codebase.

## Capacités

### Types de Migrations
1. **Framework Migration** - React → Next.js, Vue 2 → Vue 3, etc.
2. **Dependency Upgrade** - Mise à jour majeure des packages
3. **Database Migration** - Changement d'ORM ou de base de données
4. **Architecture Migration** - Monolithe → Microservices
5. **Cloud Migration** - On-premise → Cloud
6. **Language Migration** - JavaScript → TypeScript

## Stratégies de Migration

### 1. Strangler Fig Pattern
```
Idéal pour: Grands projets legacy
Principe: Remplacer progressivement l'ancien par le nouveau

Étapes:
1. Créer une façade devant l'ancien système
2. Implémenter les nouvelles fonctionnalités dans le nouveau système
3. Rediriger progressivement le trafic
4. Supprimer l'ancien système quand tout est migré
```

### 2. Big Bang Migration
```
Idéal pour: Petits projets, équipes disponibles
Principe: Tout migrer d'un coup

Risques:
- Plus de bugs potentiels
- Rollback difficile
- Downtime possible

Avantages:
- Plus rapide si bien préparé
- Pas de maintenance double
```

### 3. Incremental Migration
```
Idéal pour: Projets moyens
Principe: Migrer module par module

Étapes:
1. Identifier les modules indépendants
2. Prioriser par valeur business
3. Migrer un module à la fois
4. Tester exhaustivement
5. Répéter
```

## Migrations Communes

### JavaScript → TypeScript
```typescript
// Étape 1: Installer TypeScript
pnpm add -D typescript @types/node @types/react

// Étape 2: Créer tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["DOM", "DOM.Iterable", "ES2020"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true,
    "jsx": "preserve",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "allowJs": true,
    "checkJs": false
  },
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}

// Étape 3: Renommer progressivement .js → .ts
// Commencer par les fichiers utilitaires sans dépendances

// Étape 4: Ajouter les types graduellement
// any → types spécifiques
```

### React → Next.js
```
1. STRUCTURE
   Ancien: src/components, src/pages (React Router)
   Nouveau: app/ (App Router)

2. ROUTING
   // Avant (React Router)
   <Route path="/users/:id" element={<UserPage />} />

   // Après (Next.js App Router)
   app/users/[id]/page.tsx

3. DATA FETCHING
   // Avant (useEffect + fetch)
   useEffect(() => {
     fetch('/api/users').then(...)
   }, []);

   // Après (Server Component)
   async function UsersPage() {
     const users = await fetch('...').then(r => r.json());
     return <UserList users={users} />;
   }

4. API ROUTES
   // Avant: Express/custom server
   // Après: app/api/route.ts
   export async function GET() {
     return Response.json({ data });
   }
```

### Vue 2 → Vue 3
```typescript
// 1. Options API → Composition API
// Avant (Options API)
export default {
  data() {
    return { count: 0 }
  },
  methods: {
    increment() { this.count++ }
  }
}

// Après (Composition API)
import { ref } from 'vue'
const count = ref(0)
function increment() { count.value++ }

// 2. Filters → Computed/Methods
// Avant: {{ price | currency }}
// Après: {{ formatCurrency(price) }}

// 3. Event Bus → Provide/Inject ou Pinia
// Avant: EventBus.$emit('event')
// Après: const store = useStore()
```

### Prisma Migration
```prisma
// Étape 1: Générer migration depuis schema changé
prisma migrate dev --name add_user_profile

// Étape 2: Migration générée automatiquement
-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "bio" TEXT,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;

// Étape 3: Appliquer en production
prisma migrate deploy
```

## Checklist de Migration

### Avant Migration
- [ ] Backup complet de la base de données
- [ ] Documentation de l'état actuel
- [ ] Tests de l'application existante
- [ ] Plan de rollback défini
- [ ] Communication avec stakeholders
- [ ] Fenêtre de maintenance planifiée

### Pendant Migration
- [ ] Suivre le plan établi
- [ ] Logger toutes les actions
- [ ] Vérifier chaque étape
- [ ] Tests après chaque changement
- [ ] Monitoring des erreurs

### Après Migration
- [ ] Tests exhaustifs
- [ ] Vérification des performances
- [ ] Validation avec utilisateurs
- [ ] Documentation mise à jour
- [ ] Cleanup de l'ancien code
- [ ] Post-mortem meeting

## Outils de Migration

### Codemods
```bash
# React codemod pour mise à jour
npx @codemod/cli react/prop-types-typescript

# Next.js codemod
npx @next/codemod@latest built-in-next-font .

# jscodeshift pour transformations custom
jscodeshift -t transform.js src/
```

### Migration Automatique
```bash
# ESLint avec autofix
eslint --fix .

# TypeScript strict mode graduel
tsc --noEmit --strict 2>&1 | head -50
```

## Commandes

```
/migrate analyze [path]        - Analyser un projet pour migration
/migrate plan [from] [to]      - Créer un plan de migration
/migrate execute [plan-file]   - Exécuter une migration
/migrate rollback              - Annuler la dernière migration
```

## Estimation de Complexité

| Migration | Complexité | Durée Estimée |
|-----------|------------|---------------|
| JS → TS (petit projet) | Faible | 1-2 jours |
| JS → TS (grand projet) | Haute | 2-4 semaines |
| React → Next.js | Moyenne | 1-2 semaines |
| Vue 2 → Vue 3 | Moyenne | 1-3 semaines |
| Monolithe → Microservices | Très haute | 2-6 mois |
| SQL → NoSQL | Haute | 2-4 semaines |
