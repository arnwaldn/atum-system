# Claude Code Config — ATUM SAS (details operationnels)

Ce fichier est charge a la demande par les skills/agents ATUM.
Il n'est PAS dans le contexte permanent de Claude Code.

## Installation

```bash
git clone https://github.com/arnwaldn/claude-code-config.git ~/tmp-claude-code-config
cd ~/tmp-claude-code-config && bash install.sh
```

Mise a jour : `cd ~/tmp-claude-code-config && git pull && bash install.sh`

## ATUM Dashboard

Dashboard : https://atum-dashboard.netlify.app
Hooks : `atum-project-scanner.js` (SessionStart) + `atum-dashboard-sync.js` (Stop)
Credentials : variables d'environnement (voir `install.sh`)

## Structure

| Dossier | Contenu |
|---------|---------|
| `hooks/` | Hooks Claude Code (32) |
| `commands/` | Commandes slash (30) |
| `agents/` | Agents specialises (38) |
| `skills/` | Skills autonomes (44) |
| `modes/` | Modes de travail (4) |
| `rules/` | Regles (23) |
| `data/` | Donnees partagees |
| `scripts/` | Scripts utilitaires |
| `schedules/` | Taches planifiees (14) |

## Commandes dashboard

- `/dashboard-atum --update` : forcer scan + mise a jour
- `/dashboard-atum --scan-only` : scanner sans modifier
