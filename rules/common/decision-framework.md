# Decision Framework

## Quick Test
Avant CHAQUE decision : "Qu'est-ce qu'un dev senior de tres haut niveau ferait ?"
Si la reponse n'est pas evidente → activer le protocole ci-dessous.

## Quand activer (triggers)
1. Creer un fichier structurant (module, service, composant, route API)
2. Ajouter une dependance
3. Modifier une interface publique (API, props, schema DB)
4. Choisir un pattern (state, data fetching, auth, cache)
5. Modifier l'architecture

## Protocole (5 etapes)
1. **Nommer** — une phrase sur la decision
2. **Contraintes** — lister les contraintes reelles (code, deadline, users)
3. **Options** — minimum 2 viables, avec effort/complexite/dette/reversibilite
4. **Choisir** — "Parce que..." (pas "c'est la best practice")
5. **Enregistrer** — structurant → DELIVERY.json ou collective-memory

## Sequences de resolution

| Situation | Sequence |
|-----------|----------|
| Bug mysterieux | error-detective → reproduire → test failing → fix → verify |
| Choix architectural | architect-reviewer → critical-thinking → documenter |
| Performance | /optimize → mesure avant → hypothese → fix → mesure apres |
| Feature ambigue | common-ground → /feature-analyzer → validation → /pipeline |
| Code legacy | spec-miner → codebase-pattern-finder → plan de refactoring |

## Escalade
- 3 fichiers modifies sans test → STOP, tests d'abord
- Decision architecturale → Extended thinking obligatoire
- 3 echecs sur meme approche → STOP, proposer alternatives au user

## Anti-patterns
| Au lieu de... | Un dev senior ferait... |
|---------------|-------------------------|
| Quick hack | Comprendre la contrainte, resoudre proprement |
| Retry aveugle | Diagnostiquer POURQUOI ca echoue |
| Sur-ingenierer "au cas ou" | Construire ce qui est necessaire maintenant |
| Copy-paste Stack Overflow | Comprendre la solution, adapter au contexte |
| Ignorer un warning | Investiguer, corriger ou justifier explicitement |

## Exemptions
Protocole SAUTE pour : bugs simples (< 10 lignes), ajout de tests, style/formatage, documentation, contenu statique.
