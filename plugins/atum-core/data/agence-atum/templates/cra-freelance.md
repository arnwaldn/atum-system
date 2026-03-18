# COMPTE-RENDU D'ACTIVITE (CRA)

**Freelance** : {{freelance_nom}} — {{freelance_statut}}
**SIRET** : {{freelance_siret}}
**Mois** : {{mois_annee}}
**Projet** : {{nom_projet}} (ref: {{ref_projet}})
**Client final** : {{client_final}}
**Referent ATUM** : {{referent_nom}}

---

## Recapitulatif

| Indicateur | Valeur |
|---|---|
| Jours travailles | **{{total_jours}}** |
| TJM HT | {{tjm}} EUR |
| Montant HT | **{{montant_ht}} EUR** |
| TVA (20%) | {{montant_tva}} EUR |
| Montant TTC | **{{montant_ttc}} EUR** |

---

## Detail par jour

| Date | Jour | Heures | Tache / Livrable | Statut |
|---|---|---|---|---|
{{#jours}}
| {{date}} | {{jour_semaine}} | {{heures}} | {{description}} | {{statut}} |
{{/jours}}

---

## Livrables du mois

{{#livrables}}
- [ ] {{description_livrable}} — {{statut_livrable}}
{{/livrables}}

---

## Commentaires

{{commentaires}}

---

## Validation

**Vise par le referent projet ATUM** :

Nom : {{referent_nom}}
Date : {{date_validation}}
Signature :


**Le Sous-Traitant** :

Nom : {{freelance_nom}}
Date : {{date_signature}}
Signature :
