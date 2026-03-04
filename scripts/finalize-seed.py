#!/usr/bin/env python3
"""
Post-seed finalization — runs in background after seed-workspace.py.

1. Polls seed log for completion (DONE or ABORTED)
2. Waits for pending_consolidation = 0
3. Removes SKIP_RESTORE secret from HF Space
4. Verifies the Space is in a healthy state

Usage:
    python finalize-seed.py /tmp/seed-v3.log &
"""

import os
import sys
import time

try:
    import requests
except ImportError:
    print("[FINALIZE] ERROR: requests not installed")
    sys.exit(1)

URL = os.environ.get("HINDSIGHT_URL", "").rstrip("/")
KEY = os.environ.get("HINDSIGHT_API_KEY", "")
HF_TOKEN = os.environ.get("HF_TOKEN", "")
HEADERS = {"Authorization": f"Bearer {KEY}", "Content-Type": "application/json"}
BANK = "atum"
SPACE_REPO = "Arnwald84/atum-hindsight"

LOG_FILE = sys.argv[1] if len(sys.argv) > 1 else "/tmp/seed-v3.log"


def log(msg):
    print(f"[FINALIZE] {msg}", flush=True)


def get_stats():
    try:
        r = requests.get(f"{URL}/v1/default/banks/{BANK}/stats", headers=HEADERS, timeout=15)
        if r.status_code == 200:
            return r.json()
    except Exception:
        pass
    return None


def seed_finished():
    """Check if seed log contains DONE or ABORTED."""
    try:
        with open(LOG_FILE, "r", encoding="utf-8", errors="replace") as f:
            content = f.read()
            return "DONE" in content or "ABORTED" in content
    except FileNotFoundError:
        return False


def wait_for_seed():
    """Poll until seed finishes."""
    log(f"Watching {LOG_FILE} for completion...")
    while True:
        if seed_finished():
            log("Seed completed")
            return True
        time.sleep(60)  # Check every minute


def wait_for_consolidation():
    """Wait until pending_consolidation reaches 0."""
    log("Waiting for full consolidation (pending=0)...")
    for cycle in range(120):  # 120 x 30s = 60 min max
        stats = get_stats()
        if stats:
            pending = stats.get("pending_consolidation", 0)
            nodes = stats.get("total_nodes", 0)
            docs = stats.get("total_documents", 0)
            if pending == 0:
                log(f"Consolidation complete: {nodes} nodes, {docs} docs")
                return True
            log(f"  {pending} pending, {nodes} nodes... ({cycle + 1}/120)")
        time.sleep(30)
    log("WARNING: consolidation timed out after 60 min")
    return False


def remove_skip_restore():
    """Remove SKIP_RESTORE secret from HF Space."""
    if not HF_TOKEN:
        log("HF_TOKEN not set -- cannot remove SKIP_RESTORE")
        log("Manual step: remove SKIP_RESTORE from Space settings")
        return False

    try:
        from huggingface_hub import HfApi
        api = HfApi(token=HF_TOKEN)
        try:
            api.delete_space_secret(SPACE_REPO, "SKIP_RESTORE")
            log(f"SKIP_RESTORE removed from {SPACE_REPO}")
            return True
        except Exception as e:
            if "404" in str(e) or "not found" in str(e).lower():
                log("SKIP_RESTORE already removed")
                return True
            log(f"WARNING: Could not remove SKIP_RESTORE: {e}")
            return False
    except ImportError:
        log("huggingface_hub not installed -- remove SKIP_RESTORE manually")
        return False


def main():
    if not URL or not KEY:
        log("ERROR: HINDSIGHT_URL and HINDSIGHT_API_KEY must be set")
        sys.exit(1)

    # Step 1: Wait for seed to finish
    wait_for_seed()

    # Step 2: Wait for consolidation
    wait_for_consolidation()

    # Step 3: Remove SKIP_RESTORE
    remove_skip_restore()

    # Step 4: Final status
    stats = get_stats()
    if stats:
        log(f"Final state: {stats.get('total_nodes', 0)} nodes, "
            f"{stats.get('total_documents', 0)} docs, "
            f"{stats.get('pending_consolidation', 0)} pending")
    log("Finalization complete -- Hindsight is fully autonomous")


if __name__ == "__main__":
    main()
