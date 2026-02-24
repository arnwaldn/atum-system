# Regulatory Compliance Routing

## Auto-Detection Triggers

Invoke **compliance-expert** agent when detecting:

| Signal | Regulations |
|--------|------------|
| User data collection, login, signup | RGPD, ePrivacy, CCPA/CPRA |
| Payment processing, checkout | PCI-DSS 4.0, PSD2/3, RGPD |
| Health/medical data | HIPAA, RGPD Art. 9 |
| Children's content (age < 16) | COPPA, RGPD Art. 8 |
| Cookies, tracking, analytics | ePrivacy, RGPD |
| E-commerce, product sales | Consumer Rights Directive, EAA, RGPD |
| AI/ML model deployment | EU AI Act (via ATUM), CRA, RGPD Art. 22 |
| Financial services | PSD2/3, MiFID II, SOX |
| EU market targeting | EAA (accessibility), NIS2, DSA/DMA |
| Infrastructure, SaaS platform | SOC 2, ISO 27001, NIS2 |

## Pre-Deploy Reminder

Before ANY production deployment, verify:
1. Compliance profile detected (`/compliance profile`)
2. Sector-specific checklist reviewed
3. CRITICAL findings addressed

## Reference

- Sector checklists: `~/Projects/tools/project-templates/compliance/sectors/`
- Regulation details: `~/Projects/tools/project-templates/compliance/regulations/`
- Implementation patterns: `~/Projects/tools/project-templates/compliance/patterns/`
