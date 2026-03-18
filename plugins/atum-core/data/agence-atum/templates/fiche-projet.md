# FICHE PROJET AGENCE

**ATUM SAS** — Agence de Developpement

---

## Projet : {{nom_projet}}

**Reference** : {{ref_projet}}
**Date de creation** : {{date_creation}}
**Statut** : {{statut}}

### Client

| Champ | Detail |
|---|---|
| Societe | {{client_societe}} |
| Contact | {{client_contact}} |
| Email | {{client_email}} |
| Telephone | {{client_telephone}} |
| Secteur | {{client_secteur}} |

### Perimetre

**Description** : {{description}}

**Objectifs** :
{{#objectifs}}
- {{description}}
{{/objectifs}}

**Livrables** :
{{#livrables}}
- {{nom}} — {{description}}
{{/livrables}}

**Hors perimetre** :
{{#hors_perimetre}}
- {{description}}
{{/hors_perimetre}}

### Stack technique

| Couche | Technologies |
|---|---|
| Frontend | {{stack_frontend}} |
| Backend | {{stack_backend}} |
| Base de donnees | {{stack_bdd}} |
| Infrastructure | {{stack_infra}} |
| Autres | {{stack_autres}} |

### Planning

| Phase | Description | Debut | Fin | Statut |
|---|---|---|---|---|
{{#phases}}
| {{nom}} | {{description}} | {{debut}} | {{fin}} | {{statut}} |
{{/phases}}

**Date debut projet** : {{date_debut}}
**Date livraison prevue** : {{date_livraison}}
**Duree estimee** : {{duree_estimee}}

### Budget

| Poste | Montant HT |
|---|---|
| Developpement | {{budget_dev}} |
| Design / UX | {{budget_design}} |
| Infrastructure | {{budget_infra}} |
| Sous-traitance | {{budget_sous_traitance}} |
| **Total** | **{{budget_total}}** |

**TJM moyen** : {{tjm_moyen}} EUR
**Jours estimes** : {{jours_estimes}}
**Marge estimee** : {{marge_estimee}}%

### Conditions commerciales

| Element | Detail |
|---|---|
| Type de contrat | {{type_contrat}} |
| Modalites de paiement | {{modalites_paiement}} |
| Acompte | {{acompte}} |
| Penalites de retard | {{penalites_retard}} |
| Garantie | {{garantie}} |

### Equipe projet

| Membre | Role | Allocation |
|---|---|---|
{{#equipe}}
| {{nom}} | {{role}} | {{allocation}} |
{{/equipe}}

### Risques

| Risque | Probabilite | Impact | Mitigation |
|---|---|---|---|
{{#risques}}
| {{nom}} | {{probabilite}} | {{impact}} | {{mitigation}} |
{{/risques}}

### Suivi

| Date | Evenement | Commentaire |
|---|---|---|
{{#suivi}}
| {{date}} | {{evenement}} | {{commentaire}} |
{{/suivi}}

---

**Responsable projet** : {{responsable}}
**Derniere mise a jour** : {{date_maj}}
