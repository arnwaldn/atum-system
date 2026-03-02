---
description: "Gestion administrative ATUM SAS — gouvernance, finances, legal, produits, pipeline"
allowed-tools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep", "Agent", "Skill", "WebFetch"]
argument-hint: "[dashboard|finance|legal|products|clients|equity|team|docs|sync|init|help] [sous-commande] [args]"
---

# Agence ATUM — Administration Operationnelle

Commande: `/agence-atum $ARGUMENTS`

## Routage

Parse `$ARGUMENTS` et execute la sous-commande appropriee. Si aucun argument, affiche le dashboard.

### Donnees sources

Toutes les donnees sont dans `~/.claude/data/agence-atum/`. Lire les fichiers JSON necessaires avant chaque operation. Les templates sont dans `~/.claude/data/agence-atum/templates/`.

Le skill `agence-atum` contient les regles metier (quorums, majorites, formules financieres, seuils). Toujours s'y referer pour les calculs et validations.

---

## Sous-commandes

### `dashboard` (defaut)
Afficher une vue d'ensemble de la societe :
1. Lire `societe.json`, `actionnariat.json`, `finances/quarter-2026-Q1.json`, `produits.json`, `obligations.json`
2. Afficher : identite, actionnariat (table), tresorerie actuelle, MRR/ARR, prochaines obligations (3 prochaines echeances), statut produits

### `finance [kpi|budget|tresorerie|dividendes|rapport]`
- **kpi** : Calculer et afficher MRR, ARR, LTV/CAC, churn depuis `finances/quarter-*.json` et `produits.json`
- **budget** : Afficher budget vs reel avec variance analysis (lire `budget-2026.json` + dernier `quarter-*.json`)
- **tresorerie** : Afficher tresorerie actuelle + prevision 6 mois (calcul encaissements - decaissements)
- **dividendes [montant_benefice]** : Simuler distribution (reserve legale 5%, statutaire 10%, repartition par associe selon %)
- **rapport [trimestre]** : Generer rapport trimestriel (remplir template `rapport-trimestriel.md` avec donnees JSON)

### `legal [pv|convocation|convention|obligations|quorum]`
- **pv [ordinaire|extraordinaire]** : Generer un PV (interactif : demander resolutions, votes, etc.). Enregistrer dans `decisions/registre.json`
- **convocation [ordinaire|extraordinaire]** : Generer convocation. Calculer automatiquement delais. Proposer envoi via Gmail MCP
- **convention [add|list]** : Gerer les conventions reglementees
- **obligations** : Afficher calendrier obligations avec statut (a venir, en retard, fait). Lire `obligations.json`
- **quorum [ordinaire|extraordinaire|unanimite] [actions_presentes]** : Calculer si quorum atteint + majorite requise

### `products [status|roadmap|metrics|add]`
- **status** : Table des produits avec statut, clients, ARR actuel vs cible. Lire `produits.json`
- **roadmap** : Afficher roadmap par trimestre avec statut avancement
- **metrics [produit]** : Metriques detaillees d'un produit (clients, churn, ARPU, LTV)
- **add** : Ajouter un produit au portfolio (interactif)

### `clients [pipeline|add|status|close]`
- **pipeline** : Afficher pipeline agence (prospects, en cours, termines). Lire `projets/pipeline.json`
- **add** : Ajouter un projet au pipeline (interactif). Creer `projets/projet-{id}.json` avec template
- **status [ref]** : Statut detaille d'un projet specifique
- **close [ref]** : Cloturer un projet (marquer termine, calculer marge finale)

### `contracts [prestation|nda|cgv|freelance|list]`
- **prestation [client]** : Generer un contrat de prestation de services. Remplir template `contrat-prestation.md`. Enregistrer dans `contrats/registre.json`
- **nda [partie]** : Generer un NDA bilateral ou unilateral. Remplir template `nda.md`. Enregistrer dans `contrats/registre.json`
- **cgv** : Afficher les CGV en vigueur depuis `contrats/cgv.json`. Generer document complet via template `cgv.md`
- **freelance [nom]** : Generer un contrat de sous-traitance freelance. Remplir template `contrat-freelance.md`. Verifier attestation URSSAF, Kbis, RC Pro
- **list** : Lister tous les contrats enregistres dans `contrats/registre.json` avec statut, client, dates, montant

### `equity [actionnariat|participation|simulation]`
- **actionnariat** : Table des associes avec %, fonctions, valeur theorique
- **participation** : Liste des participations work for equity. Lire `participations.json`
- **simulation [operation]** : Simuler augmentation de capital, entree associe, dilution

