---
description: "Project Profile System — detect project type, recommend teams, estimate costs"
---

# Project Profile System — /team Command

Commande: **$ARGUMENTS**

## Sous-commandes disponibles

### `/team detect` ou `/team detect --dir <path>`
Detecte le type de projet dans le repertoire courant (ou specifie).

**Actions:**
1. Analyser le filesystem du repertoire cible (package.json, pyproject.toml, go.mod, etc.)
2. Classifier le projet parmi 20 domaines
3. Retourner un ProjectProfile JSON avec: domain, confidence, languages, frameworks, buildTools

**Si MCP `project-profile` est connecte:**
- Utiliser l'outil `profile_detect` avec le path du projet

**Sinon (fallback local):**
- Executer: `npx tsx ~/Projects/tools/project-profile-system/src/cli/index.ts detect --dir <path>`

**Output attendu:**
```
Projet detecte: Web Full-Stack (92% confiance)
  Languages: TypeScript
  Frameworks: Next.js, Tailwind
  Build tools: Vite
  Monorepo: Non
```

---

### `/team recommend` ou `/team recommend "<task description>"`
Recommande l'equipe d'agents pour une tache donnee.

**Actions:**
1. Detecter le profil du projet (si pas deja fait)
2. Analyser la tache pour detecter des hints cross-domaine
3. Router vers l'equipe primaire + equipe assist si necessaire

**Si MCP `project-profile` est connecte:**
- Utiliser l'outil `team_recommend` avec projectDir et task

**Output attendu:**
```
Equipe recommandee:
  Primaire: Web Full-Stack Team
    Lead: architect-reviewer (Opus)
    Workers: frontend-design-expert, api-designer, auto-test-generator (Sonnet)
  Assist: API Team (tache mentionne des concepts API/payment)
  Confiance: 92% — routage automatique
```

---

### `/team list`
Liste toutes les equipes disponibles et leurs domaines.

**Si MCP `project-profile` est connecte:**
- Utiliser l'outil `team_list`

**Sinon (fallback local):**
- Executer: `npx tsx ~/Projects/tools/project-profile-system/src/cli/index.ts --help`

**Output attendu:** Tableau des 8 equipes avec leurs domaines, lead, et workers.

---

### `/team cost` ou `/team cost "<task description>"`
Estime le cout d'execution d'une tache.

**Actions:**
1. Detecter le profil
2. Estimer la complexite (simple/moyen/complexe)
3. Calculer le cout estime par modele

**Output attendu:**
```
Estimation de cout:
  Complexite: Moyenne (3-5 fichiers)
  Cout estime: $0.08 - $0.15
    Opus (leads): ~$0.04
    Sonnet (workers): ~$0.08
  Note: Avec Claude Max, le cout est inclus dans l'abonnement.
```

---

### `/team exec "<task description>"` (necessite API key OU Claude Max)
Execute une tache complete avec l'equipe recommandee.

**Actions:**
1. Detecter le profil du projet
2. Recommander l'equipe
3. Confirmer avec l'utilisateur avant d'executer
4. Coordonner: DETECT -> PLAN -> EXECUTE -> REVIEW -> REPORT
5. Utiliser les agents specialises de `~/.claude/agents/` comme workers

**IMPORTANT:** Sous Claude Max, l'orchestration se fait NATIVEMENT par Claude Code.
Le flow est:
1. `/team detect` pour identifier le projet
2. Invoquer le lead agent appropriate (ex: `architect-reviewer`) via le Task tool
3. Le lead decompose en subtasks
4. Dispatcher les workers via Task tool (paralleliser les independants)
5. Code-reviewer apres chaque worker
6. Rapport final

---

## Regles
- Toujours detecter le profil AVANT de recommander une equipe
- Si confidence < 0.5, demander a l'utilisateur de specifier le domaine
- Si confidence 0.5-0.84, confirmer avec l'utilisateur
- Si confidence >= 0.85, routage automatique
- Presenter les resultats de facon claire et structuree
- Sous Claude Max: zero cout API supplementaire
