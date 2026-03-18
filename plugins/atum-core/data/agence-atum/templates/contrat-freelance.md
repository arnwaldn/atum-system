# CONTRAT DE SOUS-TRAITANCE — PRESTATION FREELANCE

**Entre les soussignes :**

**ATUM SAS**, Societe par Actions Simplifiee au capital de {{capital}} euros
Siege social : {{siege}}
RCS : {{rcs}} | SIRET : {{siret}}
Representee par {{auteur}}, en qualite de {{fonction}}
Ci-apres designee « **le Donneur d'Ordre** »

**Et :**

**{{freelance_nom}}**
{{freelance_statut}} (micro-entreprise / EURL / SASU / portage salarial)
SIRET : {{freelance_siret}}
Domicilie(e) : {{freelance_adresse}}
Ci-apres designe(e) « **le Sous-Traitant** »

---

## Article 1 — Objet

Le Donneur d'Ordre confie au Sous-Traitant la realisation des prestations suivantes :

**Projet** : {{nom_projet}}
**Mission** : {{description_mission}}

{{#si_ref_projet}}
Reference projet ATUM : {{ref_projet}}
Client final : {{client_final}} (le Sous-Traitant n'a pas de lien contractuel direct avec le client final)
{{/si_ref_projet}}

---

## Article 2 — Duree

La mission debute le **{{date_debut}}** et se termine le **{{date_fin}}**.

{{#si_renouvelable}}
Le contrat est renouvelable par avenant ecrit.
{{/si_renouvelable}}

---

## Article 3 — Remuneration

### 3.1 Tarification

{{#si_tjm}}
Le Sous-Traitant est remunere sur la base d'un Taux Journalier Moyen (TJM) de **{{tjm}} EUR HT/jour**.
Une journee = {{heures_par_jour}} heures de travail effectif.
{{/si_tjm}}

{{#si_forfait}}
Le prix forfaitaire de la mission est de **{{montant_forfait}} EUR HT**.
{{/si_forfait}}

### 3.2 Facturation
Le Sous-Traitant adresse ses factures {{frequence_facturation}} au Donneur d'Ordre, accompagnees d'un releve d'activite (timesheet) vise par le referent projet.

### 3.3 Paiement
Le paiement est effectue par virement bancaire dans un delai de **{{delai_paiement}} jours** a compter de la reception de la facture conforme.

### 3.4 Frais
{{#si_frais}}
Les frais de deplacement et d'hebergement sont rembourses sur presentation de justificatifs, dans la limite de {{plafond_frais}} EUR/mois.
{{/si_frais}}
{{#si_pas_frais}}
Aucun frais complementaire n'est pris en charge par le Donneur d'Ordre.
{{/si_pas_frais}}

---

## Article 4 — Independance

### 4.1 Statut
Le Sous-Traitant exerce son activite en toute independance. Il n'existe aucun lien de subordination entre les Parties. Le Sous-Traitant organise librement son travail.

### 4.2 Obligations sociales et fiscales
Le Sous-Traitant assume l'integralite de ses obligations sociales, fiscales et administratives. Il garantit le Donneur d'Ordre contre tout recours a ce titre.

### 4.3 Attestations
Le Sous-Traitant fournit a la signature du contrat :
- Attestation de vigilance URSSAF en cours de validite
- Extrait Kbis ou equivalent de moins de 3 mois
- Attestation d'assurance RC Pro en cours de validite

---

## Article 5 — Obligations du Sous-Traitant

Le Sous-Traitant s'engage a :
- Realiser les prestations avec professionnalisme et diligence
- Respecter les delais et le planning convenu
- Rendre compte regulierement de l'avancement
- Respecter les normes techniques et standards de codage du Donneur d'Ordre
- Signaler sans delai toute difficulte
- Se conformer aux regles de securite informatique du Donneur d'Ordre et du client final

---

## Article 6 — Obligations du Donneur d'Ordre

Le Donneur d'Ordre s'engage a :
- Fournir les informations, acces et outils necessaires
- Nommer un referent projet : **{{referent_nom}}** ({{referent_email}})
- Regler les factures dans les delais convenus
- Informer le Sous-Traitant des evolutions du projet

---

## Article 7 — Propriete intellectuelle

### 7.1 Cession
Le Sous-Traitant cede au Donneur d'Ordre l'integralite des droits de propriete intellectuelle sur les livrables realises dans le cadre de la mission, a compter de leur paiement.

### 7.2 Garantie
Le Sous-Traitant garantit que les livrables sont originaux et ne portent pas atteinte aux droits de tiers.

---

## Article 8 — Confidentialite

Le Sous-Traitant s'engage a :
- Maintenir confidentielles toutes les informations relatives au Donneur d'Ordre et au client final
- Ne pas divulguer les informations a des tiers
- Restituer ou detruire les informations confidentielles a la fin de la mission

Cette obligation perdure **3 ans** apres la fin du contrat.

---

## Article 9 — Non-sollicitation

Le Sous-Traitant s'interdit, pendant la duree du contrat et pendant **{{duree_non_sollicitation}}** apres son terme, de solliciter directement les clients du Donneur d'Ordre pour lesquels il a travaille dans le cadre du present contrat.

---

## Article 10 — Responsabilite et assurance

### 10.1 Assurance RC Pro
Le Sous-Traitant justifie d'une assurance Responsabilite Civile Professionnelle en cours de validite couvrant les risques lies a son activite.

### 10.2 Plafond
La responsabilite du Sous-Traitant est limitee au montant des honoraires percus au titre du present contrat.

---

## Article 11 — Resiliation

### 11.1 Pour faute
Resiliation immediate en cas de faute grave, apres mise en demeure restee infructueuse pendant 15 jours.

### 11.2 De convenance
Avec un preavis de **{{preavis_resiliation}} jours ouvrables**. Les prestations realisees restent dues.

---

## Article 12 — Droit applicable

Le present contrat est regi par le droit francais. Tout litige sera soumis au Tribunal de commerce d'Aix-en-Provence.

---

## Signatures

Fait en deux exemplaires originaux, a {{lieu}}, le {{date_signature}}.

**Pour ATUM SAS — Donneur d'Ordre**

Nom : {{auteur}}
Fonction : {{fonction}}
Signature :


**Le Sous-Traitant**

Nom : {{freelance_nom}}
Statut : {{freelance_statut}}
SIRET : {{freelance_siret}}
Signature :
