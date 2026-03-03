---
description: "Gestion administrative ATUM SAS — gouvernance, finances, legal, produits, pipeline, Odoo, strategie"
allowed-tools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep", "Agent", "Skill", "WebFetch"]
argument-hint: "[dashboard|finance|legal|products|clients|equity|team|docs|sync|odoo|satellites|strategy|branding|init|help] [sous-commande] [args]"
---

# Agence ATUM — Administration Operationnelle (BP V2)

Commande: `/agence-atum $ARGUMENTS`

## Architecture double

| Couche | Emplacement | Usage |
|--------|-------------|-------|
| **Data store** (JSON structure) | `~/.claude/data/agence-atum/` | Donnees structurees pour Claude Code |
| **Workspace operationnel** | `~/Documents/ATUM-Agency/` | Documents clients, contrats generes, suivi humain |
| **Identite visuelle** | `~/Documents/ATUM-Agency/02-identite-visuelle/` | Logos PNG, icones, charte graphique PDF |
| **Documents fondateurs** | `~/Documents/ATUM-Agency/01-fondateurs/` | Statuts PDF, pacte associes, BP PDF, strategie |
| **Skill & references** | `~/.claude/skills/agence-atum/` | Regles metier, references, templates |

## Routage

Parse `$ARGUMENTS` et execute la sous-commande appropriee. Si aucun argument, affiche le dashboard.

### Donnees sources

- **Data store JSON** : `~/.claude/data/agence-atum/` — lire les fichiers JSON necessaires avant chaque operation
- **Templates** : `~/.claude/data/agence-atum/templates/`
- **Workspace clients** : `~/Documents/ATUM-Agency/07-clients/` — dossiers clients operationnels
- **Prospects** : `~/Documents/ATUM-Agency/08-prospects/pipeline.md`
- **Gouvernance** : `~/Documents/ATUM-Agency/03-gouvernance/` — PV, convocations, conventions
- **Finances** : `~/Documents/ATUM-Agency/04-finances/` — rapports, bilans, suivi
- **Facturation** : `~/Documents/ATUM-Agency/05-facturation/` — devis, factures, relances
- **Contrats** : `~/Documents/ATUM-Agency/06-contrats/` — contrats signes par type
- **Equipe** : `~/Documents/ATUM-Agency/09-equipe/` — registre, timetracking, frais
- **Conformite** : `~/Documents/ATUM-Agency/10-conformite/` — RGPD, assurances
- **Produits** : `~/Documents/ATUM-Agency/11-produits/` — catalogue, docs produits
- **Config locale** : `~/Documents/ATUM-Agency/atum.local.md`
- **Identite visuelle** : `~/Documents/ATUM-Agency/02-identite-visuelle/` — logos pour documents generes

Le skill `agence-atum` contient les regles metier (quorums, majorites, formules financieres, seuils). Toujours s'y referer pour les calculs et validations.

---

## Sous-commandes

### `dashboard` (defaut)
Afficher une vue d'ensemble de la societe :
1. Lire `societe.json`, `actionnariat.json`, `finances/quarter-2026-Q1.json`, `produits.json`, `obligations.json`, `budget-2026.json`
2. Afficher :
   - Identite societe + actionnariat (table)
   - **Vue 3 Moteurs** : Services | SaaS | Satellites — CA reel vs budget par moteur
   - Tresorerie actuelle + burn rate
   - MRR/ARR par produit SaaS
   - Pipeline agence (nombre projets, CA en cours)
   - Prochaines obligations (3 prochaines echeances)
   - Statut produits (live, en dev, pipeline)
   - Alerte si variance > 10% sur un moteur

### `finance [kpi|budget|tresorerie|dividendes|rapport|moteurs]`
- **kpi** : Calculer et afficher MRR, ARR, LTV/CAC, churn depuis `finances/quarter-*.json` et `produits.json`
- **budget** : Afficher budget vs reel avec variance analysis par moteur (lire `budget-2026.json` + dernier `quarter-*.json`). Seuils : > +/- 10% = justification, > +/- 25% = plan d'action
- **tresorerie** : Afficher tresorerie actuelle + prevision 6 mois (calcul encaissements - decaissements)
- **dividendes [montant_benefice]** : Simuler distribution (reserve legale 5%, statutaire 10%, repartition par associe selon %). Rappel : pas de dividendes An1 (bootstrap)
- **rapport [trimestre]** : Generer rapport trimestriel (remplir template `rapport-trimestriel.md` avec donnees JSON)
- **moteurs** : Vue synthetique des 3 moteurs de revenus — CA reel vs cible, % contribution, progression

