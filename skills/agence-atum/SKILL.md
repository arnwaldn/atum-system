---
name: agence-atum
description: |
  Gestion administrative ATUM SAS — societe par actions simplifiee a capital variable.
  Use when: agence, societe, ATUM SAS, associes, actionnariat, PV, convocation, dividendes,
  tresorerie, pipeline agence, work for equity, obligations legales, rapport trimestriel,
  quorum, majorite, capital social, convention reglementee, BSPCE, reserve legale,
  3 moteurs, GigRoute, OWL, TradingBrain, Quick Summarize, Odoo, sites satellites,
  bootstrap, strategie commerciale, le produit est la demo, Peppol, facturation electronique.
metadata:
  triggers: agence, atum sas, societe, la boite, associes, actionnariat, PV, proces-verbal, convocation, dividendes, tresorerie, pipeline agence, work for equity, obligations, rapport trimestriel, quorum, majorite, capital social, agency, shareholders, quarterly report, convention reglementee, reserve legale, affectation resultat, depot comptes, devis, facture, facturer, relance, impaye, retard paiement, contrat client, prestation services, NDA, confidentialite, CGV, conditions generales, freelance, sous-traitant, equipe, embauche, registre personnel, timetracking, temps passe, feuille de temps, RGPD, donnees personnelles, registre traitements, DPA, assurance, RC Pro, note de frais, Syntec, convention collective, grille salariale, GigRoute, OWL, EU AI Act, TradingBrain, Quick Summarize, Odoo, sites satellites, 3 moteurs, bootstrap, le produit est la demo, Peppol
---

# ATUM SAS — Administration Operationnelle (BP V2)

## Identite

| Champ | Valeur |
|---|---|
| Denomination | ATUM SAS |
| Forme | SAS a capital variable |
| Capital initial | 1 000 EUR (1 000 actions x 1 EUR nominal) |
| Capital plancher / plafond | 1 000 EUR / 10 000 000 EUR |
| Siege | Aix-en-Provence |
| RCS | En cours d'immatriculation |
| Creation | Janvier 2026 |
| Exercice social | 01/01 — 31/12 |
| Duree | 99 ans |
| Banque | Qonto |
| Objet | Dev logiciel & IA, agence, incubation, SaaS, sites satellites |

## Actionnariat

| Associe | Actions | % | Fonction | Email |
|---|---|---|---|---|
| Arnaud Porcel | 400 | 40% | President (CEO/CTO) | arnaud.porcel@gmail.com |
| Pablo Macia | 300 | 30% | DG (CFO/COO/CMO) | pablo@tropicaltechproperties.com |
| Wahid Chebira | 300 | 30% | Directeur Contenu (CCO) | — |

**Clause d'inalienabilite** : Jusqu'au 31/12/2028 (3 ans). Aucune cession, nantissement ou apport des actions pendant cette periode.

---

## Philosophie An1 : Bootstrap

- **Zero salaries** : les 3 associes travaillent sans remuneration fixe
- **100% production** : toute la capacite est investie dans les produits et clients
- **Zero dividendes An1** : reinvestissement integral
- **Rigoureux par defaut, flexible par choix** : cadre strict pour l'efficacite, adaptation quand justifie

---

## Modele 3 Moteurs de Revenus (BP V2)

| Moteur | Type | Role | Part CA An1 |
|---|---|---|---|
| **Services** | Cash immediat | Agence dev, Odoo, audits, formations | 44% (780K EUR) |
| **SaaS** | MRR recurrent | GigRoute, TradingBrain, Quick Summarize, OWL | 44% (792K EUR) |
| **Sites Satellites** | Revenus passifs | Sites niche AdSense + affiliation | 2% (40K EUR) |
| **Work for Equity** | Participations | API Horodatage (30% ATUM) | 10% (180K EUR) |

**CA total An1** : 1 792 000 EUR | **EBITDA** : 1 358 800 EUR (76%) | **Breakeven** : Q2 2026

---

## Strategie commerciale : "Le produit EST la demo"

On ne vend pas une promesse, on montre le resultat. Le prospect recoit un apercu fonctionnel de SON produit AVANT de payer.

**Processus** : Generer V1 personnalisee → URL temp → Envoyer preview → Bouton Stripe "Acheter et deployer" → Auto-deploiement.

