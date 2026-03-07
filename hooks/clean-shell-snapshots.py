#!/usr/bin/env python3
"""
Clean corrupted shell snapshots before each Bash invocation and at session start.

On Git Bash/MINGW64 (Windows), Claude Code's shell snapshot mechanism
captures base64-encoded git completion functions as raw text. When the
snapshot is later sourced, bash interprets these base64 strings as
commands, generating hundreds of "command not found" errors.

Fix: delete all snapshot files before each bash call and at session start.
Claude Code recreates a clean snapshot after each shell process.

Hook types: PreToolUse (Bash), SessionStart
Exit code: always 0 (never blocks Claude)
"""

import glob
import json
import os
import stat
import sys


def main():
    # Consume stdin to avoid broken pipe (PreToolUse sends JSON on stdin)
    try:
        sys.stdin.read()
    except Exception:
        pass

    snapshot_dir = os.path.expanduser("~/.claude/shell-snapshots")
    if not os.path.isdir(snapshot_dir):
        return

    files = glob.glob(os.path.join(snapshot_dir, "*.sh"))
    if not files:
        return

    deleted = 0
    for f in files:
        try:
            os.chmod(f, stat.S_IWRITE | stat.S_IREAD)
            os.remove(f)
            deleted += 1
        except OSError:
            pass

    if deleted > 0:
        output = {
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "additionalContext": f"Cleaned {deleted} corrupted shell snapshot(s)",
            }
        }
        print(json.dumps(output))


if __name__ == "__main__":
    try:
        main()
    except Exception:
        pass
    raise SystemExit(0)
