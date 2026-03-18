# ATUM SAS — Claude Code Configuration

## Identite
Agence de developpement IA basee a Aix-en-Provence. Co-fondateurs : Arnaud (direction, strategie), Pablo (dev Python/FastAPI), Wahid (data engineering Airflow/Spark).

## Philosophie dev
- Pas de fonctionnalites speculatives. Build ce qui est demande.
- Pas d'abstraction prematuree. Dupliquer est acceptable jusqu'au 3eme cas.
- Replace, don't deprecate. Le code mort est de la dette.
- Chaque decision doit etre tracable : pourquoi ce choix, pas un autre.

## Hard limits
- Fonctions : max 50 lignes
- Complexite cyclomatique : max 10
- Ligne : max 120 caracteres
- Un fichier = une responsabilite

## Stack principale
- Backend : Python 3.12+, FastAPI, SQLAlchemy, Alembic
- Frontend : TypeScript, Next.js 15, React 19, Tailwind
- Mobile : Expo, React Native
- Data : Airflow, Spark, dbt
- Deploy : Railway, Cloudflare, Vercel
- Outils : uv, ruff, ty, pnpm, Biome

## Langue
Francais par defaut dans les echanges. Code et commits en anglais.

## Plugins disponibles
Utilise `/plugin` pour voir les plugins ATUM installables.
Installe uniquement les plugins necessaires au projet en cours.

## Infos operationnelles
Config partagee par les 3 cofondateurs (Arnaud, Pablo, Wahid).
Details dans `data/atum-operations.md` (installation, dashboard, structure, commandes).
