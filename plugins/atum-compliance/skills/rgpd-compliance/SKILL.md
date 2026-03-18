---

name: compliance-routing
description: Regulatory compliance detection and routing. Use when code touches authentication, payments, user data, cookies, health data, children content, AI deployment, or e-commerce.
user-invocable: false
---

# Regulatory Compliance Routing

## Auto-Detection Triggers

Invoke **compliance-expert** agent (Opus) when detecting ANY of these signals :

| Signal | Regulations | Action |
|--------|------------|--------|
| User data collection, login, signup | RGPD, ePrivacy, CCPA/CPRA | /compliance gdpr |
| Payment processing, checkout | PCI-DSS 4.0, PSD2/3, RGPD | /compliance pci |
| Health/medical data | HIPAA, RGPD Art. 9 | /compliance hipaa |
| Children content (age < 16) | COPPA, RGPD Art. 8 | /compliance sector:children |
| Cookies, tracking, analytics | ePrivacy, RGPD | /compliance gdpr (cookies focus) |
| E-commerce, product sales | Consumer Rights Directive, EAA, RGPD | /compliance sector:ecommerce |
| AI/ML model deployment | EU AI Act (Reg. 2024/1689), CRA, RGPD Art. 22 | **See AI workflow below** |
| Financial services | PSD2/3, MiFID II, SOX | /compliance sector:finance |
| EU market targeting | EAA (accessibility), NIS2, DSA/DMA | /compliance accessibility + /compliance sbom |
| Infrastructure, SaaS platform | SOC 2, ISO 27001, NIS2 | /compliance sector:saas |

## AI/ML Deployment  EU AI Act Workflow (OBLIGATOIRE)

Quand un projet deploie un systeme IA (LLM, ML, computer vision, recommendation), executer ce workflow :

### Step 1 : Initialiser le projet ATUM si necessaire
- mcp__atum-audit__audit_init (project_path: chemin du projet)
- mcp__atum-audit__audit_list_projects (verifier les projets existants)

### Step 2 : Enregistrer le systeme IA
- mcp__atum-audit__compliance_register_system
  - system_name: nom descriptif du systeme
  - risk_level: minimal | limited | high | unacceptable

Classification rapide :
- **Unacceptable** : scoring social, manipulation subliminale = INTERDIT
- **High** : credit scoring, recrutement, justice, diagnostique sante = conformite totale
- **Limited** : chatbots, deepfakes, generatif = transparence obligatoire
- **Minimal** : spam filter, jeux, recommandations = bonnes pratiques

### Step 3 : Auditer la conformite
- mcp__atum-audit__compliance_status : vue d ensemble
- mcp__atum-audit__compliance_validate : validation SHACL
- mcp__atum-audit__compliance_annex_iv : documentation technique
- mcp__atum-audit__compliance_retention_check : retention logs (Art. 12)
- mcp__atum-audit__compliance_incidents : incidents Art. 62

### Step 4 : Generer le rapport client
- mcp__atum-audit__compliance_export_report (format: html ou md)
- Ce rapport est livrable au client comme preuve de conformite.

### Step 5 : Integrite des fichiers
- mcp__atum-audit__audit_full_scan : scan complet
- mcp__atum-audit__audit_violations : violations d integrite
- mcp__atum-audit__audit_verify_file : fichier specifique
- mcp__atum-audit__audit_file_history : historique audit

## Pre-Deploy Reminder

Before ANY production deployment, verify:
1. Compliance profile detected (/compliance profile)
2. Sector-specific checklist reviewed
3. CRITICAL findings addressed
4. **If AI system** : EU AI Act audit completed (Steps 1-5 above)
5. **If EU market** : SBOM generated (/compliance sbom)
6. **If user data** : RGPD DSR API endpoints present

## RGPD Quick-Check (pour tout projet avec donnees personnelles)

Verifier dans le code :
- [ ] Cookie consent banner (bloquant, 3 boutons)
- [ ] Pages /privacy, /terms, /cookies, /legal
- [ ] DSR API : /api/gdpr/access, /api/gdpr/delete, /api/gdpr/export
- [ ] Registre des traitements documente
- [ ] Chiffrement at rest + in transit
- [ ] Retention policy definie
- [ ] Breach notification process documente

## Reference

- Sector checklists: ~/Projects/tools/project-templates/compliance/sectors/
- Regulation details: ~/Projects/tools/project-templates/compliance/regulations/
- Implementation patterns: ~/Projects/tools/project-templates/compliance/patterns/
- Agent: **compliance-expert** (model: opus, mcpServers: [atum-audit])
- MCP: mcp__atum-audit__* (15 outils disponibles)
