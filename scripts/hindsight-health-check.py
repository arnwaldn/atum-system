#!/usr/bin/env python3
"""
Hindsight Health Check + Auto-Reseed

Called by the keepalive scheduler every 30 minutes.
1. Pings /health (keep-alive to prevent HF sleep)
2. Checks /stats for memory count
3. If bank is empty → waits for server-side restore → re-checks → triggers reseed

Env vars:
    HINDSIGHT_URL     — base URL
    HINDSIGHT_API_KEY — Bearer auth token
"""

import json
import os
import ssl
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

URL = os.environ.get("HINDSIGHT_URL", "").rstrip("/")
KEY = os.environ.get("HINDSIGHT_API_KEY", "")
# Search installed location first, then fall back to dev repo
_installed = Path.home() / ".claude" / "scripts" / "seed-workspace.py"
_dev_repo = Path.home() / "Projects" / "tools" / "claude-code-config" / "scripts" / "seed-workspace.py"
SEED_SCRIPT = str(_installed if _installed.exists() else _dev_repo)
RESTORE_WAIT = 90  # seconds to wait for server-side restore

HEADERS = {"Authorization": f"Bearer {KEY}", "Content-Type": "application/json"}
CTX = ssl.create_default_context()


def log(msg: str) -> None:
    print(f"[HEALTH] {msg}", flush=True)


def api_get(path: str, timeout: int = 15):
    """GET request to Hindsight API."""
    req = urllib.request.Request(f"{URL}{path}", headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=CTX) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, {"error": str(e)}
    except Exception as e:
        return None, {"error": str(e)}


def get_memory_count(bank: str) -> int:
    """Get total memory count for a bank via /stats."""
    status, data = api_get(f"/v1/default/banks/{bank}/stats")
    if status == 200 and isinstance(data, dict):
        return data.get("total_nodes", 0)
    return -1


def trigger_reseed() -> bool:
    """Launch seed-workspace.py as background process (fire-and-forget).

    The seed script takes ~30-60 min for 90+ docs (with backpressure on cpu-basic).
    PDFs are skipped for auto-reseed (too heavy). We launch it detached
    so the health-check can return quickly. Next health-check (30 min later)
    will verify the reseed completed by checking memory count.
    """
    log(f"Triggering reseed (background): {SEED_SCRIPT}")

    if not Path(SEED_SCRIPT).exists():
        log(f"Seed script not found: {SEED_SCRIPT}")
        return False

    subprocess.Popen(
        [sys.executable, SEED_SCRIPT, "--skip-pdf"],
        env={**os.environ, "HINDSIGHT_URL": URL, "HINDSIGHT_API_KEY": KEY},
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    log("Reseed launched in background — will verify on next health check")
    return True


def main() -> None:
    if not URL or not KEY:
        log("ERROR: HINDSIGHT_URL and HINDSIGHT_API_KEY must be set")
        sys.exit(1)

    # Step 1: Health check (keep-alive)
    status, data = api_get("/health")
    if status != 200:
        log(f"HEALTH FAIL: status={status} data={data}")
        sys.exit(1)

    log(f"HEALTH OK: {data.get('status', 'unknown')}")

    # Step 2: Check memory count for atum bank
    count = get_memory_count("atum")
    if count < 0:
        log("WARNING: Could not get stats — skipping memory check")
        return

    log(f"ATUM bank: {count} memories")

    if count > 0:
        log("All healthy — no action needed")
        return

    # Step 3: Bank is empty — space likely restarted
    log("WARNING: atum bank has 0 memories — space likely restarted")
    log(f"Waiting {RESTORE_WAIT}s for server-side restore to complete...")
    time.sleep(RESTORE_WAIT)

    # Re-check after waiting
    count = get_memory_count("atum")
    if count > 0:
        log(f"Server-side restore worked: {count} memories now present")
        return

    # Step 4: Server restore didn't work — trigger reseed
    log("Server-side restore did not restore atum bank — triggering reseed")
    success = trigger_reseed()

    if success:
        final_count = get_memory_count("atum")
        log(f"Post-reseed: {final_count} memories in atum bank")
    else:
        log("RESEED FAILED — manual intervention needed")
        sys.exit(1)


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        log(f"UNEXPECTED ERROR: {e}")
        sys.exit(1)
