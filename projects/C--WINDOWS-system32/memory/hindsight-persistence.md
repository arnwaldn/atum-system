# Hindsight Persistent Storage — Technical Notes

## Architecture
- HF Space `Arnwald84/atum-hindsight` (Docker, cpu-basic, free tier)
- HF Dataset `Arnwald84/atum-hindsight-backup` (private) for pg_dump storage
- Deploy repo: `~/Projects/tools/atum-hindsight-deploy/hf-space-repo/`

## Key Discovery: Data Location
- Hindsight uses **pg0** (embedded PostgreSQL 18.1.0 + pgvector 0.8.1)
- PG data: `~/.pg0/instances/hindsight/data/` (64MB typical)
- PG binaries: `~/.pg0/installation/18.1.0/bin/` (pg_dump, pg_restore, psql)
- PG credentials: user=hindsight, password=hindsight, database=hindsight, port=5432
- `HINDSIGHT_DATA_DIR=/data/hindsight` is ALWAYS EMPTY (not where data lives)
- HF Space env var for auth: `HINDSIGHT_API_TENANT_API_KEY` (NOT HINDSIGHT_API_KEY)

## Backup Flow (backup.py)
1. `pg_dump -Fc` creates custom format dump (~1.1MB for 22 docs / 379 nodes)
2. Upload to HF Dataset as `snapshots/latest.pgdump` (overwrite)
3. Upload timestamped copy to `snapshots/history/{timestamp}.pgdump`
4. Rotate: keep last 5 history snapshots

## Restore Flow (restore.py)
1. Download `snapshots/latest.pgdump` from HF Dataset
2. `pg_restore --clean --if-exists --no-owner --no-acl --single-transaction`
3. Return exit code: 0=restored, 2=no backup, 1=error

## Entrypoint Flow (entrypoint.sh)
1. Start Hindsight (`/app/start-all.sh &`)
2. Set SIGTERM trap (backup → shutdown)
3. Wait for healthy (curl /health, up to 300s)
4. Restore from HF Dataset (if HF_TOKEN set)
5. **CRITICAL: Restart Hindsight after pg_restore** — API caches DB state, won't see restored data without restart
6. Periodic backup loop (every BACKUP_INTERVAL_SECONDS, default 6h)
7. If Hindsight dies: emergency backup → exit 1

## Bugs Encountered & Fixed

### 1. `set -euo pipefail` + non-zero exit codes
**Problem**: `set -e` kills script on ANY non-zero exit. `restore.py` returns 2 for "no backup", which killed the entrypoint.
**Fix**: `restore_exit=0; python3 restore.py || restore_exit=$?`

### 2. API doesn't see pg_restore data
**Problem**: pg_restore modifies PG underneath, but Hindsight's API has cached state from the empty DB.
**Fix**: Kill Hindsight after pg_restore, wait 5s, restart. The fresh API connects to PG with restored data.

### 3. SIGTERM handler not running (exit 137)
**Problem**: Docker's default 10s grace period was too short. `sleep 60` blocked signal delivery.
**Fix**: `sleep 60 &; wait $! || true` pattern + `--stop-timeout 120` for local testing.

### 4. Empty pgdump overwrites good one
**Problem**: Rebuild triggers SIGTERM on old container (empty DB after failed restore) → backup creates empty pgdump → overwrites good latest.pgdump.
**Fix**: History rotation preserves old snapshots. Can manually restore from history.

### 5. Seed timeout (600s)
**Problem**: `subprocess.run(timeout=600)` in health-check killed seed after 10min (90 docs need ~15min).
**Fix**: Changed to `subprocess.Popen()` fire-and-forget. Next health check verifies completion.

## Client-Side Scripts
- `hindsight-health-check.py`: GET /health + GET /stats → if 0 memories → wait 90s → re-check → Popen seed
- `hindsight-export.py`: broad recall queries → dedup → JSONL → HF Dataset upload
- `seed-hindsight.py`: 90 docs from ATUM-Agency + Projects (retain API)
- Scheduler: keepalive */30min, export */6h (PM2 daemon)

## Secrets
- HF Space: HF_TOKEN, HF_BACKUP_REPO (added via `api.add_space_secret()`)
- Local: HINDSIGHT_URL, HINDSIGHT_API_KEY in ~/.bashrc
