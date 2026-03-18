# DEVIS / PROPOSITION COMMERCIALE

**ATUM SAS**
Societe par Actions Simplifiee au capital de {{capital}} euros
Siege social : {{siege}}
RCS : {{rcs}} | SIRET : {{siret}}
TVA Intracommunautaire : {{tva_intracom}}

---

**Devis n°** : {{numero_devis}}
**Date** : {{date_devis}}
**Validite** : {{duree_validite}} jours (jusqu'au {{date_expiration}})

---

## Client

| Champ | Detail |
|---|---|
| Societe | {{client_societe}} |
| Adresse | {{client_adresse}} |
| SIRET | {{client_siret}} |
| Contact | {{client_contact}} |
| Email | {{client_email}} |

---

## Objet

{{objet_devis}}

## Detail des prestations

| # | Description | Unite | Quantite | Prix unitaire HT | Total HT |
|---|---|---|---|---|---|
{{#lignes}}
| {{numero}} | {{description}} | {{unite}} | {{quantite}} | {{prix_unitaire}} EUR | {{total_ligne}} EUR |
{{/lignes}}

| | | | | | |
|---|---|---|---|---|---|
| | | | | **Total HT** | **{{total_ht}} EUR** |
| | | | | TVA {{taux_tva}}% | {{montant_tva}} EUR |
| | | | | **Total TTC** | **{{total_ttc}} EUR** |

{{#si_remise}}
**Remise** : {{remise_description}} — {{remise_montant}} EUR HT
{{/si_remise}}

## Conditions

**Mode de facturation** : {{mode_facturation}}
**Modalites de paiement** : {{modalites_paiement}}
**Acompte** : {{acompte_pct}}% a la signature ({{acompte_montant}} EUR HT)
**Delai de paiement** : {{delai_paiement}} jours {{type_delai}}
**Penalites de retard** : 3 fois le taux d'interet legal en vigueur (Art. L441-10 Code de commerce)
**Indemnite forfaitaire de recouvrement** : 40 EUR (Art. D441-5 Code de commerce)

## Delais

**Demarrage** : {{date_demarrage}}
**Duree estimee** : {{duree_estimee}}
**Livraison prevue** : {{date_livraison}}

## Perimetre

### Inclus
{{#inclus}}
- {{description}}
{{/inclus}}

### Exclus
{{#exclus}}
- {{description}}
{{/exclus}}

---

**Conditions Generales de Vente** : Les CGV ATUM SAS sont annexees au present devis et en font partie integrante.

**Acceptation** : Pour accepter ce devis, merci de le retourner signe avec la mention "Bon pour accord" et la date.

---

**Bon pour accord**

Date : _________________ Signature et cachet : _________________________

---

**Etabli par** : {{auteur}}, {{fonction}}
**ATUM SAS**
