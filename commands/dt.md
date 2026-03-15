# /dt — Directeur Technique

Commande de pilotage strategique des projets ATUM.

## Usage

- `/dt init` — Initialiser le suivi DELIVERY.json pour le projet courant
- `/dt portfolio` — Vue d'ensemble de tous les projets ATUM
- `/dt scope <feature>` — Arbitrage de scope (3 niveaux : minimum, cible, complet)
- `/dt review` — Revue de maturite du projet courant
- `/dt ship <feature>` — Preparer la livraison d'une feature

## Comportement

Invoquer l'agent `directeur-technique` avec la sous-commande appropriee.

### `init`
1. Analyser le projet courant (code, package.json, README)
2. Croiser avec produits.json si le projet y figure
3. Generer DELIVERY.json a la racine du projet
4. Demander validation utilisateur

### `portfolio`
1. Lire ~/.claude/atum-projects.json
2. Pour chaque projet ayant un DELIVERY.json, lire statut et blockers
3. Afficher tableau synthetique

### `scope <feature>`
1. Lire DELIVERY.json du projet courant
2. Identifier la feature demandee
3. Proposer 3 niveaux de scope avec effort/impact
4. Recommander en fonction de la deadline

### `review`
1. Auditer chaque feature du DELIVERY.json
2. Verifier tests, deploiement, documentation
3. Mettre a jour les statuts

### `ship <feature>`
1. Checklist pre-livraison (tests, linter, secrets, TODOs)
2. Verifier alignement avec le parcours utilisateur
3. Marquer comme shipped dans DELIVERY.json

## Exemple

```
/dt init
→ Analyse TradingBrain... Genere DELIVERY.json avec 5 features, 3 parcours, deadline 15 avril.

/dt scope "formulaire-inscription"
→ Minimum: email+password (2h) | Cible: +OAuth Google (4h) | Complet: +magic link+SSO (12h)
→ Recommandation: Cible (OAuth Google), parce que les traders utilisent deja Google.

/dt portfolio
→ | Projet | Statut | Blockers | Next |
  | TradingBrain | 95% | API MT5 | Finir F3 |
  | GigRoute | 85% | - | Deploy prod |
  | OWL | 100% | - | Maintenance |
```
