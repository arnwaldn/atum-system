# CONTRAT DE PRESTATION DE SERVICES

**Entre les soussignes :**

**ATUM SAS**, Societe par Actions Simplifiee au capital de {{capital}} euros
Siege social : {{siege}}
RCS : {{rcs}} | SIRET : {{siret}}
Representee par {{auteur}}, en qualite de {{fonction}}
Ci-apres designee « **le Prestataire** »

**Et :**

**{{client_societe}}**
{{client_forme_juridique}} au capital de {{client_capital}} euros
Siege social : {{client_adresse}}
RCS : {{client_rcs}} | SIRET : {{client_siret}}
Representee par {{client_representant}}, en qualite de {{client_fonction}}
Ci-apres designee « **le Client** »

Ci-apres designees ensemble « les Parties »

---

## Article 1 — Objet

Le Prestataire s'engage a realiser pour le compte du Client les prestations suivantes :

**{{description_prestation}}**

{{#si_ref_devis}}
Conformement au devis n° {{ref_devis}} du {{date_devis}}, accepte par le Client.
{{/si_ref_devis}}

---

## Article 2 — Perimetre des prestations

### 2.1 Prestations incluses

{{#prestations_incluses}}
- {{description}}
{{/prestations_incluses}}

### 2.2 Prestations exclues

{{#prestations_exclues}}
- {{description}}
{{/prestations_exclues}}

### 2.3 Evolutions de perimetre

Toute evolution du perimetre fera l'objet d'un avenant ecrit signe par les deux Parties, apres etablissement d'un devis complementaire.

---

## Article 3 — Duree

Le present contrat prend effet a compter du **{{date_debut}}** pour une duree de **{{duree_contrat}}**.

{{#si_reconduction}}
Il sera renouvelable par tacite reconduction par periodes de {{periode_reconduction}}, sauf denonciation par l'une des Parties avec un preavis de {{preavis_reconduction}}.
{{/si_reconduction}}

---

## Article 4 — Prix et modalites de paiement

### 4.1 Prix

{{#si_forfait}}
Le prix total de la prestation est fixe a **{{montant_ht}} EUR HT**, soit **{{montant_ttc}} EUR TTC** (TVA {{taux_tva}}%).
{{/si_forfait}}

{{#si_regie}}
La prestation est facturee en regie sur la base d'un Taux Journalier Moyen (TJM) de **{{tjm}} EUR HT/jour**.

| Profil | TJM HT |
|---|---|
{{#profils_regie}}
| {{profil}} | {{tjm}} EUR |
{{/profils_regie}}
{{/si_regie}}

### 4.2 Echeancier

{{#echeancier}}
| Etape | Montant HT | Echeance |
|---|---|---|
{{#lignes_echeancier}}
| {{etape}} | {{montant}} EUR | {{date}} |
{{/lignes_echeancier}}
{{/echeancier}}

### 4.3 Facturation

Les factures sont emises conformement a l'echeancier ci-dessus. Le paiement est effectue par virement bancaire dans un delai de **{{delai_paiement}} jours** a compter de la date de facture.

### 4.4 Penalites de retard

Conformement aux articles L441-10 et D441-5 du Code de commerce, tout retard de paiement entrainera de plein droit l'application de penalites egales a 3 fois le taux d'interet legal, ainsi qu'une indemnite forfaitaire de recouvrement de 40 EUR.

---

## Article 5 — Obligations du Prestataire

Le Prestataire s'engage a :
- Executer les prestations avec diligence et professionnalisme (obligation de moyens)
- Affecter des collaborateurs qualifies
- Respecter les delais convenus
- Informer le Client de toute difficulte
- Respecter les regles de confidentialite et de securite du Client

---

## Article 6 — Obligations du Client

Le Client s'engage a :
- Fournir les informations, acces et ressources necessaires dans les delais convenus
- Nommer un interlocuteur referent : **{{client_contact}}** ({{client_email}})
- Valider les livrables dans un delai de **{{delai_validation}} jours ouvrables**
- Regler les factures dans les delais convenus

---

## Article 7 — Livrables et recette

### 7.1 Livrables

{{#livrables}}
- {{description}}
{{/livrables}}

### 7.2 Recette

Le Client dispose de **{{delai_recette}} jours ouvrables** apres livraison pour notifier des reserves motivees. En l'absence de reserves dans ce delai, les livrables sont reputes acceptes.

---

## Article 8 — Propriete intellectuelle

### 8.1 Transfert de droits

Le Prestataire cede au Client, a compter du paiement integral du prix, les droits patrimoniaux sur les livrables :
- Droit de reproduction, representation, modification, adaptation
- Pour le monde entier, pour la duree legale de protection
- Pour tous supports et modes d'exploitation

### 8.2 Codes sources

Les codes sources sont livres au Client a la reception finale. Le Client beneficie d'une licence perpetuelle, mondiale, non exclusive d'utilisation, modification et distribution.

### 8.3 Outils preexistants

Les outils, bibliotheques et composants preexistants du Prestataire restent sa propriete. Une licence d'utilisation gratuite, perpetuelle et non exclusive est accordee au Client pour l'exploitation des livrables.

---

## Article 9 — Confidentialite

Chaque Partie s'engage a :
- Maintenir confidentielles toutes informations recues de l'autre Partie
- Ne pas divulguer ces informations a des tiers sans accord prealable ecrit
- Limiter l'acces aux seules personnes ayant besoin d'en connaitre

Cette obligation perdure pendant **3 ans** apres la fin du contrat.

---

## Article 10 — Protection des donnees personnelles

Les Parties s'engagent a respecter le Reglement General sur la Protection des Donnees (RGPD).

{{#si_dpa}}
Un Data Processing Agreement (DPA) est annexe au present contrat.
{{/si_dpa}}

---

## Article 11 — Responsabilite

### 11.1 Obligation de moyens

Le Prestataire est soumis a une obligation de moyens. Sa responsabilite ne pourra etre engagee qu'en cas de faute prouvee.

### 11.2 Plafond de responsabilite

La responsabilite du Prestataire est plafonnee au montant total du contrat.

### 11.3 Dommages indirects

Le Prestataire ne pourra en aucun cas etre tenu responsable des dommages indirects (perte de chiffre d'affaires, perte de donnees, atteinte a l'image).

---

## Article 12 — Garantie

Le Prestataire garantit la conformite des livrables aux specifications convenues pendant **{{duree_garantie}}** a compter de la recette.

Cette garantie couvre la correction des anomalies bloquantes et majeures. Elle ne couvre pas les evolutions fonctionnelles.

---

## Article 13 — Resiliation

### 13.1 Resiliation pour faute

En cas de manquement grave de l'une des Parties, l'autre Partie pourra resilier le contrat apres mise en demeure restee infructueuse pendant **30 jours**.

### 13.2 Resiliation de convenance

Chaque Partie peut resilier le contrat a tout moment avec un preavis de **60 jours**. Les prestations realisees seront facturees au prorata.

---

## Article 14 — Force majeure

Les Parties ne pourront etre tenues responsables en cas de force majeure au sens de l'article 1218 du Code civil.

---

## Article 15 — Droit applicable et juridiction

Le present contrat est regi par le droit francais. Tout litige sera soumis au Tribunal de commerce d'Aix-en-Provence.

---

## Signatures

Fait en deux exemplaires originaux.

**Pour le Prestataire — ATUM SAS**

Date : _________________
Nom : {{auteur}}
Fonction : {{fonction}}
Signature :


**Pour le Client — {{client_societe}}**

Date : _________________
Nom : {{client_representant}}
Fonction : {{client_fonction}}
Signature :
