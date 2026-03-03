# Catalogue des Templates — Agence ATUM

## Emplacement

Tous les templates sont dans `~/.claude/data/agence-atum/templates/`

## Utilisation

1. Lire le template avec Read
2. Remplacer les placeholders `{{variable}}` par les donnees du data store JSON
3. Pour les sections iteratives `{{#section}}...{{/section}}`, generer une ligne par element
4. Generer le document final via skill `/docx` (DOCX) ou `/pdf` (PDF)

---

## 1. PV Ordinaire (`pv-ordinaire.md`)

**Usage** : Assemblee generale ordinaire — approbation comptes, conventions reglementees, nominations.

**Quorum** : >= 50% actions presentes (500/1000)
**Majorite** : > 50% voix presentes

**Variables principales** :
- `capital`, `siege`, `rcs` — identite societe
- `date`, `annee`, `date_complete` — date seance
- `mode_reunion` — "en presentiel" / "par visioconference"
- `date_convocation` — date d'envoi convocation
- `associes[]` : `nom`, `actions`, `presence` — table composition
- `total_actions_presentes`, `total_actions` — calcul quorum
- `quorum_pct`, `quorum_atteint` — verification quorum
- `president_seance`, `secretaire` — bureau
- `resolutions[]` : `numero`, `intitule`, `texte`, `pour`, `contre`, `abstention`, `resultat`
- `heure_fin` — cloture seance

**Donnees sources** : `actionnariat.json`, `decisions/registre.json`

---

## 2. PV Extraordinaire (`pv-extraordinaire.md`)

**Usage** : Decision extraordinaire — modification statuts, capital, fusion.

**Quorum unanimite** : 100% actions
**Quorum qualifiee** : >= 66.67% actions (667/1000)
**Majorite** : 100% (unanimite) ou 75% / 66.67% voix presentes

**Variables supplementaires** (par rapport au PV ordinaire) :
- `si_unanimite` / `si_qualifiee` — selection du bloc quorum
- `type_majorite` — "(unanimite)" / "(3/4)" / "(2/3)"

**Donnees sources** : `actionnariat.json`, `decisions/registre.json`

---

## 3. Convocation (`convocation.md`)

**Usage** : Convocation des associes a une decision collective.

**Variables principales** :
- `type_decision` — "ordinaire" / "extraordinaire"
- `expediteur`, `fonction_expediteur` — qui convoque
- `destinataire`, `destinataire_civilite` — associe convoque
- `date_envoi`, `date_reunion`, `heure_reunion` — dates
- `lieu_reunion`, `mode_reunion` — lieu/mode
- `si_visio`, `lien_visio` — section conditionnelle visio
- `points[]` : `numero`, `intitule` — ordre du jour
- `documents[]` : `nom_document` — pieces jointes
- `delai_jours`, `type_delai` — 15 jours / 5 jours urgence
- `quorum_requis`, `majorite_requise` — rappel regles

**Integration MCP** : Envoyer via `google-workspace: send_gmail_message` a chaque associe.

---

## 4. Rapport Trimestriel (`rapport-trimestriel.md`)

**Usage** : Information trimestrielle obligatoire (Art. 24.2 statuts).

**Variables principales** :
- `trimestre` (Q1/Q2/Q3/Q4), `annee` — periode
- Tableau CR 3 Moteurs : `rev_agence`, `rev_odoo`, `rev_formations` (Services) + `rev_gigroute`, `rev_tradingbrain`, `rev_quicksummarize`, `rev_owl` (SaaS) + `rev_satellites` (Satellites) + `rev_equity` (Work for Equity). Chaque ligne a `bud_*`, `var_*`, `var_pct_*`. Sous-totaux : `st_services`, `st_saas`, `st_satellites`, `st_equity`
- `ca_total`, `charges_total`, `ebitda`, `marge_ebitda` — synthese + budget + variance
- `tresorerie`, `creances`, `total_actif`, `capital`, `reserves`, `dettes` — bilan simplifie
- `mois[]` : `nom`, `treso_debut`, `encaissements`, `decaissements`, `treso_fin` — tresorerie mensuelle
- KPIs : `mrr`, `arr`, `clients_gigroute`, `clients_tradingbrain`, `clients_quicksummarize`, `clients_owl`, `sites_satellites`, `projets_agence`, `tjm_moyen`, `churn`, `cac`, `ltv_cac`, `breakeven_status`
- `roadmap[]` : `produit`, `objectif`, `statut`, `commentaire` — avancement
- `risques[]` : `nom`, `probabilite`, `impact`, `description`, `mitigation`
- `opportunites[]` : `nom`, `description`

**Donnees sources** : `finances/quarter-YYYY-QN.json`, `produits.json`, `budget-2026.json`
**Archivage** : `~/Documents/ATUM-Agency/04-finances/rapports-trimestriels/`

---

## 5. Convention Reglementee (`convention-reglementee.md`)

**Usage** : Fiche de suivi des conventions entre societe et dirigeant/associe (Art. 19 statuts).

**Variables principales** :
- `numero_convention`, `date_etablissement`, `exercice`
- `parties[]` : `nom`, `qualite`, `interet` — parties a la convention
- `type_convention`, `objet`, `description` — nature
- `montant_total`, `modalites_paiement`, `duree` — conditions financieres
- `justification`, `comparaison_marche` — motivation economique
- `ref_pv`, `date_pv`, `ref_resolution` — reference decision collective
- `renouvellements[]` : suivi annuel

---

## 6. Fiche Projet (`fiche-projet.md`)

**Usage** : Fiche projet pour l'activite agence de developpement.

**Variables principales** :
- `nom_projet`, `ref_projet`, `statut` — identite projet
- `client_*` — coordonnees client
- `objectifs[]`, `livrables[]`, `hors_perimetre[]` — perimetre
- `stack_*` — stack technique
- `phases[]` : `nom`, `description`, `debut`, `fin`, `statut` — planning
- `budget_*`, `tjm_moyen`, `jours_estimes`, `marge_estimee` — budget
- `equipe[]` : `nom`, `role`, `allocation` — equipe projet
- `risques[]`, `suivi[]` — suivi

**Donnees sources** : `projets/pipeline.json`, `projets/projet-{id}.json`
