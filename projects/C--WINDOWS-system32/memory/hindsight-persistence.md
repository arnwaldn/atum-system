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
1. `pg_dump -Fc` creates custom format dump (~1.3MB for 30 docs / 417 nodes)
2. **Guard**: refuse to upload if dump < 200 KB (prevents empty crash backups from overwriting good data)
3. Upload to HF Dataset as `snapshots/latest.pgdump` (overwrite)
4. Upload timestamped copy to `snapshots/history/{timestamp}.pgdump`
5. Rotate: keep last 10 history snapshots (was 5)

## Restore Flow (restore.py)
1. Download `snapshots/latest.pgdump` from HF Dataset
2. `pg_restore --clean --if-exists --no-owner --no-acl --single-transaction`
3. Return exit code: 0=restored, 2=no backup, 1=error

## Entrypoint Flow (entrypoint.sh)
1. Start Hindsight (`/app/start-all.sh &`)
2. Set SIGTERM trap (backup → kill_hindsight → shutdown)
3. Wait for healthy (curl /health, up to 300s)
4. Restore from HF Dataset (if HF_TOKEN set, unless SKIP_RESTORE set)
5. **kill_hindsight()** — kills process tree (pkill -P + SIGKILL), waits for port release (ss/netstat/fuser), then restarts
6. **10s minimum delay** before post-restart health check (prevents hitting stale old server)
7. Periodic backup loop (every BACKUP_INTERVAL_SECONDS, default 6h)
8. If Hindsight dies: emergency backup (guarded by MIN_DUMP_SIZE) → exit 1

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
**Fix v2 (2026-03-04)**: MIN_DUMP_SIZE_KB=200 guard — backup.py refuses to upload dumps < 200 KB.

### 5. Seed timeout (600s)
**Problem**: `subprocess.run(timeout=600)` in health-check killed seed after 10min (90 docs need ~15min).
**Fix**: Changed to `subprocess.Popen()` fire-and-forget. Next health check verifies completion.

### 6. Port conflict on restart after restore (2026-03-04)
**Problem**: `kill $PID` only killed the parent shell (start-all.sh). Child processes (uvicorn, pg0) survived as orphans holding port 7860. New Hindsight couldn't bind → crash. Health check post-restart falsely passed because OLD server still responded on :7860.
**Fix**: `kill_hindsight()` function — kills children first (pkill -P), then parent, force-kills survivors (SIGKILL), waits for port release (ss/netstat/fuser). Added 10s delay before post-restart health check.

### 7. Death spiral: crash → empty backup → restore empty → crash (2026-03-04)
**Problem**: Bug #6 caused crash loops. Each crash triggered emergency backup of empty DB (118 KB), overwriting good backup. Restore restored empty data. Rotation deleted good historical backups.
**Fix**: Combined fix of #6 (no more crashes) + MIN_DUMP_SIZE guard (no empty backups) + MAX_HISTORY 5→10 (more retention). Local backup rescue: good backup (1257 KB) saved to `~/Projects/tools/atum-hindsight-deploy/backups/`.

## Client-Side Scripts
- `hindsight-health-check.py`: GET /health + GET /stats → if 0 memories → wait 90s → re-check → Popen seed
- `hindsight-export.py`: broad recall queries → dedup → JSONL → HF Dataset upload
- `seed-hindsight.py`: 90 docs from ATUM-Agency + Projects (retain API)
- Scheduler: keepalive */30min, export */6h (PM2 daemon)

## Current State (2026-03-04)
- Hindsight v0.4.15 running on HF Space (RUNNING)
- Bank `atum`: 417 nodes, 30 documents, 31,049 links
- Bank `arnaud`: exists, empty (never seeded in backup)
- FastMCP `_tool_manager` warnings: non-fatal, tool filtering disabled but MCP tools work
- API endpoints: /health, /v1/default/banks/{bank}/stats, /documents, /memories/list, /memories/recall

## Secrets
- HF Space: HF_TOKEN, HF_BACKUP_REPO (added via `api.add_space_secret()`)
- Local: HINDSIGHT_URL, HINDSIGHT_API_KEY in ~/.bashrc

## Local Backups
- `~/Projects/tools/atum-hindsight-deploy/backups/snapshots/history/20260303T184524Z.pgdump` (1257.8 KB — good seeded data)
- `~/Projects/tools/atum-hindsight-deploy/backups/client-export/atum.jsonl` (102.4 KB, 214 lines)
