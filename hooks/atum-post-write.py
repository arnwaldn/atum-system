#!/usr/bin/env python3
"""
ATUM Audit — Post-Write/Edit hook for Claude Code.

Automatically hashes and registers files in the audit store
after every Write or Edit operation by Claude.

Hook type: PostToolUse, matcher: Write|Edit
Exit code: always 0 (never blocks Claude)
"""

import json
import os
import sys
import threading
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import URLError


def retain_to_hindsight(filepath: str):
    """Fire-and-forget: send ATUM workspace file change to Hindsight."""
    url = os.environ.get("HINDSIGHT_URL", "").rstrip("/")
    key = os.environ.get("HINDSIGHT_API_KEY", "")
    user = os.environ.get("ATUM_USER", "arnaud")
    if not url or not key:
        return

    home = Path.home()
    atum_workspace = home / "Documents" / "ATUM-Agency"
    fp = Path(filepath).resolve()

    # Only retain files in the ATUM workspace
    try:
        fp.relative_to(atum_workspace)
    except ValueError:
        return

    short_path = str(fp).replace(str(home), "~").replace("\\", "/")
    content = f"Fichier ATUM modifie par {user}: {short_path}"
    doc_id = f"atum-write-{short_path.replace('/', '-').replace('~', '')}"
    payload = json.dumps({
        "items": [{"content": content, "context": "atum-workspace", "document_id": doc_id}],
    }).encode("utf-8")

    try:
        req = Request(
            f"{url}/v1/default/banks/atum/memories",
            data=payload,
            headers={"Content-Type": "application/json", "Authorization": f"Bearer {key}"},
            method="POST",
        )
        urlopen(req, timeout=10)
    except (URLError, OSError):
        pass  # fire-and-forget


def main():
    # Read tool input from stdin
    try:
        data = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        return

    # Extract file path
    tool_input = data.get("tool_input", {})
    filepath = tool_input.get("file_path", "")
    if not filepath:
        return

    fp = Path(filepath).resolve()
    if not fp.exists() or not fp.is_file():
        return

    # Skip audit store files to avoid recursion
    if "audit_store" in str(fp):
        return

    # Add ATUM library to path (for importing atum_audit package)
    lib_dir = os.environ.get("ATUM_PROJECT_DIR", "")
    if lib_dir and lib_dir not in sys.path:
        sys.path.insert(0, lib_dir)

    from atum_audit.discovery import get_agent_for_path

    # Auto-detect project from file path (auto-init if needed)
    agent = get_agent_for_path(fp, auto_init=True, lib_dir=lib_dir or None)
    if agent is None:
        return  # File not inside any detectable project

    agent.process_file_event(str(fp), "modified")
    agent.flush()

    # Fire-and-forget: send to Hindsight shared memory (non-blocking)
    t = threading.Thread(target=retain_to_hindsight, args=(filepath,), daemon=True)
    t.start()
    t.join(timeout=5)  # wait max 5s, then abandon


if __name__ == "__main__":
    try:
        main()
    except ImportError as e:
        print(f"[ATUM] WARNING: import failed — {e}. Check ATUM_PROJECT_DIR.", file=sys.stderr)
    except Exception as e:
        print(f"[ATUM] WARNING: post-write hook error — {e}", file=sys.stderr)
    sys.exit(0)
