---
description: "Checklist de validation pre-deploiement (user)"
---

# /pre-deploy - Production Readiness Check

Execute une checklist de validation avant deploiement pour: **$ARGUMENTS**

## WORKFLOW

### 1. Build & Types
```bash
pnpm tsc --noEmit    # TypeScript strict
pnpm lint            # ESLint
pnpm build           # Build production
```

### 2. Tests
```bash
pnpm test            # Unit + integration
pnpm test:e2e        # E2E si disponible
```

### 3. Security
```bash
npm audit --audit-level=high
```

### 4. Checklist Complete

#### Must Have (Bloquant)
- [ ] Build sans erreur
- [ ] Tests passants
- [ ] TypeScript sans erreur
- [ ] Pas de secrets exposes dans le code
- [ ] Features principales fonctionnent
- [ ] Coverage > 80%

#### Performance
- [ ] Lighthouse score > 90
- [ ] Bundle JS initial < 200KB
- [ ] Images optimisees (WebP, lazy loading)
- [ ] CLS < 0.1, LCP < 2.5s, INP < 200ms

#### SEO
- [ ] Title unique par page
- [ ] Meta descriptions
- [ ] Open Graph tags
- [ ] Sitemap.xml + robots.txt

#### Accessibilite
- [ ] Navigation clavier complete
- [ ] Contraste suffisant (4.5:1)
- [ ] Alt text sur images
- [ ] Labels sur inputs
- [ ] Skip link present

#### Securite
- [ ] HTTPS only
- [ ] Headers securite configures
- [ ] Input validation (Zod)
- [ ] XSS + CSRF + SQL injection prevenus
- [ ] Rate limiting
- [ ] npm audit sans high/critical

#### Infrastructure
- [ ] .env.example a jour
- [ ] README.md complet
- [ ] CI/CD configure
- [ ] Variables d'environnement documentees

## COMMANDES UTILES

```bash
# Verification complete
pnpm tsc --noEmit && pnpm lint && pnpm test && pnpm build

# Lighthouse
npx lighthouse http://localhost:3000 --view

# Bundle analysis
ANALYZE=true pnpm build

# Accessibility
npx pa11y http://localhost:3000

# Security
npm audit && npx snyk test
```

## OUTPUT

Genere un rapport avec:
- Status de chaque verification (PASS/FAIL)
- Liste des issues a corriger
- Recommandation: READY TO DEPLOY ou BLOCKED (avec raisons)
