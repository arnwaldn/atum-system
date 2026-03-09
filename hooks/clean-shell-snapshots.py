#!/usr/bin/env python3
"""
Prevent corrupted shell snapshots on Git Bash/MINGW64 (Windows).

Claude Code's shell snapshot mechanism captures base64-encoded git completion
functions. When restored, bash interprets base64 as commands → ~170KB noise.

Fix: Use NTFS ACLs (icacls) to deny write access to the snapshot directory.
This prevents Claude Code from creating new corrupted snapshots entirely.
Falls back to deleting existing snapshots if any are found.

Hook types: PreToolUse (Bash), SessionStart
Exit code: always 0 (never blocks Claude)
"""

import glob
import json
import os
import stat
import subprocess
import sys


def ensure_ntfs_lock(snapshot_dir):
    """Ensure NTFS deny-write ACL is set on the snapshot directory."""
    win_path = os.path.normpath(snapshot_dir)
    username = os.environ.get("USERNAME", "arnau")

    # Test if write is already blocked
    test_file = os.path.join(snapshot_dir, "_test_write_check")
    try:
        with open(test_file, "w") as f:
            f.write("test")
        # Write succeeded — need to set ACL
        os.remove(test_file)
        subprocess.run(
            ["icacls", win_path, "/deny", f"{username}:(W,AD,WD)"],
            capture_output=True,
            timeout=5,
        )
        return "locked"
    except PermissionError:
        # Already locked
        return "already_locked"
    except Exception:
        return "error"


def clean_existing(snapshot_dir):
    """Delete any existing snapshot files."""
    files = glob.glob(os.path.join(snapshot_dir, "*.sh"))
    deleted = 0
    for f in files:
        try:
            os.chmod(f, stat.S_IWRITE | stat.S_IREAD)
            os.remove(f)
            deleted += 1
        except OSError:
            pass
    return deleted


def main():
    try:
        sys.stdin.read()
    except Exception:
        pass

    snapshot_dir = os.path.expanduser("~/.claude/shell-snapshots")
    if not os.path.isdir(snapshot_dir):
        return

    # Clean any existing snapshots
    deleted = clean_existing(snapshot_dir)

    # Ensure NTFS lock is in place
    lock_status = ensure_ntfs_lock(snapshot_dir)

    if deleted > 0 or lock_status == "locked":
        parts = []
        if deleted > 0:
            parts.append(f"cleaned {deleted} snapshot(s)")
        if lock_status == "locked":
            parts.append("applied NTFS write lock")
        output = {
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "additionalContext": f"Shell snapshots: {', '.join(parts)}",
            }
        }
        print(json.dumps(output))


if __name__ == "__main__":
    try:
        main()
    except Exception:
        pass
    raise SystemExit(0)
