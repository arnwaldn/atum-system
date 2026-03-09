# Claude Code Config — Depot de configuration partage ATUM SAS

Ce depot contient toute la configuration Claude Code de l'equipe ATUM.
Il est utilise par les 3 cofondateurs (Arnaud, Pablo, Wahid) pour synchroniser
leur environnement Claude Code.

## Installation / Mise a jour

Pour installer ou mettre a jour la config Claude Code sur cette machine :

```bash
cd ~/tmp-claude-code-config   # ou le dossier du clone
git pull                       # recuperer les dernieres modifications
bash install.sh                # appliquer la config
```

Si le repo n'est pas encore clone :
```bash
git clone https://github.com/arnwaldn/claude-code-config.git ~/tmp-claude-code-config
cd ~/tmp-claude-code-config && bash install.sh
```

## ATUM Dashboard

Le dashboard (https://atum-dashboard.netlify.app) se met a jour automatiquement
via 2 hooks Claude Code :

- `atum-project-scanner.js` (SessionStart) — scanne les projets locaux, calcule un score de progression, met a jour Supabase
- `atum-dashboard-sync.js` (Stop) — envoie les evenements de session (commits, duree, resume)

Les credentials Supabase sont dans `data/atum-dashboard.json` et `atum-projects.json`.
Le `install.sh` configure automatiquement les variables d'environnement necessaires.

### Comptes dashboard
- arnaud.porcel@gmail.com / AtumDash2026!
- pablo@atum-sas.fr / AtumDash2026!
- wahid@atum-sas.fr / AtumDash2026!

## Structure du depot

| Dossier/Fichier | Contenu |
|-----------------|---------|
| `hooks/` | Hooks Claude Code (PreToolUse, PostToolUse, SessionStart, Stop, etc.) |
| `commands/` | Commandes slash (/scaffold, /deploy, /tdd, etc.) |
| `agents/` | Agents specialises (37 agents) |
| `skills/` | Skills autonomes (35+) |
| `modes/` | Modes de travail (architect, autonomous, brainstorm, quality) |
| `rules/` | Regles globales (coding-style, security, testing, etc.) |
| `data/` | Donnees partagees (agence ATUM, dashboard config) |
| `scripts/` | Scripts utilitaires (memory sync, migration) |
| `schedules/` | Taches planifiees (scheduler daemon) |
| `settings.json` | Config principale Claude Code |
| `settings.local.json` | Config locale (env vars projet) |
| `claude.json.template` | Template MCP servers |
| `atum-projects.json` | Registre des projets ATUM (scan auto) |
| `plugins.txt` | Liste des plugins a installer |

## Mise a jour manuelle du dashboard

Pour forcer un scan et une mise a jour du dashboard depuis Claude Code :
```
/dashboard-atum --update
```

Pour scanner sans modifier :
```
/dashboard-atum --scan-only
```