### `legal [pv|convocation|convention|obligations|quorum]`
- **pv [ordinaire|extraordinaire]** : Generer un PV (interactif : demander resolutions, votes, etc.). Enregistrer dans `decisions/registre.json`
- **convocation [ordinaire|extraordinaire]** : Generer convocation. Calculer automatiquement delais. Proposer envoi via Gmail MCP
- **convention [add|list]** : Gerer les conventions reglementees
- **obligations** : Afficher calendrier obligations avec statut (a venir, en retard, fait). Lire `obligations.json`
- **quorum [ordinaire|extraordinaire|unanimite] [actions_presentes]** : Calculer si quorum atteint + majorite requise

### `products [status|roadmap|metrics|add]`
- **status** : Table des produits avec statut, clients, ARR actuel vs cible. Inclure les 3 moteurs. Lire `produits.json`
- **roadmap** : Afficher roadmap par trimestre avec statut avancement. Vue: Q1 (GigRoute, QS, OWL) → Q2 (TradingBrain) → Q3-Q4 (pipeline)
- **metrics [produit]** : Metriques detaillees d'un produit (clients, churn, ARPU, LTV, MRR, conversion trial→paid)
- **add** : Ajouter un produit au portfolio (interactif)

### `clients [pipeline|add|status|close|workspace]`
- **pipeline** : Afficher pipeline agence (prospects, en cours, termines). Lire `projets/pipeline.json` + `~/Documents/ATUM-Agency/08-prospects/pipeline.md`
- **add** : Ajouter un projet au pipeline. Creer `projets/projet-{id}.json` + dossier client dans `~/Documents/ATUM-Agency/07-clients/` (copier `_template-client/`)
- **status [ref]** : Statut detaille d'un projet specifique
- **close [ref]** : Cloturer un projet (marquer termine, calculer marge finale, archiver dans `_archive/`)
- **workspace [client]** : Ouvrir/lister le dossier workspace d'un client dans `~/Documents/ATUM-Agency/07-clients/`

### `contracts [prestation|nda|cgv|freelance|list]`
- **prestation [client]** : Generer un contrat de prestation. Utiliser template `~/.claude/data/agence-atum/templates/contrat-prestation.md`. Enregistrer dans `contrats/registre.json`. Sauvegarder dans `~/Documents/ATUM-Agency/06-contrats/prestations/`
- **nda [partie]** : Generer un NDA. Template `nda.md`. Enregistrer dans `contrats/registre.json`
- **cgv** : Afficher les CGV en vigueur depuis `contrats/cgv.json`. Generer document complet via template `cgv.md`
- **freelance [nom]** : Generer un contrat de sous-traitance freelance. Verifier attestation URSSAF, Kbis, RC Pro
- **list** : Lister tous les contrats enregistres dans `contrats/registre.json` avec statut, client, dates, montant

### `equity [actionnariat|participation|simulation]`
- **actionnariat** : Table des associes avec %, fonctions, valeur theorique
- **participation** : Liste des participations work for equity. Lire `participations.json`
- **simulation [operation]** : Simuler augmentation de capital, entree associe, dilution

### `billing [devis|facture|relance|suivi|avoir]`
- **devis [client]** : Generer un devis. Appliquer la politique de paiement BP V2 :
  - Services < 1 000 EUR : 100% a la commande
  - Services 1 000 - 5 000 EUR : 50% commande + 50% livraison
  - Services > 5 000 EUR : echeancier proportionnel (40-50% commande + jalons + solde)
  - Regie (TJM) : mensuel, 30 jours
  Incrementer compteur dans `facturation/compteurs.json`. Sauvegarder dans `facturation/devis/` ET `~/Documents/ATUM-Agency/07-clients/{client}/propositions/`
- **facture [ref_devis]** : Generer une facture. Si ref_devis fourni, pre-remplir depuis le devis. Verifier mentions Art. 289 CGI. Sauvegarder dans `facturation/factures/` ET `~/Documents/ATUM-Agency/07-clients/{client}/factures/`
- **relance** : Scanner factures impayees. Proposer le niveau de relance (amiable J+7, ferme J+15, mise en demeure J+30). Proposer envoi via Gmail MCP
- **suivi** : Balance clients — table des factures avec statut (payee, en attente, en retard), montants, jours de retard
- **avoir [ref_facture]** : Generer un avoir. Reference facture d'origine obligatoire

Regles facturation : voir `references/facturation-regles.md` pour mentions legales, TVA, penalites, delais B2B.