**Applications** :
| Vertical | Demo personnalisee |
|---|---|
| Sites vitrines | Site V1 genere avec branding prospect, bouton deploy |
| OWL (EU AI Act) | Pre-scan automatique + mini-rapport gratuit + bouton audit complet |
| Odoo | Instance pre-configuree avec nom/logo/catalogue prospect |
| Apps mobiles/SaaS | Prototype interactif avec branding prospect |
| Formation | Quiz personnalise + score + bouton deploiement formation |

---

## Catalogue produits

### En production (Q1 2026)
| Produit | Description | Prix | Cible An1 |
|---|---|---|---|
| **GigRoute** (ex-TourFlow) | SaaS gestion tournees artistes | 49-99 EUR/mois | 200 clients |
| **Quick Summarize** | Extension Chrome resume IA | 4.99 EUR/mois | 1 000 clients |
| **OWL** | Audit conformite EU AI Act (SaaS + service) | 99-999 EUR/audit | 100 clients |

### Lancement Q2 2026
| Produit | Description | Prix | Cible An1 |
|---|---|---|---|
| **TradingBrain** | Assistant IA trading conversationnel | 69-359 EUR/mois | 300 clients |

### Pipeline 2026-2027
- Clarity OS (Q4 2026), OAC (Q1 2027), Premium Concierge AI (Q2 2027), AIDU (2027), ADOS (Q2 2027)

### Sites satellites
- Objectif : 10 sites An1 (AdSense + affiliation)
- Stack : Odoo Website Builder / templates ATUM
- Revenu cible : 200-500 EUR/mois/site

---

## Infrastructure Odoo SH Custom

Double usage : **ERP interne ATUM + produit commercial pour clients**.

| Aspect | Detail |
|---|---|
| Version | Odoo 18 |
| Hebergement | Odoo.sh (managed) |
| Modules | ~25 valides (Core ERP, CRM, RH, Marketing, Website, Support, BI, Integration) |
| Peppol | Actif J1 — facturation electronique B2B UE |
| Multi-sites | 10 sites/an |
| Multi-devises | EUR, USD, GBP |
| Multi-langues | FR, EN, ES, DE |
| Cout | ~300-600 EUR/mois |

Data : `odoo-infrastructure.json`

---

## Regles de gouvernance

### Majorites par type de decision

| Type | Quorum 1ere conv. | Majorite | Exemples |
|---|---|---|---|
| **Unanimite** | 100% | 100% | Modif droits associes, inalienabilite, dissolution, fusion, exclusion, transformation forme |
| **Extraordinaire 3/4** | 66.67% actions | 75% presentes | Modif statuts (hors unanimite), augmentation/reduction capital, emission valeurs mobilieres |
| **Extraordinaire 2/3** | 66.67% actions | 66.67% presentes | Modif objet social, siege social, duree societe |
| **Ordinaire** | 50% actions | >50% presentes | Approbation comptes, conventions reglementees, nomination, remuneration |

### Seuils financiers (pouvoirs President)

| Seuil | Pouvoir |
|---|---|
| < 5 000 EUR | President seul |
| 5 000 — 50 000 EUR | Accord President + 1 DG |
| > 50 000 EUR | Decision collective (majorite simple) |
| > 100 000 EUR ou hors objet social | Decision collective (majorite qualifiee 3/4) |

### Delais de convocation

| Type | Delai | Moyen |
|---|---|---|
| Standard | 15 jours francs | LRAR ou email avec AR |
| Urgence | 5 jours francs | Email avec AR |
| Si 100% presents | 0 jour | Reunion spontanee valide |

---

## Formules financieres

### Dividendes
```
Benefice distribuable = Benefice net
  - Report a nouveau debiteur (pertes anterieures)
  - Reserve legale (5% du benefice, plafond 10% capital)
  - Reserve statutaire (10% du benefice)

Dividende associe = Benefice distribuable x (actions_associe / total_actions)
```

### Quorum
```
Quorum ordinaire (1ere conv.) = actions presentes >= 500 (50% de 1000)
Quorum extraordinaire (1ere conv.) = actions presentes >= 667 (66.67% de 1000)
Quorum 2eme convocation = aucun minimum (ordinaire), 33.33% (extraordinaire)
```

### KPIs SaaS
```
MRR = somme(clients_produit x prix_moyen_produit) pour chaque produit
ARR = MRR x 12
LTV = ARPU_mensuel / churn_mensuel
CAC = depenses_acquisition_periode / nouveaux_clients_periode
LTV/CAC ratio — cible > 10
Marge EBITDA = EBITDA / CA x 100
Variance = (Reel - Budget) / Budget x 100
```

