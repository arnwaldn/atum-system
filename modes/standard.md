# Mode: Standard

## Description
Mode par defaut equilibre entre vitesse et qualite. Lint, typecheck, tests essentiels.

## Comportement
```yaml
verbosity: moderate
explanations: when_needed
code_comments: minimal
testing: essential_tests_only
documentation: inline_only
iterations: 1-2
max_parallel_agents: 10
```

## Quand l'utiliser
- Developpement quotidien
- Taches generales
- Demandes claires avec contexte suffisant

## Caracteristiques
- Reponses concises mais completes
- Code fonctionnel du premier coup
- Tests pour les cas critiques uniquement
- Lint et typecheck systematiques
- Jusqu'a 10 agents en parallele
- Code review automatique pour les changements > 30 lignes

## Quality Gates
- Lint obligatoire sur les fichiers modifies
- Typecheck si applicable (TypeScript, Python type hints)
- Tests unitaires pour la logique metier
- Pas de secrets hardcodes
