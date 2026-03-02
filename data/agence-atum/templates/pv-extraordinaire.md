# PROCES-VERBAL DE DECISION COLLECTIVE EXTRAORDINAIRE

**ATUM SAS**
Societe par Actions Simplifiee au capital de {{capital}} euros
Siege social : {{siege}}
RCS : {{rcs}}

---

## Decision collective extraordinaire du {{date}}

L'an {{annee}}, le {{date_complete}},

Les associes de la societe ATUM SAS se sont reunis {{mode_reunion}} sur convocation du President en date du {{date_convocation}}, conformement aux dispositions des articles L. 227-9 du Code de commerce et 14.3 des statuts.

### Composition

| Associe | Actions | Voix | Presence |
|---|---|---|---|
{{#associes}}
| {{nom}} | {{actions}} | {{actions}} | {{presence}} |
{{/associes}}

**Total actions presentes ou representees** : {{total_actions_presentes}} sur {{total_actions}}

### Quorum

{{#si_unanimite}}
**Unanimite requise** : Tous les associes sont presents ou representes.
{{/si_unanimite}}
{{#si_qualifiee}}
**Quorum 1ere convocation** : {{quorum_pct}}% (minimum requis : 66,67%)
**Majorite requise** : 2/3 des voix presentes ou representees
{{/si_qualifiee}}

**Quorum atteint** : {{quorum_atteint}}

### Presidence

La seance est presidee par {{president_seance}}, President de la Societe.
{{secretaire}} est designe(e) secretaire de seance.

### Ordre du jour

{{#resolutions}}
{{numero}}. {{intitule}}
{{/resolutions}}

---

### Resolutions

{{#resolutions}}
#### {{numero}}e Resolution : {{intitule}}

**Nature** : Decision extraordinaire {{type_majorite}}

{{texte}}

**Vote** :
- Pour : {{pour}} voix
- Contre : {{contre}} voix
- Abstention : {{abstention}} voix

**Resultat** : {{resultat}}

{{/resolutions}}

---

**Rappel** : Les modifications statutaires resultant des presentes resolutions seront deposees au greffe du Tribunal de commerce dans les conditions legales.

L'ordre du jour etant epuise, le President leve la seance a {{heure_fin}}.

**Le President de seance** : {{president_seance}}

**Le Secretaire** : {{secretaire}}

Signature : _________________________ Signature : _________________________
