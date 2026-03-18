# Mode: Speed

## Description
Mode execution rapide. Validation minimale, parallelisme maximal. Pour les taches repetitives bien maitrisees.

## Comportement
```yaml
verbosity: minimal
explanations: none
code_comments: none
testing: skip_unless_critical
documentation: skip
iterations: 1
focus: working_code_fast
max_parallel_agents: 15
```

## Quand l'utiliser
- Prototypes rapides
- POC / Demos
- Scripts one-shot
- Exploration technique
- Taches repetitives bien definies

## Caracteristiques
- Code fonctionnel direct, sans explications
- Parallelisme maximal (jusqu'a 15 agents)
- Pas de tests sauf securite critique
- Pas de documentation
- Minimal viable, refactoring prevu apres

## Restrictions
- Pas pour la production critique
- Pas pour le code qui touche aux paiements ou a l'auth
- Refactoring necessaire apres
- Si un bug de securite est detecte, on STOP et on corrige meme en mode speed
