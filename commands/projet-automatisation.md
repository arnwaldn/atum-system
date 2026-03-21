---
description: "Crée un projet d'automatisation no-code complet en suivant la méthodologie Maestro (Maria Schools/LION)."
---

# Projet Automatisation No-Code

Crée un projet d'automatisation no-code complet en suivant la méthodologie Maestro (Maria Schools/LION).

## Arguments

$ARGUMENTS = Description du projet d'automatisation à créer

## Workflow (7 étapes séquentielles)

### Étape 1 : Cadrage Produit
**Agent** : critical-thinking

Analyser le besoin :
- Quel problème résout-on ?
- Qui sont les utilisateurs cibles ?
- Quels sont les flux de données ?
- Priorisation MoSCoW (Must/Should/Could/Won't)
- Définir le MVP (version minimale viable)

**Output** : Brief projet structuré avec objectifs, utilisateurs, fonctionnalités prioritaires

### Étape 2 : Modélisation Données (Airtable)
**MCP** : `mcp__airtable__*`
**Skill** : no-code-maestro

Créer la base de données :
1. Designer le schéma relationnel (tables, champs, relations)
2. Créer la base Airtable via MCP
3. Créer les tables avec les bons types de champs
4. Configurer les Linked Records entre tables
5. Ajouter les Lookups et Rollups nécessaires
6. Créer les vues (Grid, Kanban, Calendar, Form)
7. Insérer des données de test

**Output** : Base Airtable fonctionnelle avec schéma documenté

### Étape 3 : Design Interface
**MCP** : Figma (via ToolSearch +figma), Webflow (via ToolSearch +webflow)
**Skill** : ui-ux-pro-max, refactoring-ui

Créer l'interface utilisateur :
- Si maquette Figma fournie → consulter via Figma MCP et implémenter
- Si landing page → créer via Lovable (Chrome automation) ou Webflow MCP
- Si formulaire → utiliser Airtable Form view ou Webflow form
- Si dashboard → créer via Webflow CMS + template

**Output** : Interface fonctionnelle accessible par URL

### Étape 4 : Automatisation (Make.com)
**MCP** : Make.com (via ToolSearch +make)
**Agent** : no-code-automation-expert
**Skill** : no-code-maestro

Créer les scénarios Make.com :
1. Identifier les triggers (webhook, watch, schedule)
2. Mapper les modules nécessaires
3. Configurer les connexions aux services
4. Ajouter les routers et filtres
5. Configurer le error handling
6. Tester chaque scénario en "Run once"
7. Activer les scénarios validés

**Patterns courants** :
- Webhook → Process → Notify
- Schedule → Collect → Store
- Form → Validate → Route → Notify
- Watch → Transform → Sync

**Output** : Scénarios Make.com actifs et fonctionnels

### Étape 5 : Documentation (Notion)
**MCP** : `mcp__notion__*`

Créer la documentation projet :
1. Page hub du projet (titre, objectif, équipe)
2. Architecture technique (schéma données, flux automatisation)
3. Guide utilisateur (comment utiliser le système)
4. Décisions prises et justifications
5. Roadmap et améliorations futures

**Output** : Page Notion complète et partageable

### Étape 6 : Tests & Validation

Vérifier le fonctionnement end-to-end :
1. Déclencher chaque scénario Make.com
2. Vérifier que les données arrivent dans Airtable
3. Vérifier les notifications (email, Slack)
4. Tester les cas d'erreur
5. Mesurer les temps d'exécution
6. Documenter les résultats de test

**Output** : Rapport de tests avec résultats

### Étape 7 : Préparation Jury / Pitch

Préparer la présentation :
1. **Le problème** (30s) : Quel problème ? Pour qui ?
2. **La solution** (1min) : Comment on le résout ? Démo live
3. **L'architecture** (1min) : Schéma technique (Airtable + Make + interface)
4. **Les résultats** (30s) : Métriques, gains de temps, impact
5. **La suite** (30s) : Évolutions prévues

**Output** : Structure de pitch + talking points

## Outils MCP requis

| Outil | MCP Server | Obligatoire |
|-------|-----------|-------------|
| Make.com | `make` (HTTP OAuth) | Oui |
| Airtable | `airtable` (npx + token) | Oui |
| Notion | `notion` (npx + token) | Oui |
| Figma | `figma` (HTTP OAuth) | Si design |
| Webflow | `webflow` (HTTP OAuth) | Si site web |
| Gmail | `gmail` (déjà installé) | Si notifications |
| WebMCP | `webmcp` (local) | Si interface web interactive |

## Agents invoqués

- **critical-thinking** : Cadrage produit
- **no-code-automation-expert** : Scénarios Make.com
- **database-optimizer** : Optimisation schéma Airtable
- **frontend-design-expert** : Design interface
- **documentation-generator** : Documentation Notion

## Exemples d'usage

```
/projet-automatisation CRM automatisé pour freelance : capture leads depuis formulaire web, stockage Airtable, email de bienvenue automatique, suivi pipeline Kanban

/projet-automatisation Système de veille concurrentielle : scraping quotidien d'URLs, stockage données, notification Slack des changements, dashboard Airtable

/projet-automatisation Workflow de publication contenu : calendrier éditorial Airtable, création auto de pages Notion pour chaque article, notification équipe Slack, publication Webflow CMS
```
