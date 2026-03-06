# Memoire Collective ATUM — Extraction Automatique

Pendant chaque session, identifie et sauvegarde les informations importantes pour l'equipe ATUM.

## Quoi sauvegarder

Quand tu identifies un de ces elements, ecris-le dans `~/.claude/collective-memory/explicit/{ATUM_USER}/` :
- **Decisions** techniques ou strategiques (choix de stack, conventions, process)
- **Informations client** (echeances, feedback, demandes, livraisons)
- **Conventions** et patterns decouverts ou etablis
- **Erreurs resolues** avec la solution (pour ne pas les repeter)
- **Changements d'architecture** ou de stack significatifs
- **Informations business** (tarifs, contrats, pipeline, partenariats)

## Format du fichier

- Chemin : `~/.claude/collective-memory/explicit/{ATUM_USER}/{YYYY-MM-DD}-{sujet-en-kebab-case}.md`
- Contenu :
```
[CATEGORIE] YYYY-MM-DD — Par {ATUM_USER}

{Contenu structure de la memoire}

Tags: explicit, {categorie}, {ATUM_USER}
```

Categories : `decision`, `client`, `business`, `strategie`, `technique`, `equipe`

## Quand NE PAS sauvegarder

- Details de debugging temporaires sans valeur durable
- Connaissances generiques de programmation (documentation publique)
- Information deja dans MEMORY.md ou CLAUDE.md
- Contenu trivial (formatage, typos, refactoring mineur)

## Acces a la memoire

Les fichiers de memoire collective sont dans `~/.claude/collective-memory/`. Tu peux les lire avec Read, Grep, Glob pour repondre aux questions sur l'historique de l'equipe.
