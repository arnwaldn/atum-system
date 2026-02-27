---
description: "Scaffold projet optimise avec structure best practices 2026"
---

# Mode SCAFFOLD Active

Scaffold projet: **$ARGUMENTS**

## OPTION RAPIDE — Site Business via B12 (sans code)

**Si le projet est un site vitrine / business / portfolio simple** (pas de logique custom):

1. Utiliser le **B12 MCP** (`generate_website` tool):
   - `name`: Nom du business/projet
   - `description`: Description courte (<1000 caracteres)
2. B12 genere un site complet en quelques secondes (design, contenu, structure)
3. Retourner le lien d'inscription a l'utilisateur

**Templates concernes**: landing, startup, portfolio, agency, restaurant, hotel, medical, nonprofit, photography, real-estate, saas, ecommerce, blog, interior-design, wedding, github-profile

**Compliance**: Les sites B12 sont heberges par B12.io — verifier que RGPD/cookies sont geres si marche EU.

**Si l'utilisateur veut du code custom** → continuer avec le scaffold ci-dessous.

---

## ETAPE 0 — OBLIGATOIRE: Consulter l'index des templates

**AVANT de creer quoi que ce soit**, lire le fichier:
```
~/Projects/tools/project-templates/INDEX.md
```

Actions:
1. **Lire INDEX.md** pour trouver un template existant qui correspond au projet
2. Si un template correspond (ex: `ai-assistant`, `ecommerce`, `rag-chatbot`):
   - Lire son contenu dans `~/Projects/tools/project-templates/<template>/`
   - S'en inspirer comme base, adapter au besoin
3. **Consulter les fichiers de reference pertinents**:
   - App web/site? -> `website-templates-reference.md` pour inspiration design
   - Integration API? -> `rapidapi-hub-reference.md` pour trouver les bonnes APIs
   - Projet AI/LLM? -> `awesome-llm-apps-reference.md` pour patterns
   - Clone d'app connue? -> `clone-wars-reference.md` pour implementations existantes
   - Effets visuels? -> `codrops-hub-reference.md` pour demos WebGL/CSS
   - MCP server? -> `glama-mcp-reference.md` pour exemples
   - .gitignore? -> `gitignore-reference.md` pour le bon template
   - Profile README? -> `profile-readme-reference.md` pour styles
   - Learning path? -> `roadmap-sh-reference.md` pour roadmaps
   - Claude Code config (agent, command, hook, skill)? -> `aitmpl-reference.md` pour 7,388 templates
4. Si aucun template ne correspond -> scaffolder from scratch avec le stack ci-dessous

**Presenter a l'utilisateur**: "J'ai trouve X templates proches et Y references utiles. Voici ce que je recommande..."

---

## ETAPE 0.5 — Profil Compliance

**Si le projet cible un marche commercial** (e-commerce, SaaS, sante, finance, enfants, IA):

1. Determiner le **secteur** du projet
2. Lire la checklist sectorielle: `~/Projects/tools/project-templates/compliance/sectors/<secteur>.md`
3. Integrer les fondations compliance dans le scaffold:
   - Cookie consent component (si marche EU)
   - Privacy policy page (/privacy)
   - Terms page (/terms)
   - Security headers (CSP, HSTS, X-Frame-Options)
   - DSR API stubs si donnees personnelles

**Presenter a l'utilisateur**: "Profil compliance: [secteur]. Reglementations applicables: [liste]. Fondations compliance incluses dans le scaffold."

---

## STACK PAR DEFAUT (2026)

| Composant | Technologie |
|-----------|-------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5.9 strict |
| Styling | TailwindCSS 4.2 + shadcn/ui |
| Database | Supabase (si necessaire) |
| Auth | Clerk ou Supabase Auth |
| Payments | Stripe (si necessaire) |
| Testing | Vitest + Playwright |
| Package Manager | pnpm |

## STRUCTURE STANDARD

```
project/
|-- src/
|   |-- app/                    # Next.js App Router
|   |   |-- layout.tsx          # Root layout
|   |   |-- page.tsx            # Home page
|   |   |-- globals.css         # Global styles
|   |   |-- (auth)/             # Auth group
|   |   |   |-- sign-in/
|   |   |   +-- sign-up/
|   |   |-- (dashboard)/        # Protected group
|   |   |   |-- layout.tsx
|   |   |   +-- page.tsx
|   |   +-- api/                # API routes
|   |       +-- [...]/route.ts
|   |-- components/
|   |   |-- ui/                 # shadcn components
|   |   |-- layout/             # Layout components
|   |   +-- features/           # Feature components
|   |-- lib/
|   |   |-- utils.ts            # Utilities
|   |   |-- supabase.ts         # DB client
|   |   +-- stripe.ts           # Payment client
|   |-- hooks/                  # Custom hooks
|   +-- types/                  # TypeScript types
|-- public/                     # Static assets
|-- prisma/                     # If using Prisma
|   +-- schema.prisma
|-- package.json
|-- tsconfig.json
|-- tailwind.config.ts
|-- next.config.ts
|-- .env.local
+-- .gitignore                  # From gitignore-reference.md
```

## FICHIERS A CREER

### 1. Configuration de base
- `package.json` avec dependencies 2026
- `tsconfig.json` strict
- `tailwind.config.ts`
- `next.config.ts`
- `.env.local` template
- `.gitignore` (consulter gitignore-reference.md pour le bon combo)

### 2. App structure
- `src/app/layout.tsx` - Root layout
- `src/app/page.tsx` - Home page
- `src/app/globals.css` - Styles

### 3. Components de base
- `src/components/ui/` - shadcn components
- `src/lib/utils.ts` - cn() helper

### 4. Types
- `src/types/index.ts` - Types globaux

## DEPENDENCIES 2026

```json
{
  "dependencies": {
    "next": "^16.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "tailwindcss": "^4.2.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^3.0.0"
  },
  "devDependencies": {
    "typescript": "^5.9.0",
    "@types/react": "^19.0.0",
    "@types/node": "^22.0.0",
    "vitest": "^4.0.0"
  }
}
```

## GO!

1. Consulter INDEX.md (OBLIGATOIRE)
2. Presenter les templates/references trouves
3. Creer la structure adaptee au projet