### `team [personnel|freelances|timetrack|capacite|roles|remuneration|bspce]`
- **personnel** : Afficher registre unique du personnel depuis `equipe.json`. An1 : 3 associes, 0 salaries (bootstrap)
- **freelances** : Lister prestataires externes actifs depuis `equipe.json`. Verifier attestations (URSSAF, Kbis, RC Pro)
- **timetrack [mois] [personne]** : Saisir ou consulter le timetracking. Lire/ecrire `timetracking/YYYY-MM.json` + `~/Documents/ATUM-Agency/07-clients/{client}/projets/{projet}/time-log.md`
- **capacite** : Afficher capacite equipe — jours disponibles par personne, taux d'occupation, charge previsionnelle
- **roles** : Organigramme — Arnaud (CEO/CTO 40%), Pablo (DG/CFO/COO/CMO 30%), Wahid (CCO 30%)
- **remuneration** : Grille de remuneration avec minima Syntec. An1 : non salaries, sans remuneration fixe
- **bspce** : Simulation BSPCE — pool, vesting, valorisation

### `compliance [rgpd|assurances|syntec]`
- **rgpd [registre|droits|audit|dpa]** : Gestion RGPD. `registre` affiche les 9 traitements. `droits` affiche la procedure. `audit` checklist conformite. `dpa` genere un DPA pour un client (GigRoute, OWL, projets agence)
- **assurances** : Afficher les contrats d'assurance depuis `assurances.json`. Alerter sur ceux a souscrire
- **syntec** : Afficher la grille Syntec et la correspondance equipe ATUM

### `frais [add|list|valider|rapport]`
- **add** : Saisir une note de frais (date, montant, categorie, justificatif, projet). Ecrire dans `frais/YYYY-MM.json`
- **list [mois]** : Lister les notes de frais du mois
- **valider [id]** : Valider/refuser une note de frais
- **rapport [mois]** : Synthese mensuelle par categorie et par personne

### `odoo [status|modules|sites|deploy|config]`
- **status** : Afficher configuration Odoo SH actuelle. Lire `odoo-infrastructure.json`. Version, modules actifs, statut Peppol, sites deployes
- **modules** : Lister les ~25 modules valides par categorie (ERP, CRM, RH, Marketing, Website, Support, BI)
- **sites** : Lister les sites Odoo deployes pour clients (objectif : 10/an). Statut de chaque instance
- **deploy [client]** : Checklist de deploiement Odoo pour un nouveau client (config, modules, branding, domaine, Peppol)
- **config** : Afficher la config multi-devises (EUR/USD/GBP) et multi-langues (FR/EN/ES/DE)

### `satellites [status|add|revenue|seo]`
- **status** : Afficher les sites satellites actifs. Lire `produits.json` section `sites_satellites`. Objectif An1 : 10 sites
- **add** : Ajouter un site satellite au portfolio (nom, niche, monetisation, URL, statut)
- **revenue** : Revenus satellites — AdSense + affiliation. CA reel vs cible (40 000 EUR An1)
- **seo** : Metriques SEO par site (trafic, DA, keywords)

### `strategy [demo|pipeline|forecast|kpi]`
- **demo [vertical]** : Generer le workflow "Le produit EST la demo" pour un vertical (sites, owl, odoo, apps, formation). Afficher les 5 etapes : generer V1 → URL temp → preview link → bouton Stripe → auto-deploy
- **pipeline** : Vue pipeline commercial par vertical. Taux de conversion demo → client
- **forecast [mois]** : Projection CA sur N mois par moteur. Calcul MRR growth rate
- **kpi** : KPIs cibles An1 vs actuel (MRR 149K, clients par produit, churn < 5%, CAC < 50 EUR, LTV/CAC > 10, breakeven Q2)

