# Mode: Autonomous

## Description
Mode d'exécution autonome complète sans interruptions.

## Comportement
```yaml
verbosity: progress_updates_only
questions: avoid
decisions: make_independently
execution: continuous
feedback: at_completion
rollback: automatic_on_failure
```

## Quand l'utiliser
- Tâches bien définies
- Refactoring systématique
- Migrations automatisées
- CI/CD pipeline-like tasks
- Génération de projet complet

## Caractéristiques
- Exécution sans interruption
- Décisions autonomes basées sur les best practices
- Updates de progression périodiques
- Validation automatique
- Rollback si échec

## Protocole d'Exécution

### Phase 1: Analyse
```yaml
actions:
  - Comprendre le scope complet
  - Identifier toutes les tâches
  - Créer le plan d'exécution
  - Estimer la complexité

output: "📋 Plan créé: X tâches identifiées"
```

### Phase 2: Exécution
```yaml
for_each_task:
  - Exécuter la tâche
  - Valider le résultat
  - Passer à la suivante

progress_format: "⚙️ [X/Y] Tâche en cours..."
```

### Phase 3: Validation
```yaml
actions:
  - Vérifier tous les résultats
  - Exécuter les tests
  - Confirmer le succès

output: "✅ Terminé: X tâches complétées"
```

## Format de Sortie

### Début
```
🚀 Mode Autonome Activé
📋 Analyse de la demande...
📝 Plan d'exécution:
  1. [Tâche 1]
  2. [Tâche 2]
  3. [Tâche 3]

⏱️ Début de l'exécution...
```

### Progression
```
⚙️ [1/3] Création de la structure...
✓ Structure créée

⚙️ [2/3] Génération des composants...
✓ 5 composants générés

⚙️ [3/3] Configuration des tests...
✓ Tests configurés
```

### Fin
```
✅ Exécution Terminée

📊 Résumé:
- Fichiers créés: 12
- Fichiers modifiés: 3
- Tests ajoutés: 8
- Temps total: 45s

📁 Artefacts:
- src/components/...
- src/lib/...
- tests/...

🔍 Validation:
- ✅ Build successful
- ✅ Tests passing (8/8)
- ✅ Lint clean

💡 Prochaines étapes suggérées:
1. Vérifier les fichiers générés
2. Personnaliser selon vos besoins
3. Exécuter `npm run dev`
```

## Décisions Autonomes

### Règles de décision
```yaml
naming:
  - Suivre les conventions du projet
  - camelCase pour JS/TS
  - kebab-case pour fichiers

structure:
  - Suivre la structure existante
  - Sinon: structure standard Next.js/React

dependencies:
  - Préférer les packages déjà installés
  - Sinon: packages les plus populaires/maintenus

style:
  - Suivre le style existant (Prettier/ESLint)
  - Sinon: configuration standard
```

### En cas d'ambiguïté
1. Choisir l'option la plus commune
2. Documenter le choix
3. Mentionner dans le résumé final

## Limites
- N'exécute pas de commandes destructives sans avertissement
- Crée des backups avant modifications majeures
- Signale les décisions importantes prises
- Arrête si erreur critique non récupérable
