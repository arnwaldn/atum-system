---
description: "Generer un site web business via B12 MCP ou scaffold un projet custom"
---

# Mode WEBSITE Active

Creer un site web: **$ARGUMENTS**

## ETAPE 1 — Determiner le besoin

Analyser la demande et proposer les options:

### Option A: Site business rapide (B12 MCP — sans code)
- Ideal pour: site vitrine, portfolio, landing page, restaurant, agence, blog, e-commerce simple
- Utiliser le tool MCP `generate_website` avec:
  - `name`: Nom du business/projet (extrait de la demande)
  - `description`: Description courte (<1000 caracteres)
- Retourner le lien genere a l'utilisateur
- Temps: ~10 secondes

### Option B: Site custom code (Scaffold)
- Ideal pour: logique metier custom, design specifique, fonctionnalites avancees
- Consulter `~/Projects/tools/project-templates/INDEX.md` (17 templates web)
- Templates: landing, startup, portfolio, ecommerce, agency, blog, restaurant, hotel, medical, saas, real-estate, nonprofit, photography, interior-design, wedding, admin-dashboard, pwa
- Lancer `/scaffold <template>` avec le stack 2026

### Option C: Hybride (Preview B12 + Custom)
- Generer d'abord un site B12 pour preview instantane
- Puis scaffolder un projet custom inspire du resultat
- Meilleur des deux mondes: feedback immediat + controle total

## ETAPE 2 — Executer

Si Option A (B12):
1. Appeler `generate_website(name, description)`
2. Presenter le lien a l'utilisateur
3. Rappel: "Le site est heberge par B12. Verifier la conformite RGPD/cookies si marche EU."

Si Option B (Scaffold):
1. Invoquer `/scaffold` avec le template choisi
2. Appliquer ui-ux-pro-max pour le design
3. Consulter `website-templates-reference.md` pour inspiration

Si Option C (Hybride):
1. B12 d'abord → montrer le lien
2. Scaffold ensuite → adapter le design

## ETAPE 3 — Compliance (si marche commercial)

Pour TOUT site web destine au public:
- Verifier le profil compliance (`/compliance profile`)
- Sites EU: cookie consent, privacy policy, mentions legales obligatoires
- E-commerce: PCI-DSS si paiements, droit de retractation
- Sites B12: verifier que B12 gere les cookies/RGPD ou ajouter manuellement
