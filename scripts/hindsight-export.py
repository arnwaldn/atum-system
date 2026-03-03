#!/usr/bin/env python3
"""
Hindsight Client-Side Export

Uses the deterministic GET /memories/list endpoint to export ALL memories
from each bank to local JSONL files. Optionally pushes to HF Dataset.

Called by the scheduler every 6 hours.

Env vars:
    HINDSIGHT_URL      — base URL
    HINDSIGHT_API_KEY  — Bearer auth token
    HF_TOKEN           — HuggingFace write token (optional)
    HF_BACKUP_REPO     — Dataset repo (optional, default: Arnwald84/atum-hindsight-backup)
"""

import hashlib
import json
import os
import ssl
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

URL = os.environ.get("HINDSIGHT_URL", "").rstrip("/")
KEY = os.environ.get("HINDSIGHT_API_KEY", "")
HF_TOKEN = os.environ.get("HF_TOKEN", "")
HF_REPO = os.environ.get("HF_BACKUP_REPO", "Arnwald84/atum-hindsight-backup")

HEADERS = {"Authorization": f"Bearer {KEY}", "Content-Type": "application/json"}
CTX = ssl.create_default_context()
LOCAL_DIR = Path.home() / ".claude" / "hindsight-export"

BANKS = ["atum", "arnaud"]
PAGE_SIZE = 100


def log(msg: str) -> None:
    print(f"[EXPORT] {msg}", flush=True)


def api_get(path: str, timeout: int = 30):
    """GET request to Hindsight API."""
    req = urllib.request.Request(f"{URL}{path}", headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=CTX) as r:
            return r.status, json.loads(r.read())
    except Exception as e:
        return None, {"error": str(e)}


def content_hash(text: str) -> str:
    """Short SHA-256 hash for deduplication."""
    return hashlib.sha256(text.encode()).hexdigest()[:16]


def export_bank(bank: str) -> int:
    """Export all memories from a bank using paginated /memories/list."""
    LOCAL_DIR.mkdir(parents=True, exist_ok=True)
    jsonl_path = LOCAL_DIR / f"{bank}.jsonl"
    timestamp = datetime.now(timezone.utc).isoformat()

    # Load existing hashes for deduplication
    existing_hashes = set()
    if jsonl_path.exists():
        for line in jsonl_path.read_text(encoding="utf-8").splitlines():
            if line.strip():
                try:
                    record = json.loads(line)
                    existing_hashes.add(record.get("hash", ""))
                except json.JSONDecodeError:
                    pass

    # Paginate through all memories
    new_count = 0
    offset = 0

    with open(jsonl_path, "a", encoding="utf-8") as f:
        while True:
            status, data = api_get(
                f"/v1/default/banks/{bank}/memories/list?limit={PAGE_SIZE}&offset={offset}"
            )

            if status != 200 or not isinstance(data, dict):
                log(f"  Error fetching offset={offset}: {data}")
                break

            items = data.get("items", [])
            total = data.get("total", 0)

            for item in items:
                text = item.get("text", "")
                if not text:
                    continue

                h = content_hash(text)
                if h in existing_hashes:
                    continue

                existing_hashes.add(h)
                record = {
                    "hash": h,
                    "bank": bank,
                    "memory_id": item.get("id", ""),
                    "text": text,
                    "context": item.get("context", ""),
                    "date": item.get("date", ""),
                    "exported_at": timestamp,
                }
                f.write(json.dumps(record, ensure_ascii=False) + "\n")
                new_count += 1

            offset += PAGE_SIZE
            if offset >= total or not items:
                break

    log(f"  {bank}: {new_count} new memories exported (total in JSONL: {len(existing_hashes)})")
    return new_count


def push_to_hf() -> None:
    """Upload JSONL files to HF Dataset."""
    if not HF_TOKEN:
        log("HF_TOKEN not set — local backup only")
        return

    try:
        from huggingface_hub import HfApi
    except ImportError:
        log("huggingface_hub not installed — skipping HF upload")
        return

    api = HfApi(token=HF_TOKEN)
    api.create_repo(repo_id=HF_REPO, repo_type="dataset", exist_ok=True, private=True)

    for bank in BANKS:
        jsonl_path = LOCAL_DIR / f"{bank}.jsonl"
        if jsonl_path.exists() and jsonl_path.stat().st_size > 0:
            api.upload_file(
                path_or_fileobj=str(jsonl_path),
                path_in_repo=f"client-export/{bank}.jsonl",
                repo_id=HF_REPO,
                repo_type="dataset",
                commit_message=f"Client export {datetime.now(timezone.utc).strftime('%Y-%m-%d')} — {bank}",
            )
            log(f"  Uploaded {bank}.jsonl to {HF_REPO}/client-export/")

    log("HF upload complete")


def main() -> None:
    if not URL or not KEY:
        log("ERROR: HINDSIGHT_URL and HINDSIGHT_API_KEY must be set")
        sys.exit(1)

    log("Starting export...")
    total_new = 0

    for bank in BANKS:
        log(f"Exporting bank: {bank}")
        total_new += export_bank(bank)

    push_to_hf()

    log(f"Done: {total_new} new memories exported across all banks")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        log(f"UNEXPECTED ERROR: {e}")
        sys.exit(1)