### `branding [logos|charte|assets]`
- **logos** : Lister les assets visuels dans `~/Documents/ATUM-Agency/02-identite-visuelle/`. Afficher les fichiers disponibles (PNG transparent, fond noir, fond blanc, icone, PDF)
- **charte** : Lire et afficher le PDF de charte graphique (couleurs, typographies, regles d'usage)
- **assets** : Inventaire complet des assets visuels (logos, icones, documents fondateurs)

### `docs [generate|list|search]`
- **generate [type]** : Generer un document (pv-ordinaire, pv-extraordinaire, convocation, rapport-trimestriel, convention-reglementee, fiche-projet, devis, facture, contrat-prestation, nda, cgv, contrat-freelance). Remplir le template puis invoquer skill `/docx` pour DOCX. Sauvegarder aussi dans `~/Documents/ATUM-Agency/` au bon emplacement
- **list** : Lister les documents generes (PV, rapports) depuis `decisions/registre.json`
- **search [terme]** : Rechercher dans les PV et decisions

### `sync [notion|calendar|sheets|workspace]`
- **calendar** : Pousser obligations legales vers Google Calendar via MCP `google-workspace`
- **notion** : Pousser PV et decisions vers Notion via MCP `notion`
- **sheets** : Pousser donnees financieres vers Google Sheets via MCP `google-workspace`
- **workspace** : Synchroniser le data store JSON vers `~/Documents/ATUM-Agency/` (generer des vues markdown lisibles des JSON)

### `init`
Verifier et initialiser le data store + workspace :
1. Verifier que tous les fichiers JSON existent dans `~/.claude/data/agence-atum/`
2. Verifier que `~/Documents/ATUM-Agency/` existe avec la structure attendue
3. Verifier que `atum.local.md` est rempli (pas de "[A CONFIGURER]" restant)
4. Afficher un rapport de sante (fichiers presents/manquants, derniere MAJ, coherence)

### `help`
Afficher la liste des sous-commandes avec description courte et exemples :
```
/agence-atum dashboard          — Vue d'ensemble avec 3 moteurs
/agence-atum finance kpi        — KPIs financiers
/agence-atum finance moteurs    — Vue revenus par moteur
/agence-atum finance dividendes 770000  — Simulation dividendes
/agence-atum legal pv ordinaire — Generer PV AG ordinaire
/agence-atum legal quorum ordinaire 700 — Verifier quorum
/agence-atum products status    — Statut portfolio produits
/agence-atum billing devis       — Generer un devis (politique BP V2)
/agence-atum billing facture D-2026-001 — Facturer depuis devis
/agence-atum billing relance    — Relances factures impayees
/agence-atum billing suivi      — Balance clients
/agence-atum clients pipeline   — Pipeline agence
/agence-atum clients workspace NomClient — Dossier client
/agence-atum odoo status        — Config Odoo SH
/agence-atum odoo sites         — Sites Odoo deployes
/agence-atum satellites status  — Sites satellites actifs
/agence-atum strategy demo sites — Workflow demo vertical sites
/agence-atum strategy kpi       — KPIs cibles An1 vs actuel
/agence-atum branding logos     — Assets visuels disponibles
/agence-atum docs generate rapport-trimestriel — Generer rapport Q
/agence-atum sync calendar      — Synchro obligations → Google Calendar
```

---

## Regles de fonctionnement

1. **Toujours lire les donnees JSON** avant d'afficher ou calculer quoi que ce soit
2. **Immutabilite** : ne jamais modifier un JSON en place, toujours reecrire le fichier complet avec Write
3. **Validation juridique** : pour les operations legal, toujours verifier quorum et majorite selon les regles du skill
4. **Horodatage** : mettre a jour `updated_at` dans chaque JSON modifie
5. **Registre** : chaque PV genere doit etre enregistre dans `decisions/registre.json` avec un ID incrementiel
6. **Format monnaie** : EUR, espaces comme separateur de milliers, 2 decimales
7. **Langue** : francais pour tous les documents et affichages
8. **Double sauvegarde** : les documents generes (devis, factures, contrats) sont sauvegardes dans le data store JSON ET dans le workspace `~/Documents/ATUM-Agency/`
9. **Politique paiement BP V2** : toujours appliquer les paliers (< 1K, 1-5K, > 5K) pour les devis services
10. **Bootstrap An1** : zero salaries, zero dividendes, reinvestissement total
11. **Identite visuelle obligatoire** : TOUS les documents generes (devis, factures, contrats, PV, rapports, relances) DOIVENT apposer le logo ATUM et respecter la charte graphique. Logo : `~/Documents/ATUM-Agency/02-identite-visuelle/ATUM LOGO V1 FOND TRANSPARENT.png` (defaut) ou fond blanc/noir selon contexte. Presentation professionnelle digne d'une agence de developpement
12. **Sauvegarde workspace** : documents gouvernance dans `03-gouvernance/`, finances dans `04-finances/`, facturation dans `05-facturation/`, contrats dans `06-contrats/`

## Pour les operations complexes

Utiliser l'agent `agence-atum-expert` (via Agent tool, subagent_type="general-purpose") pour :
- Generation de PV complets avec calcul de quorum
- Simulations financieres complexes (dilution, valorisation)
- Rapports trimestriels complets avec variance analysis
- Synchronisation MCP multi-services
- Deploiement Odoo multi-sites
