# Hindsight Seeding — Learnings (2026-03-03)

## Architecture
- HF Space `Arnwald84/atum-hindsight` on cpu-basic (2 shared vCPU, 16GB RAM)
- LLM: Gemini 2.5 Flash for entity extraction
- Each retain triggers ~5-20 async consolidation ops (varies by doc content density)
- cpu-basic processes ~8-11 consolidation ops/min

## Crash Thresholds (cpu-basic)
- **Peak pending 44**: OK (drains without crash)
- **Peak pending 67**: CRASH (single large doc spike)
- **Sustained CPU ~60 min**: CRASH regardless of pending peak
- Crash mechanism: sustained CPU → HF health check fails → container killed
- NOT memory (16GB is plenty) — purely CPU starvation

## Working Configuration (v3)
```python
MAX_CONTENT_CHARS = 5000   # Was 15000 — truncate to limit ops/doc
RATE_LIMIT_SECONDS = 15
BATCH_SIZE = 1             # Check backpressure after EVERY retain
CONSOLIDATION_THRESHOLD = 3
BACKPRESSURE_WAIT = 30
MAX_WAIT_CYCLES = 40
REST_EVERY_N_DOCS = 5      # Rest every 5 docs
REST_DURATION = 300         # 5 min cooldown (CPU fully idle)
```

## Key Fixes
1. **MAX_CONTENT_CHARS 15000→5000**: Caps consolidation ops per doc (~5-23 instead of ~67)
2. **Crash detection**: Monitor total_nodes; if drops >50%, Space restarted → abort
3. **Rest periods**: Every 5 docs, drain queue to 0 then sleep 5 min (CPU idle)
4. **Unicode encoding**: Never use → or other non-ASCII in print() (Windows cp1252)

## SKIP_RESTORE
- Added to entrypoint.sh — breaks post-restore consolidation death spiral
- Set as Space secret: HF API `add_space_secret('SKIP_RESTORE', '1')`
- After full seed + backup: remove SKIP_RESTORE → future restores have consolidated data

## Timing (v3 estimated)
- 5 docs per batch: ~10 min seed + ~5 min rest = ~15 min/batch
- 80 docs = 16 batches = ~4 hours total
- Expected: no crash (5-min idle periods reset CPU quota)

## Network (Windows)
- curl from Git Bash: SSL error 35 (Avast intercepts) → use Python requests
- MSYS2 Python 3.12: SSL cert errors → use Windows Python 3.13
- Python path: `/c/Users/arnau/AppData/Local/Programs/Python/Python313/python.exe`
- Always set PYTHONUNBUFFERED=1 for real-time log output

## Failed Approaches
- BATCH_SIZE=3, THRESHOLD=5, RATE=8s: crash at 40min (232 nodes)
- BATCH_SIZE=1, THRESHOLD=3, RATE=15s, MAX=15000: crash at 60min (67 pending spike)
- BATCH_SIZE=1, THRESHOLD=3, RATE=15s, MAX=5000, REST=10/3min: crash at 60min (rest too late)
