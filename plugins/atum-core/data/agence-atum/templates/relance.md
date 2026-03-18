# {{type_relance}}

**ATUM SAS**
{{siege}}
RCS : {{rcs}}

---

**A** : {{client_societe}}
{{client_adresse}}
A l'attention de {{client_contact}}

**Date** : {{date_relance}}
**Objet** : {{objet_relance}}

---

{{client_civilite}},

{{#si_relance_amiable}}
Sauf erreur de notre part, nous n'avons pas recu le reglement de la facture suivante :

| Facture | Date emission | Montant TTC | Echeance | Retard |
|---|---|---|---|---|
| {{numero_facture}} | {{date_emission}} | {{montant_ttc}} EUR | {{date_echeance}} | {{jours_retard}} jours |

Nous vous serions reconnaissants de bien vouloir proceder au reglement dans les meilleurs delais. Si ce paiement a deja ete effectue, nous vous prions de ne pas tenir compte de ce courrier.
{{/si_relance_amiable}}

{{#si_relance_ferme}}
Malgre notre precedent rappel du {{date_relance_precedente}}, nous constatons que le reglement de la facture ci-dessous n'a toujours pas ete effectue :

| Facture | Date emission | Montant TTC | Echeance | Retard |
|---|---|---|---|---|
| {{numero_facture}} | {{date_emission}} | {{montant_ttc}} EUR | {{date_echeance}} | {{jours_retard}} jours |

Conformement a l'article L441-10 du Code de commerce, des penalites de retard au taux de 3 fois le taux d'interet legal sont exigibles de plein droit, ainsi qu'une indemnite forfaitaire de recouvrement de 40 EUR (Art. D441-5).

Nous vous demandons de proceder au reglement sous **8 jours**.
{{/si_relance_ferme}}

{{#si_mise_en_demeure}}
**MISE EN DEMEURE**

Par la presente, nous vous mettons en demeure de proceder au paiement de la somme de **{{montant_total_du}} EUR TTC** correspondant a :

| Facture | Date emission | Montant TTC | Echeance | Retard |
|---|---|---|---|---|
{{#factures_impayees}}
| {{numero_facture}} | {{date_emission}} | {{montant_ttc}} EUR | {{date_echeance}} | {{jours_retard}} jours |
{{/factures_impayees}}

**Penalites de retard** : {{penalites}} EUR
**Indemnite forfaitaire** : {{indemnite}} EUR
**Total du** : **{{montant_total_du}} EUR**

A defaut de reglement sous **15 jours** a compter de la reception de la presente, nous nous verrons dans l'obligation de confier le recouvrement de cette creance a notre conseil juridique.
{{/si_mise_en_demeure}}

**Coordonnees bancaires pour reglement** :
- Banque : {{banque}}
- IBAN : {{iban}}
- BIC : {{bic}}
- Reference : {{numero_facture}}

Veuillez agreer, {{client_civilite}}, l'expression de nos salutations distinguees.

**{{auteur}}**
{{fonction}}
ATUM SAS
