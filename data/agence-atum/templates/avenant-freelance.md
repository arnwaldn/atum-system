# AVENANT N°{{numero_avenant}} AU CONTRAT DE SOUS-TRAITANCE

**Reference contrat initial** : {{ref_contrat}}
**Date du contrat initial** : {{date_contrat_initial}}

---

**Entre les soussignes :**

**ATUM SAS**, representee par {{auteur}}, en qualite de {{fonction}}
Ci-apres designee « **le Donneur d'Ordre** »

**Et :**

**{{freelance_nom}}**, {{freelance_statut}}
SIRET : {{freelance_siret}}
Ci-apres designe(e) « **le Sous-Traitant** »

---

## Objet de l'avenant

Le present avenant a pour objet de modifier les conditions suivantes du contrat initial :

{{#si_prolongation}}
### Prolongation de la mission
La date de fin de mission est repoussee du **{{ancienne_date_fin}}** au **{{nouvelle_date_fin}}**.
{{/si_prolongation}}

{{#si_modification_tjm}}
### Modification du TJM
Le TJM est modifie de **{{ancien_tjm}} EUR HT/jour** a **{{nouveau_tjm}} EUR HT/jour**, a compter du **{{date_effet_tjm}}**.
{{/si_modification_tjm}}

{{#si_modification_mission}}
### Modification du perimetre de mission
Le perimetre de la mission est modifie comme suit :

**Ancien perimetre** : {{ancien_perimetre}}
**Nouveau perimetre** : {{nouveau_perimetre}}
{{/si_modification_mission}}

{{#si_changement_projet}}
### Changement de projet
Le Sous-Traitant est realloue du projet **{{ancien_projet}}** au projet **{{nouveau_projet}}**.
Client final : {{nouveau_client_final}}
{{/si_changement_projet}}

---

## Dispositions inchangees

Toutes les autres clauses et conditions du contrat initial restent inchangees et en vigueur.

---

## Signatures

Fait en deux exemplaires originaux, a {{lieu}}, le {{date_avenant}}.

**Pour ATUM SAS — Donneur d'Ordre**

Nom : {{auteur}}
Fonction : {{fonction}}
Signature :


**Le Sous-Traitant**

Nom : {{freelance_nom}}
SIRET : {{freelance_siret}}
Signature :
