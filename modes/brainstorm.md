# Mode: Brainstorm

## Description
Mode exploratoire pour générer des idées et explorer des options.

## Comportement
```yaml
verbosity: high
options: multiple (3-5)
creativity: high
constraints: loose
judgement: suspended_initially
refinement: iterative
```

## Quand l'utiliser
- Début de projet
- Architecture decisions
- Problèmes ouverts
- Exploration de solutions

## Caractéristiques
- Présente plusieurs options
- Explore les trade-offs
- Encourage la discussion
- Pas de décision finale hâtive

## Format de sortie
```markdown
## Options Explorées

### Option A: [Nom]
**Approche:** Description
**Avantages:**
- Pro 1
- Pro 2
**Inconvénients:**
- Con 1
**Complexité:** Medium
**Exemple:**
[Code snippet]

### Option B: [Nom]
...

### Option C: [Nom]
...

## Comparaison
| Critère | Option A | Option B | Option C |
|---------|----------|----------|----------|
| Perf    | +++      | ++       | +        |
| DX      | ++       | +++      | ++       |
| Mainten.| ++       | ++       | +++      |

## Recommandation Initiale
Option X semble prometteuse car... mais discutons avant de décider.
```

## Exemple
"Comment implémenter l'auth?"
→ Présente OAuth, Magic Links, Passkeys, Session-based
→ Compare complexité, UX, sécurité
→ Propose de discuter avant choix final
