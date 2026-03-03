# Business Plan V2 — ATUM SAS (2026-2028)

Source : Decisions strategiques validees par Pablo Macia (DG), 2-3 mars 2026

---

## Philosophie : Bootstrap & Autonomie

- **Zero salaries An1** : les 3 associes travaillent sans remuneration fixe
- **100% capacite de production** investie dans les produits et clients
- **Reinvestissement des revenus** dans la croissance (pas de dividendes An1)
- **Flexibilite** : rigoureux par defaut, adaptable si necessaire

---

## Modele 3 Moteurs de Revenus

| Moteur | Type | Role | Exemples |
|---|---|---|---|
| **Services** | Cash immediat | Finance la croissance | Agence dev, Odoo, audits, formations |
| **SaaS** | MRR recurrent | Valorisation long terme | GigRoute, TradingBrain, Quick Summarize, OWL |
| **Sites Satellites** | Revenus passifs | Complement + SEO | Sites niche AdSense + affiliation |

---

## Vision globale

| Indicateur | An 1 (2026) | An 2 (2027) | An 3 (2028) |
|---|---|---|---|
| **CA total** | 1 792 000 EUR | 5 200 000 EUR | 15 000 000 EUR |
| **Charges** | 433 200 EUR | 2 200 000 EUR | 7 000 000 EUR |
| **EBITDA** | 1 358 800 EUR | 3 000 000 EUR | 8 000 000 EUR |
| **Marge EBITDA** | 76% | 58% | 53% |
| **Equipe** | 3 associes (0 salaries) | 8-12 pers. | 20-30 pers. |
| **Breakeven** | Q2 2026 | — | — |

---

## Revenus par activite

### An 1 (2026) — Detail par moteur

#### Moteur 1 : Services (cash immediat)
| Activite | CA prevu | % du CA |
|---|---|---|
| Agence Dev (sites, apps, SaaS custom) | 600 000 EUR | 33% |
| Integrations Odoo | 120 000 EUR | 7% |
| Formations & conseil | 60 000 EUR | 3% |
| **Sous-total Services** | **780 000 EUR** | **44%** |

#### Moteur 2 : SaaS (MRR recurrent)
| Produit | CA prevu | % du CA |
|---|---|---|
| GigRoute (ex-TourFlow) | 180 000 EUR | 10% |
| TradingBrain | 432 000 EUR | 24% |
| Quick Summarize | 60 000 EUR | 3% |
| OWL (EU AI Act) | 120 000 EUR | 7% |
| **Sous-total SaaS** | **792 000 EUR** | **44%** |

#### Moteur 3 : Sites Satellites (revenus passifs)
| Source | CA prevu | % du CA |
|---|---|---|
| Sites niche (AdSense) | 30 000 EUR | 2% |
| Affiliation | 10 000 EUR | 1% |
| **Sous-total Satellites** | **40 000 EUR** | **2%** |

#### Work for Equity
| Startup | CA prevu | % du CA |
|---|---|---|
| API Horodatage (30% ATUM) | 180 000 EUR | 10% |
| **Sous-total Equity** | **180 000 EUR** | **10%** |

| **TOTAL AN 1** | **1 792 000 EUR** | **100%** |
|---|---|---|

### An 2 (2027) — Detail

| Activite | CA prevu |
|---|---|
| Agence Dev | 900 000 EUR |
| Integrations Odoo | 300 000 EUR |
| GigRoute | 360 000 EUR |
| TradingBrain | 2 160 000 EUR |
| Quick Summarize | 150 000 EUR |
| OWL | 360 000 EUR |
| Sites Satellites | 120 000 EUR |
| API Horodatage | 360 000 EUR |
| Clarity OS | 120 000 EUR |
| OAC | 120 000 EUR |
| Premium Concierge AI | 150 000 EUR |
| **Total** | **~5 200 000 EUR** |

### An 3 (2028) — ARR cibles

| Produit | ARR cible |
|---|---|
| GigRoute | 720 000 EUR |
| TradingBrain | 6 480 000 EUR |
| Quick Summarize | 299 400 EUR |
| OWL | 720 000 EUR |
| Agence Dev + Odoo | 2 400 000 EUR |
| Sites Satellites | 360 000 EUR |
| Clarity OS | 720 000 EUR |
| OAC | 720 000 EUR |
| Premium Concierge AI | 1 080 000 EUR |
| AIDU | 450 000 EUR |
| ADOS | 450 000 EUR |
| API Horodatage | 720 000 EUR |
| **Total ARR** | **~15 000 000 EUR** |

---

## Charges prevues An 1

| Poste | Montant | % charges | Notes |
|---|---|---|---|
| Salaires et charges | 0 EUR | 0% | Bootstrap : zero salaries |
| Marketing & acquisition | 200 000 EUR | 46% | Reduit vs BP V1 grace a "le produit est la demo" |
| Infrastructure cloud + API IA | 96 000 EUR | 22% | Render, Claude API, hosting SaaS |
| Odoo SH | 7 200 EUR | 2% | Forfait Odoo.sh managed |
| Sous-traitance | 72 000 EUR | 17% | Freelances ponctuels |
| Frais generaux | 58 000 EUR | 13% | Bureaux, assurances, comptable |
| **Total** | **433 200 EUR** | **100%** | |

