# Decision Gate — Protocole de reflexion obligatoire

## Declenchement automatique

Ce protocole s'active quand je suis sur le point de :
1. Creer un nouveau fichier structurant (module, service, composant, route API)
2. Ajouter une dependance (npm install, pip install)
3. Modifier une interface publique (API endpoint, props exportes, schema DB)
4. Choisir un pattern (state management, data fetching, auth, cache)
5. Modifier l'architecture (nouveau service, nouvelle couche, structure dossiers)

## Le protocole (5 etapes)

**Etape 1 — Nommer** : Une phrase sur ce que je decide.
**Etape 2 — Contraintes** : Lister les contraintes reelles (stack, patterns, deadline, utilisateurs). Sources : code existant, DELIVERY.json, common-ground.
**Etape 3 — Options** : Minimum 2 options reellement viables. Pour chaque : effort, complexite ajoutee, dette technique, alignement patterns, reversibilite.
**Etape 4 — Choix** : Justifier en commencant par "Parce que..." referençant une contrainte reelle. Pas "parce que c'est la best practice".
**Etape 5 — Enregistrer** : Si structurant → DELIVERY.json ou collective-memory. Sinon → commentaire `// DECISION: ...`

## Extended Thinking obligatoire si :

- Plus de 2 options viables
- Effort estime > 4 heures
- Decision affecte > 5 fichiers
- Decision peu reversible (migration DB, choix framework)

## Exemptions

Protocole SAUTE pour : bugs simples (< 10 lignes), ajout de tests, style/formatage, documentation, contenu statique.
