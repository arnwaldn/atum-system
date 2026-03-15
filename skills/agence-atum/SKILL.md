---
name: agence-atum
description: |
  Gestion administrative ATUM SAS — societe par actions simplifiee a capital variable.
  Use when: agence, societe, ATUM SAS, associes, actionnariat, PV, convocation, dividendes,
  tresorerie, pipeline agence, work for equity, obligations legales, rapport trimestriel,
  quorum, majorite, capital social, convention reglementee, BSPCE, reserve legale.
metadata:
  triggers: agence, atum sas, societe, la boite, associes, actionnariat, PV, proces-verbal, convocation, dividendes, tresorerie, pipeline agence, work for equity, obligations, rapport trimestriel, quorum, majorite, capital social, agency, shareholders, quarterly report, convention reglementee, reserve legale, affectation resultat, depot comptes, devis, facture, facturer, relance, impaye, retard paiement, contrat client, prestation services, NDA, confidentialite, CGV, conditions generales, freelance, sous-traitant, equipe, embauche, registre personnel, timetracking, temps passe, feuille de temps, RGPD, donnees personnelles, registre traitements, DPA, assurance, RC Pro, note de frais, Syntec, convention collective, grille salariale
---

# ATUM SAS — Administration Operationnelle

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
| Objet | Dev logiciel & IA, agence, incubation, SaaS |

## Actionnariat

| Associe | Actions | % | Fonction |
|---|---|---|---|
| Arnaud Porcel | 400 | 40% | President (CEO/CTO) |
| Pablo Macia | 300 | 30% | DG (CFO/COO/CMO) |
| Wahid Chebira | 300 | 30% | Directeur Contenu (CCO) |

**Clause d'inalienabilite** : Jusqu'au 31/12/2028 (3 ans). Aucune cession, nantissement ou apport des actions pendant cette periode.

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

## Calendrier obligations

| Echeance | Obligation | Type |
|---|---|---|
| J+15 apres fin trim. | Information trimestrielle associes | Rapport (Art. 24.2) |
| 15 mai | Declaration IS / liasse fiscale | Fiscal |
| 30 juin | AG approbation comptes annuels | Gouvernance |
| J+30 apres AG | Depot comptes au greffe RCS | Legal |
| Mensuel/Trimestriel | Declaration TVA | Fiscal |
| Annuel | Verification seuils CAC | Legal |

## Facturation

### Regles
- Numerotation sequentielle sans trou (Art. 289 CGI)
- Compteurs dans `facturation/compteurs.json`
- Mentions legales obligatoires : SIREN, TVA intracom, taux TVA, penalites, indemnite 40 EUR
- Reference : `references/facturation-regles.md`

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
| Amiable | J+7 echeance | `relance.md` §amiable |
| Ferme | J+15 | `relance.md` §ferme |
| Mise en demeure | J+30 | `relance.md` §mise_en_demeure |
| Recouvrement | J+45 | Conseil juridique |

## Contrats

### Types
| Type | Template | Registre |
|---|---|---|
| Prestation de services | `contrat-prestation.md` | `contrats/registre.json` |
| NDA | `nda.md` | `contrats/registre.json` |
| CGV | `cgv.md` | `contrats/cgv.json` |
| Sous-traitance freelance | `contrat-freelance.md` | `contrats/registre.json` |
| Avenant freelance | `avenant-freelance.md` | `contrats/registre.json` |
| Bon de commande freelance | `bon-commande-freelance.md` | `contrats/registre.json` |
| CRA freelance | `cra-freelance.md` | — |

### CGV
- Obligatoire B2B (loi Hamon 2014, Art. L441-1)
- Version en vigueur dans `contrats/cgv.json`
- Annexees a chaque devis et facture

## Cycle de vie freelance

### Workflow onboarding (7 etapes)
1. Collecte infos (identite, SIRET, statut juridique, TJM, specialite, competences)
2. Verification attestations (URSSAF vigilance, Kbis < 3 mois, RC Pro)
3. Creation entree `equipe.json` → `freelances.actifs[]` (compteur FL-NNN)
4. Generation contrat sous-traitance (`contrat-freelance.md`)
5. Enregistrement `contrats/registre.json` (type: freelance, compteur CT-YYYY-NNN)
6. Allocation projet (`projet_actuel` + `allocation.projets_en_cours`)
7. Recapitulatif complet

### Suivi attestations
| Attestation | Validite | Alerte |
|---|---|---|
| URSSAF vigilance | 6 mois | < 30 jours avant expiration |
| Kbis / equivalent | 3 mois | < 15 jours avant expiration |
| RC Pro | Annuelle | < 30 jours avant expiration |