### Revenue par moteur
```
CA_services = agence_dev + integrations_odoo + formations_conseil
CA_saas = gigroute + tradingbrain + quick_summarize + owl + [pipeline]
CA_satellites = adsense + affiliation
CA_equity = somme(participations x revenu_participation)
CA_total = CA_services + CA_saas + CA_satellites + CA_equity
```

---

## Politique de paiement (BP V2)

### Services (agence, audit, formation)
| Tranche | Conditions |
|---|---|
| < 1 000 EUR | 100% a la commande |
| 1 000 — 5 000 EUR | 50% commande + 50% livraison |
| > 5 000 EUR | Echeancier proportionnel (40-50% commande + jalons + solde) |
| Regie (TJM) | Mensuel, 30j date de facture |

### SaaS
| Aspect | Regle |
|---|---|
| Freemium | **Zero** — pas d'offre gratuite permanente |
| Essai | 14 jours standard, 30 jours max |
| Paiement | Mensuel ou annuel (-15% remise) |
| Renouvellement | Tacite reconduction, resiliation a tout moment |

Reference complete : `references/facturation-regles.md`

---

## Calendrier obligations

| Echeance | Obligation | Type |
|---|---|---|
| J+15 apres fin trim. | Information trimestrielle associes | Rapport (Art. 24.2) |
| 15 mai | Declaration IS / liasse fiscale | Fiscal |
| 30 juin | AG approbation comptes annuels | Gouvernance |
| J+30 apres AG | Depot comptes au greffe RCS | Legal |
| Mensuel/Trimestriel | Declaration TVA | Fiscal |
| 15 decembre | CFE (Cotisation Fonciere Entreprises) | Fiscal |
| Annuel | Verification seuils CAC | Legal |
| Hebdomadaire (lundi) | Relance factures impayees | Facturation |

---

## Facturation

### Regles
- Numerotation sequentielle sans trou (Art. 289 CGI)
- Format : F-YYYY-NNN (factures), D-YYYY-NNN (devis), AV-YYYY-NNN (avoirs), AC-YYYY-NNN (acomptes)
- Compteurs dans `facturation/compteurs.json`
- Mentions legales obligatoires : SIREN, TVA intracom, taux TVA, penalites, indemnite 40 EUR
- Peppol : facturation electronique B2B via Odoo SH

### Formules
```
montant_ht = prix_unitaire * quantite
montant_tva = total_ht * 0.20
total_ttc = total_ht + montant_tva
penalites = montant_ttc * (3 * taux_legal / 365) * jours_retard
cout_employeur = salaire_brut * 1.50
tjm_interne = cout_annuel / 218
```

### Cycle relance
| Etape | Delai | Template |
|---|---|---|
| Amiable | J+7 echeance | `relance.md` S amiable |
| Ferme | J+15 | `relance.md` S ferme |
| Mise en demeure | J+30 | `relance.md` S mise_en_demeure |
| Recouvrement | J+45 | Conseil juridique |

---

## Contrats

### Types
| Type | Template | Registre |
|---|---|---|
| Prestation de services | `contrat-prestation.md` | `contrats/registre.json` |
| NDA | `nda.md` | `contrats/registre.json` |
| CGV | `cgv.md` | `contrats/cgv.json` |
| Sous-traitance freelance | `contrat-freelance.md` | `contrats/registre.json` |

### CGV
- Obligatoire B2B (loi Hamon 2014, Art. L441-1)
- Version en vigueur dans `contrats/cgv.json`
- Annexees a chaque devis et facture
- Art. 4 : conditions de paiement selon politique BP V2

---

## Convention Syntec (IDCC 1486)

- Classification : ETAM (employes) + IC (cadres)
- Forfait jours cadres : 218 jours/an
- Conges : 25 CP + ~10 RTT
- Prevoyance cadres : obligatoire (1.50% tranche A)
- Mutuelle : obligatoire (50% employeur)
- Reference : `references/syntec-grille.md`

---

## RGPD

