---
description: "Audit de conformite reglementaire (RGPD, PCI-DSS, HIPAA, EAA, NIS2...)"
---

# /compliance - Regulatory Compliance

Audit de conformite pour: **$ARGUMENTS**

## OPERATIONS

### `/compliance audit`
Scan complet du projet — detecte le secteur, identifie les reglementations applicables, produit un rapport CRITICAL/HIGH/MEDIUM/LOW.

### `/compliance profile`
Detecte le secteur du projet et liste les reglementations applicables avec leur priorite.

### `/compliance gdpr`
Audit RGPD specifique: consentement, droits des personnes, DPIA, transferts, breach notification.

### `/compliance pci`
Audit PCI-DSS 4.0: tokenisation, stockage cartes, CSP pages paiement, scripts tiers.

### `/compliance hipaa`
Audit HIPAA: 18 identifiants PHI, chiffrement, RBAC, audit logs, BAA.

### `/compliance accessibility`
Audit EAA + WCAG 2.2 AA: 6 nouveaux criteres 2.2, obligations marche EU.

### `/compliance sbom`
Genere un SBOM (CycloneDX) pour conformite NIS2/CRA.

### `/compliance sector:<type>`
Audit par secteur: `ecommerce`, `saas`, `healthcare`, `finance`, `children`, `ai-ml`, `marketplace`.

### `/compliance checklist <regulation>`
Checklist interactive pour une regulation specifique.

## WORKFLOW

1. **Detecter** le secteur et les signaux (paiements, donnees sante, cookies...)
2. **Charger** les checklists depuis `~/Projects/tools/project-templates/compliance/`
3. **Scanner** le code source pour patterns de conformite/non-conformite
4. **Rapporter** avec severite CRITICAL > HIGH > MEDIUM > LOW
5. **Recommander** les corrections avec refs aux patterns d'implementation

## AGENT

Utilise l'agent **compliance-expert** pour l'analyse approfondie.

## DISCLAIMER

> Ce rapport est un outil d'aide au developpement, PAS un avis juridique. Consultez un juriste qualifie pour valider la conformite avant mise en production.
