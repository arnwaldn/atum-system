---
description: Scanner tous les projets dev, evaluer l'avancement, mettre a jour le dashboard ATUM
allowed-tools: Read, Bash, Grep, Glob, Agent, WebFetch
argument-hint: [--scan-only | --report | --update | --add-new]
---

# /dashboard-atum — Audit & Sync complet du portefeuille ATUM

Scan automatique de tous les projets de developpement sur cette machine, evaluation approfondie de l'avancement reel, et mise a jour du dashboard ATUM.

## Modes

Parse `$ARGUMENTS` :
- `--scan-only` : Decouvrir et analyser les projets, afficher le rapport, ne rien modifier
- `--report` : Rapport detaille par projet (metriques, stack, git, tests) sans mise a jour
- `--update` (ou vide) : Scan complet + mise a jour du dashboard Supabase
- `--add-new` : Comme --update mais propose aussi d'ajouter les nouveaux projets detectes

## Configuration

Lire `~/.claude/data/atum-dashboard.json` pour :
- `supabase_url` — URL de l'instance Supabase
- `dashboard_url` — URL du dashboard Netlify
- `scan_paths` — Repertoires a scanner (remplacer `$HOME` par la valeur reelle)
- `ignore_dirs` — Dossiers a ignorer pendant le scan
- `project_markers` — Fichiers qui identifient un projet dev

## Credentials (OBLIGATOIRE)

Recuperer dans cet ordre de priorite :
1. Env var `ATUM_SUPABASE_SERVICE_KEY`
2. Fichier `~/.claude/data/atum-dashboard.json` champ `service_role_key` (si present)
3. Fichier `$HOME/Projects/web/atum-dashboard/.env.local` ligne `SUPABASE_SERVICE_ROLE_KEY`

Si aucun credential trouve → STOP avec message d'erreur clair.

**SECURITE** : Ne JAMAIS afficher les credentials dans le rapport. Masquer avec `***...***`.

## Phase 1 — Decouverte

Pour chaque chemin dans `scan_paths`, scanner les sous-dossiers (profondeur max 3) :

```bash
# Pour chaque scan_path, lister les dossiers contenant un marqueur projet
for path in scan_paths; do
  find "$path" -maxdepth 3 -type f \( -name "package.json" -o -name "requirements.txt" -o -name "pyproject.toml" -o -name "Cargo.toml" -o -name "go.mod" -o -name "pubspec.yaml" \) 2>/dev/null
done
```

Deduplication : si un projet contient un sous-dossier qui est aussi un projet (nested), garder seulement le sous-dossier le plus specifique.

Ignorer les dossiers dans `ignore_dirs`.

## Phase 2 — Analyse approfondie

Pour CHAQUE projet decouvert, executer en parallele (utiliser Agent tool avec subagent_type=Explore si >5 projets, sinon Bash direct) :

### 2a. Git metrics
```bash
cd "$PROJECT_DIR"
git log --oneline | wc -l                          # total commits
git log -1 --format="%ai|%s"                        # dernier commit
git branch --list | wc -l                           # branches
git diff --shortstat 2>/dev/null                    # uncommitted changes
git remote get-url origin 2>/dev/null               # repo URL
```

### 2b. Structure et taille
```bash
find . -type f -name "*.py" -o -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.rs" -o -name "*.go" -o -name "*.dart" -o -name "*.java" | grep -v node_modules | grep -v .git | wc -l  # source files
find . -type f -name "test_*" -o -name "*.test.*" -o -name "*.spec.*" | grep -v node_modules | wc -l  # test files
```

### 2c. Stack detection
- Lire `package.json` → extraire name, version, dependencies cles (next, react, electron, vue, express, fastify, etc.)
- Lire `requirements.txt` / `pyproject.toml` → extraire frameworks (flask, django, fastapi, etc.)
- Detecter fichiers de config : `next.config.*`, `vite.config.*`, `tailwind.config.*`, `tsconfig.json`, `Dockerfile`

### 2d. Deploiement
- Chercher : `netlify.toml`, `vercel.json`, `fly.toml`, `Procfile`, `railway.json`, `render.yaml`, `docker-compose.yml`
- Chercher URLs prod dans `.env*` files : `grep -h "URL\|DOMAIN\|HOST" .env* 2>/dev/null`
- Verifier `dist/` ou `build/` ou `.next/` existe

### 2e. Calcul du score de progression

```python
score = 0

# Structure (max 15)
if has_package_or_requirements: score += 5
if has_readme: score += 5
if has_gitignore: score += 5

# Code (max 25)
if source_files > 10: score += 15
if source_files > 50: score += 10

# Git (max 20)
if total_commits > 10: score += 10
if total_commits > 50: score += 10

# Tests (max 15)
if test_files > 0: score += 10
if test_files > 5: score += 5

# Deploiement (max 15)
if has_deploy_config: score += 5
if has_prod_url or has_dist: score += 10

# Features (max 10)
if has_ci_cd: score += 5
if has_changelog or has_version: score += 5

progress = min(score, 100)
```