- Registre des traitements (Art. 30) : `rgpd/registre-traitements.json`
- 9 traitements identifies (prospects, RH, GigRoute, TradingBrain, Quick Summarize, OWL, site web, sites satellites, projets client)
- ATUM = responsable de traitement OU sous-traitant selon contexte
- DPA obligatoire quand sous-traitant (SaaS B2B, projets client)
- OWL : traite potentiellement des donnees techniques sur systemes IA clients → DPA requis
- Reference : `references/rgpd-guide.md`

---

## Assurances

| Type | Statut | Priorite |
|---|---|---|
| RC Pro | A souscrire | CRITIQUE |
| Cyber assurance | Recommande | HAUTE |
| Prevoyance cadres | Obligatoire des 1er salarie IC | HAUTE |
| Mutuelle | Obligatoire des 1er salarie | HAUTE |
| Multirisque bureaux | Si locaux | MOYENNE |

Data : `assurances.json`

---

## Architecture fichiers

### Dossier de reference : `~/Documents/ATUM-Agency/`

**Tous les documents administratifs** sont organises et generes dans ce dossier :

```
ATUM-Agency/
├── atum.local.md                          ← Config locale (SIRET, IBAN, tarifs)
├── 01-fondateurs/                         ← Statuts, pacte, BP, strategie
│   └── strategie/                         ← Documents strategiques (BP V2, marketing, etc.)
├── 02-identite-visuelle/                  ← Logos PNG + charte graphique PDF
├── 03-gouvernance/                        ← PV, convocations, conventions reglementees
│   ├── pv/
│   ├── convocations/
│   └── conventions-reglementees/
├── 04-finances/                           ← Rapports trimestriels, bilans, suivi
│   ├── rapports-trimestriels/
│   ├── bilans/
│   └── suivi-financier-2026.md
├── 05-facturation/                        ← Devis, factures, relances
│   ├── devis/
│   ├── factures/
│   └── relances/
├── 06-contrats/                           ← Contrats signes par type
│   ├── prestations/
│   ├── nda/
│   ├── freelances/
│   └── cgv/
├── 07-clients/                            ← Un dossier par client actif
│   └── _template-client/                  ← Dupliquer pour nouveau client
│       ├── fiche-client.md
│       ├── contrats/, factures/, propositions/
│       └── projets/_template-projet/      ← specs/, handoffs/, time-log.md
├── 08-prospects/                          ← Pipeline commercial
│   └── pipeline.md
├── 09-equipe/                             ← Registre personnel, timetracking, frais
├── 10-conformite/                         ← RGPD, assurances
├── 11-produits/                           ← Catalogue services, docs produits
├── 12-veille/                             ← Veille juridique & tech
├── templates/                             ← Modeles de documents agence
└── _archive/                              ← Documents archives
```

→ Les documents generes (devis, factures, contrats, PV) sont TOUJOURS sauvegardes dans `~/Documents/ATUM-Agency/` au bon emplacement.

### Data store JSON : `~/.claude/data/agence-atum/`

Donnees structurees pour Claude Code (calculs, KPIs, registres) :

### Societe & gouvernance
- `societe.json` — Identite societe
- `actionnariat.json` — Registre associes et mouvements
- `decisions/registre.json` — Index des PV et decisions
- `obligations.json` — Calendrier obligations legales

### Finances & facturation
- `finances/budget-2026.json` — Budget previsionnel annuel (modele 3 moteurs)
- `finances/quarter-YYYY-QN.json` — Donnees trimestrielles reelles
- `facturation/compteurs.json` — Numerotation sequentielle
- `facturation/devis/*.json` — Devis individuels
- `facturation/factures/*.json` — Factures individuelles

### Produits & infrastructure
- `produits.json` — Portfolio produits + pipeline + 3 moteurs + strategie commerciale
- `odoo-infrastructure.json` — Infrastructure Odoo SH Custom (~25 modules, Peppol)
- `participations.json` — Work for equity holdings

### Clients & projets
- `projets/pipeline.json` — Pipeline agence (prospects + en cours)

### Equipe & RH
- `equipe.json` — Registre personnel + freelances + allocation
- `timetracking/YYYY-MM.json` — Suivi temps mensuel

### Contrats
- `contrats/registre.json` — Index des contrats
- `contrats/cgv.json` — CGV en vigueur

### Conformite
- `rgpd/registre-traitements.json` — Registre Art. 30 RGPD (9 traitements)
- `assurances.json` — Contrats d'assurance

### Frais
- `frais/YYYY-MM.json` — Notes de frais mensuelles

---

## Identite visuelle — OBLIGATOIRE

