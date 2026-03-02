# FACTURE

**ATUM SAS**
Societe par Actions Simplifiee au capital de {{capital}} euros
Siege social : {{siege}}
RCS : {{rcs}} | SIRET : {{siret}}
TVA Intracommunautaire : {{tva_intracom}}
Email : {{email_societe}}

---

**Facture n°** : {{numero_facture}}
**Date d'emission** : {{date_emission}}
**Date d'echeance** : {{date_echeance}}

{{#si_devis_ref}}
**Reference devis** : {{ref_devis}}
{{/si_devis_ref}}
{{#si_projet_ref}}
**Reference projet** : {{ref_projet}}
{{/si_projet_ref}}

---

## Client

| Champ | Detail |
|---|---|
| Societe | {{client_societe}} |
| Adresse | {{client_adresse}} |
| SIRET | {{client_siret}} |
| TVA Intracom. | {{client_tva_intracom}} |

---

## Detail des prestations

| # | Description | Unite | Quantite | Prix unitaire HT | Total HT |
|---|---|---|---|---|---|
{{#lignes}}
| {{numero}} | {{description}} | {{unite}} | {{quantite}} | {{prix_unitaire}} EUR | {{total_ligne}} EUR |
{{/lignes}}

---

| Recapitulatif | Montant |
|---|---|
| **Total HT** | **{{total_ht}} EUR** |
| TVA {{taux_tva}}% | {{montant_tva}} EUR |
{{#si_acompte}}
| Acompte verse (facture n° {{ref_acompte}}) | -{{montant_acompte}} EUR |
{{/si_acompte}}
| **Net a payer TTC** | **{{net_a_payer}} EUR** |

---

## Modalites de reglement

**Mode de paiement** : {{mode_paiement}}
**Delai de paiement** : {{delai_paiement}} jours {{type_delai}}
**Date limite de reglement** : {{date_echeance}}

**Coordonnees bancaires** :
- Banque : {{banque}}
- IBAN : {{iban}}
- BIC : {{bic}}

**Reference a indiquer** : {{numero_facture}}

---

**Mentions legales obligatoires** :

En cas de retard de paiement, une penalite egale a 3 fois le taux d'interet legal sera exigible (Art. L441-10 du Code de commerce). Une indemnite forfaitaire de 40 EUR pour frais de recouvrement sera egalement due (Art. D441-5 du Code de commerce).

{{#si_escompte}}
Escompte pour paiement anticipe : {{escompte_taux}}%
{{/si_escompte}}
{{#si_pas_escompte}}
Pas d'escompte pour paiement anticipe.
{{/si_pas_escompte}}

TVA acquittee sur les debits.

---

**ATUM SAS** — {{auteur}}, {{fonction}}
