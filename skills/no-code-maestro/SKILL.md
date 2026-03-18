---
name: no-code-maestro
description: Competences no-code alignees sur Maestro No-Code x IA (Make.com, Airtable, Notion). Use for automation, scenarios, blueprints, no-code workflows.
version: "1.0.0"
metadata:
  domain: no-code
  triggers: no-code, make.com, airtable, notion, automation, scenario, blueprint, webhook, workflow automatise, maestro, integromat
  role: specialist
  scope: implementation
  output-format: code
  related-skills: scheduler
---

# No-Code Maestro Skill

Compétences no-code complètes alignées sur la formation Maestro No-Code x IA (P12, Maria Schools/LION).

## Trigger

Détecter : "automatisation", "scénario make", "no-code", "airtable", "blueprint", "webhook", "workflow automatisé", "connecter les outils", "intégration", "automatiser", "no code", "make.com", "scenario make"

## Glossaire No-Code

| Terme | Définition |
|-------|-----------|
| **Scénario** | Un workflow automatisé dans Make.com (suite de modules connectés) |
| **Module** | Une action unitaire dans un scénario (ex: "Create Record" dans Airtable) |
| **Connexion** | Lien authentifié vers un service externe (ex: compte Gmail, API Airtable) |
| **Mapping** | Liaison entre la sortie d'un module et l'entrée du suivant (`{{1.field}}`) |
| **Router** | Module qui divise le flux en branches conditionnelles |
| **Iterator** | Module qui traite un tableau élément par élément |
| **Aggregator** | Module qui regroupe plusieurs éléments en un seul (Array, Text, Table) |
| **Filter** | Condition entre deux modules (passe ou bloque le flux) |
| **Blueprint** | Représentation JSON complète d'un scénario (exportable/importable) |
| **Webhook** | URL qui déclenche un scénario quand elle reçoit une requête HTTP |
| **Data Store** | Base de données interne Make.com (clé-valeur, persistante entre exécutions) |
| **Error Handler** | Route de fallback quand un module échoue (Resume, Break, Rollback, Commit) |
| **Linked Record** | Champ Airtable qui référence un enregistrement dans une autre table |
| **Lookup** | Champ Airtable qui affiche des valeurs d'un Linked Record |
| **Rollup** | Champ Airtable qui agrège des valeurs de Linked Records (SUM, COUNT, etc.) |
| **Base** | Un classeur Airtable contenant plusieurs tables |
| **Vue** | Un affichage filtré/trié d'une table Airtable (Grid, Kanban, Calendar, Form) |

## Modules Make.com les plus utilisés

### Triggers (déclencheurs)
- `builtin:Webhook` — Réception HTTP (POST/GET)
- `airtable:WatchRecords` — Nouveau/modifié dans Airtable
- `gmail:WatchEmails` — Nouveau email
- `google-sheets:WatchNewRows` — Nouvelle ligne
- `builtin:BasicScheduler` — Exécution périodique (cron)

### Actions courantes
- `http:ActionSendData` — Appel HTTP (API externe)
- `json:ParseJSON` / `json:TransformToJSON` — Parse/Create JSON
- `airtable:ActionCreateRecord` / `airtable:ActionUpdateRecord` — CRUD Airtable
- `gmail:ActionSendEmail` — Envoyer email
- `slack:CreateMessage` — Poster message Slack
- `notion:CreateAPage` / `notion:UpdateAPage` — CRUD Notion
- `google-sheets:ActionAppendRow` — Ajouter ligne Sheets
- `webflow:CreateCollectionItem` — Ajouter au CMS Webflow

### Utilitaires
- `builtin:BasicRouter` — Brancher le flux
- `builtin:BasicFeeder` — Itérer sur un tableau
- `builtin:BasicAggregator` — Regrouper en tableau
- `builtin:TextAggregator` — Concaténer du texte
- `builtin:SetVariable` / `builtin:GetVariable` — Variables
- `builtin:Sleep` — Pause (rate limiting)
- `builtin:filter` — Condition de passage

## Templates de Blueprints

### Template 1 : Webhook → Airtable → Gmail
```
Webhook (POST) → Create Airtable Record → Send Gmail
```
Usage : Formulaire de contact, inscription, lead capture

### Template 2 : Airtable Watch → Router → Multi-destination
```
Watch Records → Router
  ├─ [status=new] → Slack notification
  ├─ [status=validated] → Gmail confirmation + Notion page
  └─ [status=rejected] → Gmail rejection
```
Usage : Pipeline CRM, workflow d'approbation

### Template 3 : Schedule → API → Airtable
```
Scheduler (daily) → HTTP GET (API) → Iterator → Create Airtable Records
```
Usage : Agrégation données, reporting, monitoring

### Template 4 : Form → Validate → Route → Notify
```
Webhook → JSON Parse → Filter (validation) → Router
  ├─ [valid] → Airtable + Gmail confirmation
  └─ [invalid] → Gmail error notification
```
Usage : Formulaire avec validation

### Template 5 : Sync bidirectionnel
```
Airtable Watch → Filter (changed) → Update Notion
Notion Watch → Filter (changed) → Update Airtable
```
Usage : Synchronisation entre outils

## Patterns de données Airtable

### CRM Simple
```
Contacts: Name, Email, Phone, Company (link), Status (select), Notes
Companies: Name, Website, Industry, Contacts (link), Deals (link)
Deals: Name, Value (currency), Stage (select), Contact (link), Close Date
Activities: Type (select), Date, Contact (link), Notes
```

### Project Tracker
```
Projects: Name, Status, Start Date, End Date, Owner, Tasks (link)
Tasks: Name, Status, Priority, Due Date, Assignee, Project (link)
Milestones: Name, Date, Project (link), Tasks (link)
```

### Content Calendar
```
Posts: Title, Content, Platform (multi-select), Publish Date, Status, Author
Campaigns: Name, Start Date, End Date, Posts (link), KPIs
Assets: Name, File (attachment), Type, Post (link)
```

## Best Practices Formation

### Organisation Make.com
1. Un scénario = un objectif clair
2. Nommer explicitement chaque module
3. Utiliser des dossiers pour organiser les scénarios
4. Documenter avec des notes sur les modules complexes
5. Tester avec "Run once" avant d'activer

### Modélisation Airtable
1. Penser relationnel : séparer les entités
2. Utiliser les Linked Records plutôt que dupliquer
3. Formules pour les champs calculés
4. Vues pour les perspectives (Kanban pour workflow, Calendar pour planning)
5. Formulaires pour la saisie utilisateur

### Documentation Notion
1. Page hub par projet
2. Base de données des décisions
3. Templates pour les pages récurrentes
4. Toggle blocks pour les détails techniques
5. Callout blocks pour les alertes/warnings

### Approche produit (esprit Maestro)
1. **Problème d'abord** : Quel problème résout-on ?
2. **Utilisateur** : Pour qui ? Quels besoins ?
3. **MVP** : Quelle est la version minimale qui apporte de la valeur ?
4. **Itération** : Tester → Mesurer → Améliorer
5. **Priorisation MoSCoW** : Must have, Should have, Could have, Won't have