---

## Infrastructure Odoo SH Custom

Double usage : **gestion interne ATUM + produit commercial pour clients**.

| Caracteristique | Detail |
|---|---|
| Version | Odoo 18 |
| Hebergement | Odoo.sh (managed) |
| Modules | ~25 valides (ERP, CRM, RH, Marketing, Website, Support, BI) |
| Peppol | Actif des le jour 1 (facturation electronique B2B UE) |
| Multi-sites | 10 sites/an (deploiement clients) |
| Multi-devises | EUR, USD, GBP minimum |
| Multi-langues | FR, EN, ES, DE |

---

## Strategie commerciale : "Le produit EST la demo"

**Principe** : On ne vend pas une promesse, on montre le resultat. Le prospect recoit un apercu fonctionnel de SON produit AVANT de payer.

### Processus
1. Generer une V1 personnalisee avec le branding du prospect
2. Heberger sur URL temporaire
3. Envoyer le lien de preview (pas un email commercial standard)
4. Bouton "Acheter et deployer" (integration Stripe)
5. Auto-deploiement sur domaine client apres paiement

### Applications par vertical
| Vertical | Demo personnalisee |
|---|---|
| Sites vitrines | Site V1 genere → URL temp → bouton deploy |
| OWL (EU AI Act) | Pre-scan automatique → mini-rapport gratuit → bouton audit complet |
| Odoo | Instance pre-configuree avec nom/logo/catalogue prospect |
| Apps mobiles/SaaS | Prototype interactif avec branding prospect |
| Formation/E-learning | Quiz personnalise → score → bouton deploiement formation |

---

## Politique de paiement (BP V2)

### Services (agence, audit, formation)
| Tranche | Conditions |
|---|---|
| < 1 000 EUR | 100% a la commande |
| 1 000 - 5 000 EUR | 50% a la commande + 50% a la livraison |
| > 5 000 EUR | Echeancier proportionnel (40-50% commande + jalons + solde livraison) |
| Regie (TJM) | Mensuel, 30 jours date de facture |

### SaaS
| Aspect | Regle |
|---|---|
| Freemium | **Zero** — pas d'offre gratuite permanente |
| Essai | 14 jours standard, 30 jours max sur demande |
| Paiement | Mensuel ou annuel (-15% remise) |
| Renouvellement | Tacite reconduction, resiliation a tout moment |

---

## KPIs cibles An 1

| KPI | Cible |
|---|---|
| MRR fin d'annee | ~149 000 EUR |
| ARR fin d'annee | ~1 792 000 EUR |
| Clients GigRoute | 200 |
| Clients TradingBrain | 300 |
| Clients Quick Summarize | 1 000 |
| Clients OWL | 100 |
| Sites satellites actifs | 10 |
| Churn moyen SaaS | < 5% mensuel |
| CAC moyen | < 50 EUR |
| LTV/CAC | > 10 |
| Projets agence | 10-20 projets |
| TJM moyen agence | 800-1 200 EUR |
| Breakeven | Q2 2026 |

---

## Produits — Catalogue 2026

### En production (Q1 2026)
- **GigRoute** (ex-TourFlow) : SaaS gestion tournees artistes/organisateurs. 49-99 EUR/mois. [Live sur Render]
- **Quick Summarize** : Extension Chrome resume IA. 4.99 EUR/mois.
- **OWL** : Audit conformite EU AI Act. 99-999 EUR/audit. [MCP server + SaaS]

### Lancement Q2 2026
- **TradingBrain** : SaaS analyse trading IA. 69-359 EUR/mois. Produit phare (43% ARR An3).

### Pipeline 2026-2027
- **Clarity OS** : Dashboard IA pour PME (Q4 2026)
- **OAC** : Configuration Odoo par la voix (Q1 2027)
- **Premium Concierge AI** : Conciergerie IA luxe (Q2 2027)
- **AIDU** : Plateforme IA educative (2027)
- **ADOS** : Systeme gestion documents IA (Q2 2027)

---

## Work for Equity

| Startup | Participation ATUM | CA prevu An1 |
|---|---|---|
| API Horodatage | 30% | 180 000 EUR |

Modele : ATUM developpe le produit en echange de parts (20-40% equity). Objectif An3 : 3-5 participations actives.

---

## Strategie de croissance

1. **Phase 1 (2026)** : Bootstrap. Lancement 4 produits SaaS (GigRoute, TradingBrain, Quick Summarize, OWL) + pipeline agence/Odoo + 10 sites satellites. Breakeven Q2.
2. **Phase 2 (2027)** : Scaling TradingBrain + 5 nouveaux produits pipeline + Odoo multi-sites. Recrutement 8-12 pers.
3. **Phase 3 (2028)** : Consolidation portfolio 15M EUR ARR. Evaluation pre-money 45-90M EUR. Preparation levee ou exit.

---

## Metriques de suivi

Variance analysis (reel vs budget) chaque trimestre :
- Variance absolue = Reel - Budget
- Variance % = (Reel - Budget) / Budget x 100
- Seuils d'alerte : > +/- 10% = justification requise, > +/- 25% = plan d'action
