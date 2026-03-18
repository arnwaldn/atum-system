#!/usr/bin/env python3
"""Git guard hook - FAIL-CLOSED design.
Blocks force-push and push to protected branches.
If any error occurs, defaults to BLOCK."""
import sys
import json
import re

try:
    input_data = json.load(sys.stdin)
    tool_input = input_data.get('tool_input', {})
    command = tool_input.get('command', '')

    if not re.search(r'git\s+push\b', command):
        print(json.dumps({"decision": "allow"}))
        sys.exit(0)

    protected_branches = ['main', 'master', 'production', 'release']
    is_force = bool(re.search(r'--force\b|-f\b', command))

    target_branch = None
    for branch in protected_branches:
        if re.search(rf'\b{branch}\b', command):
            target_branch = branch
            break

    if is_force and target_branch:
        print(json.dumps({
            "decision": "block",
            "message": f"BLOCKED: Force push to protected branch '{target_branch}' is not allowed."
        }))
    elif is_force:
        print(json.dumps({
            "decision": "block",
            "message": "BLOCKED: Force push detected. Use --force-with-lease instead."
        }))
    elif target_branch:
        # Allow push to main for config repos, warn for others
        print(json.dumps({
            "decision": "block",
            "message": f"WARNING: Direct push to '{target_branch}' detected. Consider using a feature branch and creating a PR."
        }))
    else:
        print(json.dumps({"decision": "allow"}))

except Exception as e:
    # FAIL-CLOSED
    print(json.dumps({
        "decision": "block",
        "message": f"git-guard error (fail-closed): {e}"
    }))