### `billing [devis|facture|relance|suivi|avoir]`
- **devis [client]** : Generer un devis/proposition commerciale. Incrementer compteur dans `facturation/compteurs.json`, remplir template `devis.md`, sauvegarder `facturation/devis/devis-YYYY-NNN.json`. Mode interactif : demander client, prestations, conditions
- **facture [ref_devis]** : Generer une facture. Si ref_devis fourni, pre-remplir depuis le devis. Incrementer compteur, remplir template `facture.md`, sauvegarder `facturation/factures/facture-YYYY-NNN.json`. Verifier mentions Art. 289 CGI
- **relance** : Scanner factures impayees (echeance depassee). Pour chaque facture en retard, proposer le niveau de relance (amiable J+7, ferme J+15, mise en demeure J+30). Remplir template `relance.md`. Proposer envoi via Gmail MCP
- **suivi** : Afficher balance clients — table des factures emises avec statut (payee, en attente, en retard), montants, jours de retard. Lire tous les fichiers `facturation/factures/*.json`
- **avoir [ref_facture]** : Generer un avoir. Incrementer compteur avoirs, reference a facture d'origine obligatoire. Montants en negatif

Regles facturation : voir `references/facturation-regles.md` pour mentions legales, TVA, penalites, delais B2B.

### `team [personnel|freelances|timetrack|capacite|roles|remuneration|bspce]`
- **personnel** : Afficher registre unique du personnel depuis `equipe.json`. Table des entrees/sorties, contrats, qualifications Syntec
- **freelances** : Lister prestataires externes actifs depuis `equipe.json`. Verifier attestations (URSSAF, Kbis, RC Pro)
- **timetrack [mois] [personne]** : Saisir ou consulter le timetracking. Lire/ecrire `timetracking/YYYY-MM.json`. Si mois non precise, mois courant. Afficher par personne/projet avec totaux jours
- **capacite** : Afficher capacite equipe — jours disponibles par personne, taux d'occupation, charge previsionnelle. Croiser `equipe.json` + `timetracking/` + `projets/pipeline.json`
- **roles** : Organigramme et roles des associes/employes avec classification Syntec. Lire `equipe.json` + `actionnariat.json`
- **remuneration** : Grille de remuneration avec minima Syntec. Lire `references/syntec-grille.md` + `equipe.json`. Calculer cout employeur (brut x 1.50)
- **bspce** : Simulation BSPCE — pool, vesting, valorisation. Lire `references/syntec-grille.md` section BSPCE

### `compliance [rgpd|assurances|syntec]`
- **rgpd [registre|droits|audit|dpa]** : Gestion RGPD. `registre` affiche le registre des traitements. `droits` affiche la procedure exercice des droits. `audit` checklist conformite. `dpa` genere un DPA pour un client
- **assurances** : Afficher les contrats d'assurance depuis `assurances.json`. Alerter sur ceux a souscrire (statut urgent). Suivi renouvellements
- **syntec** : Afficher la grille Syntec et la correspondance equipe ATUM. Lire `references/syntec-grille.md`

### `frais [add|list|valider|rapport]`
- **add** : Saisir une note de frais (interactif : date, montant, categorie, justificatif, projet). Ecrire dans `frais/YYYY-MM.json`
- **list [mois]** : Lister les notes de frais du mois. Si pas de mois, mois courant
- **valider [id]** : Valider/refuser une note de frais (changer statut)
- **rapport [mois]** : Synthese mensuelle par categorie et par personne

### `docs [generate|list|search]`
- **generate [type]** : Generer un document (pv-ordinaire, pv-extraordinaire, convocation, rapport-trimestriel, convention-reglementee, fiche-projet). Remplir le template puis invoquer skill `/docx` pour DOCX
- **list** : Lister les documents generes (PV, rapports) depuis `decisions/registre.json`
- **search [terme]** : Rechercher dans les PV et decisions

### `sync [notion|calendar|sheets]`
- **calendar** : Pousser obligations legales vers Google Calendar via MCP `google-workspace`
- **notion** : Pousser PV et decisions vers Notion via MCP `notion`
- **sheets** : Pousser donnees financieres vers Google Sheets via MCP `google-workspace`

### `init`
Verifier et initialiser le data store :
1. Verifier que tous les fichiers JSON existent dans `~/.claude/data/agence-atum/`
2. Afficher un rapport de sante (fichiers presents/manquants, derniere MAJ)

### `help`
Afficher la liste des sous-commandes avec description courte et exemples :
```
/agence-atum dashboard          — Vue d'ensemble
/agence-atum finance kpi        — KPIs financiers
/agence-atum finance dividendes 770000  — Simulation dividendes
/agence-atum legal pv ordinaire — Generer PV AG ordinaire
/agence-atum legal quorum ordinaire 700 — Verifier quorum
/agence-atum products status    — Statut portfolio produits
/agence-atum billing devis       — Generer un devis
/agence-atum billing facture D-2026-001 — Facturer depuis devis
/agence-atum billing relance    — Relances factures impayees
/agence-atum billing suivi      — Balance clients
/agence-atum clients pipeline   — Pipeline agence
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

## Pour les operations complexes

Utiliser l'agent `agence-atum-expert` (via Agent tool, subagent_type="general-purpose") pour :
- Generation de PV complets avec calcul de quorum
- Simulations financieres complexes (dilution, valorisation)
- Rapports trimestriels complets avec variance analysis
- Synchronisation MCP multi-services