Schedule mensuel : `freelance-attestation-check` (1er du mois, 9h)

### Marge freelance
```
cout_freelance = jours_travailles * tjm_freelance
revenu_client = jours_travailles * tjm_client
marge_eur = revenu_client - cout_freelance
marge_pct = marge_eur / revenu_client * 100
```

### Alerte requalification
Si un freelance travaille exclusivement pour ATUM > 12 mois consecutifs → risque de requalification en salariat (Art. L8221-6 Code du travail). L'agent `freelance-manager` surveille cette situation.

### Agent dedie
`freelance-manager` (Sonnet) — orchestre le cycle complet. Utiliser via Agent tool pour les operations complexes (onboarding multi-etapes, calcul marge portefeuille, audit attestations).

## Convention Syntec (IDCC 1486)

- Classification : ETAM (employes) + IC (cadres)
- Forfait jours cadres : 218 jours/an
- Conges : 25 CP + ~10 RTT
- Prevoyance cadres : obligatoire (1.50% tranche A)
- Mutuelle : obligatoire (50% employeur)
- Reference : `references/syntec-grille.md`

## RGPD

- Registre des traitements (Art. 30) : `rgpd/registre-traitements.json`
- 7 traitements identifies (prospects, RH, TourFlow, TradingBrain, Quick Summarize, site web, projets client)
- ATUM = responsable de traitement OU sous-traitant selon contexte
- DPA obligatoire quand sous-traitant (SaaS, projets client)
- Reference : `references/rgpd-guide.md`

## Assurances

| Type | Statut | Priorite |
|---|---|---|
| RC Pro | A souscrire | CRITIQUE |
| Cyber assurance | Recommande | HAUTE |
| Prevoyance cadres | Obligatoire des 1er salarie IC | HAUTE |
| Mutuelle | Obligatoire des 1er salarie | HAUTE |
| Multirisque bureaux | Si locaux | MOYENNE |

Data : `assurances.json`

## Data store

Toutes les donnees sont dans `~/.claude/data/agence-atum/` :
- `societe.json` — Identite societe
- `actionnariat.json` — Registre associes et mouvements
- `finances/budget-2026.json` — Budget previsionnel annuel
- `finances/quarter-YYYY-QN.json` — Donnees trimestrielles reelles
- `produits.json` — Portfolio produits + pipeline
- `projets/pipeline.json` — Pipeline agence (prospects + en cours)
- `participations.json` — Work for equity holdings
- `obligations.json` — Calendrier obligations legales
- `decisions/registre.json` — Index des PV et decisions
- `facturation/compteurs.json` — Numerotation sequentielle
- `facturation/devis/*.json` — Devis individuels
- `facturation/factures/*.json` — Factures individuelles
- `contrats/registre.json` — Index des contrats
- `contrats/cgv.json` — CGV en vigueur
- `equipe.json` — Registre personnel + freelances + allocation
- `timetracking/YYYY-MM.json` — Suivi temps mensuel
- `rgpd/registre-traitements.json` — Registre Art. 30 RGPD
- `assurances.json` — Contrats d'assurance
- `frais/YYYY-MM.json` — Notes de frais mensuelles

## Templates documents

9 templates dans `~/.claude/data/agence-atum/templates/` :
- `pv-ordinaire.md` — PV assemblee ordinaire
- `pv-extraordinaire.md` — PV assemblee extraordinaire
- `convocation.md` — Convocation associes
- `rapport-trimestriel.md` — Rapport info trimestrielle (Art. 24.2)
- `convention-reglementee.md` — Fiche convention reglementee
- `fiche-projet.md` — Fiche projet agence
- `avenant-freelance.md` — Avenant au contrat de sous-traitance freelance
- `cra-freelance.md` — Compte-rendu d'activite mensuel freelance
- `bon-commande-freelance.md` — Bon de commande prestation freelance

Generation DOCX/PDF : utiliser skill `/docx` apres remplissage des placeholders.

## Integration MCP

| Action | MCP Tools |
|---|---|
| Obligations → calendrier | `google-workspace: manage_event, get_events` |
| PV/decisions → Notion | `notion: API-post-page, API-patch-page` |
| Finances → Sheets | `google-workspace: modify_sheet_values, create_spreadsheet` |
| Convocation par email | `google-workspace: send_gmail_message` |
| Rapport → Google Docs | `google-workspace: create_doc` |

## References detaillees

- `references/statuts-resume.md` — Resume operationnel des statuts
- `references/business-plan-targets.md` — Objectifs financiers An1-An3
- `references/templates-catalog.md` — Guide d'utilisation des templates