**TOUS les documents generes** dans le cadre administratif de l'Agence ATUM doivent :
1. **Apposer le logo ATUM** — par defaut `02-identite-visuelle/ATUM LOGO V1 FOND TRANSPARENT.png`
2. **Respecter la charte graphique** — couleurs, typographies, mise en page professionnelle
3. **Presenter un rendu digne d'une agence de developpement** — pas de documents generiques

Logos disponibles dans `~/Documents/ATUM-Agency/02-identite-visuelle/` :
- `ATUM LOGO V1 FOND TRANSPARENT.png` — usage general (defaut)
- `ATUM LOGO V1 FOND BLANC.png` — fond clair
- `ATUM LOGO FOND NOIR.png` — fond sombre
- `ATUM ICONE TRANSPARENT.png` — icone seule (favicon, miniatures)
- `charte-graphique.pdf` — regles d'usage completes

Pour les documents HTML : embedder le logo en base64 dans le header.
Pour les documents DOCX (via `/docx`) : inserer l'image dans le header du document.

---

## Templates documents

13 templates dans `~/.claude/data/agence-atum/templates/` :

**Gouvernance** :
- `pv-ordinaire.md` — PV assemblee ordinaire
- `pv-extraordinaire.md` — PV assemblee extraordinaire
- `convocation.md` — Convocation associes
- `rapport-trimestriel.md` — Rapport info trimestrielle (Art. 24.2)
- `convention-reglementee.md` — Fiche convention reglementee

**Projets & clients** :
- `fiche-projet.md` — Fiche projet agence
- `devis.md` — Proposition commerciale
- `facture.md` — Facture client
- `relance.md` — Relance impaye (3 niveaux)

**Contrats** :
- `contrat-prestation.md` — Contrat de prestation de services
- `nda.md` — Accord de confidentialite
- `cgv.md` — Conditions generales de vente
- `contrat-freelance.md` — Contrat sous-traitance freelance

Generation DOCX/PDF : utiliser skill `/docx` apres remplissage des placeholders.

---

## Integration MCP

| Action | MCP Tools |
|---|---|
| Obligations → calendrier | `google-workspace: manage_event, get_events` |
| PV/decisions → Notion | `notion: API-post-page, API-patch-page` |
| Finances → Sheets | `google-workspace: modify_sheet_values, create_spreadsheet` |
| Convocation / relance par email | `google-workspace: send_gmail_message` |
| Rapport → Google Docs | `google-workspace: create_doc` |
| Devis/facture → DOCX | skill `/docx` |
| Audit OWL | MCP `atum-audit` (15 tools) |
| Airtable (pipeline, CRM) | MCP `airtable` |
| Branding / logos | Lire directement depuis `~/Documents/ATUM-Agency/02-identite-visuelle/` |
| **Sync Drive (OBLIGATOIRE)** | `google-workspace: create_drive_file, update_drive_file, create_drive_folder` |

### Synchronisation Google Drive (OBLIGATOIRE)

Apres TOUTE modification de documents administratifs ATUM (creation, edition, suppression), **synchroniser sur Google Drive** dans le dossier `ATUM SAS/` qui miroir la structure locale `~/Documents/ATUM-Agency/`.

- **Upload** : `create_drive_file` avec `fileUrl: file:///C:/Users/arnau/Documents/ATUM-Agency/...`
- **Deplacer** : `update_drive_file` avec `add_parents` / `remove_parents`
- **Creer dossier** : `create_drive_folder` avec le parent ID correspondant
- **Supprimer** : `update_drive_file` avec `trashed: true`
- **IDs de reference** : voir `memory/drive-atum.md` pour le mapping complet dossier → folder ID
- **Serialiser** les appels (pas de parallele Google Workspace MCP → SSL timeout)

---

## References detaillees

- `references/statuts-resume.md` — Resume operationnel des statuts (19 pages)
- `references/business-plan-targets.md` — Business Plan V2, objectifs financiers An1-An3, 3 moteurs
- `references/facturation-regles.md` — Regles de facturation, TVA, penalites, delais B2B, politique paiement BP V2
- `references/templates-catalog.md` — Guide d'utilisation des 13 templates avec variables
- `references/syntec-grille.md` — Convention Syntec, classifications, minima, BSPCE
- `references/rgpd-guide.md` — Guide RGPD complet, bases legales, durees conservation, droits, securite