**Ajustements intelligents** :
- Si HANDOFF.md contient "COMPLET" ou "MVP" → `progress = max(progress, 80)`
- Si le dashboard a `status: production` ET une `prod_url` accessible → `progress = max(progress, 90)`
- Si `progress` calcule est < dashboard_progress - 20 → conserver le dashboard_progress (eviter les regressions aberrantes)
- Projets sans code (docs only) → `progress = 5`

## Phase 3 — Cross-reference dashboard

Recuperer les projets existants :
```bash
curl -sk "$SUPABASE_URL/rest/v1/projects?select=id,ref,name,status,progress,prod_url,repo_url" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY"
```

Matcher chaque projet decouvert avec le dashboard :
1. Par `repo_url` (match exact du remote git)
2. Par nom (fuzzy : comparer nom du dossier avec `name` du projet, case-insensitive, strip ponctuation)
3. Si pas de match → nouveau projet detecte

Generer 3 listes :
- **MATCHED** : projets sur disque + dans le dashboard
- **NEW** : projets sur disque mais PAS dans le dashboard
- **REMOTE_ONLY** : projets dans le dashboard mais PAS sur ce disque (normal si multi-machine)

## Phase 4 — Mise a jour (sauf si --scan-only ou --report)

### 4a. Mettre a jour les projets existants

Pour chaque projet MATCHED dont le progress ou status a change :
```bash
curl -sk -X PATCH "$SUPABASE_URL/rest/v1/projects?id=eq.$PROJECT_ID" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"progress": $NEW_PROGRESS, "stack": $DETECTED_STACK}'
```

NE PAS modifier :
- `name`, `ref`, `priority` (decisions humaines)
- `status` si deja `production` (ne pas regrader)
- `progress` si la difference est < 5% (eviter le bruit)

### 4b. Ajouter les nouveaux projets (si --add-new ou --update)

Pour chaque projet NEW, demander confirmation a l'utilisateur avec AskUserQuestion :
- Montrer le nom, stack, progress estime
- Proposer les choix : Ajouter / Ignorer / Ajouter comme sous-projet

Si ajout confirme :
```bash
curl -sk -X POST "$SUPABASE_URL/rest/v1/projects" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"ref": "PRJ-2026-0XX", "name": "$NAME", "status": "$STATUS", "progress": $PROGRESS, ...}'
```

### 4c. Logger l'evenement d'audit

```bash
curl -sk -X POST "$DASHBOARD_URL/api/sync" \
  -H "Authorization: Bearer $ATUM_DASHBOARD_KEY" \
  -H "Content-Type: application/json" \
  -d '{"project_id": "$DASHBOARD_PROJECT_ID", "events": [{"event_type": "deploy", "title": "Audit complet: X projets scannes, Y mis a jour"}]}'
```

## Phase 5 — Rapport

Afficher un tableau structure :

```
╔══════════════════════════════════════════════════════════════╗
║  ATUM DASHBOARD — Audit du [date]                          ║
╠══════════════════════════════════════════════════════════════╣
║                                                             ║
║  Ref          Projet           Avant → Apres   Status      ║
║  ──────────── ──────────────── ──────────────  ──────────── ║
║  PRJ-2026-001 GigRoute          95% → 95%     production   ║
║  PRJ-2026-003 Quick Summarize   40% → 85%     production ↑ ║
║  PRJ-2026-009 EuroCiv           NEW    5%     planning   + ║
║                                                             ║
╠══════════════════════════════════════════════════════════════╣
║  Scannes: X | Mis a jour: Y | Nouveaux: Z | Remote: W     ║
╚══════════════════════════════════════════════════════════════╝
```

Legende :
- `↑` = progress augmente
- `↓` = progress diminue
- `+` = nouveau projet ajoute
- `~` = pas de changement

Si `--report`, ajouter pour chaque projet :
```
  GigRoute
  ├── Git: 398 commits, derniere modif 4 mars 2026
  ├── Stack: Flask 3.0, PostgreSQL, Render
  ├── Code: 247 fichiers source, 0 tests
  ├── Deploy: Procfile + Render, prod URL active
  └── Score: 95% (structure 15 + code 25 + git 20 + tests 0 + deploy 15 + features 10 + bonus prod 10)
```

## Erreurs et fallbacks

- Si Supabase est inaccessible → mode --report automatique (scan seul, pas de mise a jour)
- Si un repertoire de scan n'existe pas → l'ignorer silencieusement
- Si git n'est pas installe → analyser la structure sans metrics git
- Si un projet est verrouille (permissions) → le signaler dans le rapport

## Notes cross-platform

- Utiliser `$HOME` (pas `~`) dans les commandes Bash
- Python : essayer `python3` d'abord, fallback `python`
- Pas de dependance npm/pip externe requise
- Les paths Windows doivent etre convertis en format Unix pour Git Bash
