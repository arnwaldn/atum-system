"""
Unified Bash guard hook — replaces 4 separate hooks:
  - dangerous-command-blocker.py
  - conventional-commits-enforcer.py
  - prevent-direct-push.py
  - validate-branch-name.py

Single process spawn instead of 4 = ~400ms saved per Bash command.
"""
import sys
import json
import re

input_data = json.loads(sys.stdin.read())

if input_data.get('tool_name') != 'Bash':
    print(json.dumps({"decision": "approve", "reason": "Not a Bash command"}))
    sys.exit(0)

command = input_data.get('tool_input', {}).get('command', '')

# ============================================================
# 1. DANGEROUS COMMAND BLOCKER
# ============================================================
dangerous_patterns = [
    (r'rm\s+(-[a-zA-Z]+\s+)*/(\s|$|\*)', "rm on root directory"),
    (r'rm\s+-[a-zA-Z]*rf\b', "recursive force delete"),
    (r'mkfs\.', "filesystem format"),
    (r'dd\s+.*of=/dev/', "raw disk write"),
    (r':\(\)\s*\{\s*:\|:\s*&\s*\}\s*;:', "fork bomb"),
    (r'>\s*/dev/sd[a-z]', "raw device write"),
    (r'chmod\s+-R\s+777\s+/', "recursive 777 on root"),
    (r'DROP\s+DATABASE', "drop database"),
    (r'DROP\s+TABLE', "drop table"),
    (r'TRUNCATE\s+TABLE', "truncate table"),
    (r'DELETE\s+FROM\s+\w+\s*;?\s*$', "delete all rows (no WHERE)"),
]

for pattern, desc in dangerous_patterns:
    if re.search(pattern, command, re.IGNORECASE):
        print(json.dumps({
            "decision": "block",
            "reason": f"BLOCKED: Dangerous command detected — {desc}\nCommand: {command[:100]}"
        }))
        sys.exit(0)

# ============================================================
# 2. CONVENTIONAL COMMITS ENFORCER
# ============================================================
if re.search(r'git\s+commit\b', command) and not command.strip().startswith('#'):
    msg_match = re.search(r'-m\s+["\'](.+?)["\']', command)
    if not msg_match:
        heredoc_match = re.search(r'<<.*?EOF.*?\n(.+?)\n', command, re.DOTALL)
        if heredoc_match:
            msg = heredoc_match.group(1).strip().split('\n')[0]
        else:
            msg = None
    else:
        msg = msg_match.group(1).strip()

    if msg:
        valid_types = ['feat', 'fix', 'refactor', 'docs', 'test', 'chore', 'perf', 'ci', 'style', 'build', 'revert']
        pattern = r'^(' + '|'.join(valid_types) + r')(\(.+\))?!?:\s+.+'
        if not re.match(pattern, msg):
            print(json.dumps({
                "decision": "block",
                "reason": f"Commit message does not follow conventional format.\nExpected: <type>: <description>\nTypes: {', '.join(valid_types)}\nGot: {msg[:80]}"
            }))
            sys.exit(0)

# ============================================================
# 3. PREVENT DIRECT PUSH
# ============================================================
if re.search(r'git\s+push\b', command):
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
            "reason": f"BLOCKED: Force push to protected branch '{target_branch}' is not allowed.\nUse a feature branch and create a PR instead."
        }))
        sys.exit(0)
    elif is_force:
        print(json.dumps({
            "decision": "block",
            "reason": "BLOCKED: Force push detected. Use --force-with-lease instead."
        }))
        sys.exit(0)
    elif target_branch:
        print(json.dumps({
            "decision": "block",
            "reason": f"WARNING: Direct push to '{target_branch}' detected.\nConsider using a feature branch and creating a PR."
        }))
        sys.exit(0)

# ============================================================
# 4. VALIDATE BRANCH NAME
# ============================================================
branch_create = re.search(r'git\s+(checkout\s+-b|switch\s+-c|branch)\s+(?!-|\s)(\S+)', command)
if branch_create:
    branch_name = branch_create.group(2)
    valid_prefixes = [
        r'^(feature|feat)/.+',
        r'^(fix|bugfix|hotfix)/.+',
        r'^release/v?\d+\.\d+',
        r'^(chore|docs|test|ci|refactor|perf|style|build)/.+',
        r'^(main|master|develop|dev|staging)$',
    ]
    if not any(re.match(p, branch_name) for p in valid_prefixes):
        print(json.dumps({
            "decision": "block",
            "reason": f"Branch name '{branch_name}' does not follow naming convention.\n"
                      f"Expected: feature/*, fix/*, hotfix/*, release/v*.*.*, chore/*, docs/*, test/*, ci/*\n"
                      f"Example: feature/user-auth, fix/login-bug, release/v1.2.0"
        }))
        sys.exit(0)

# ============================================================
# ALL CLEAR
# ============================================================
print(json.dumps({"decision": "approve", "reason": "Command approved"}))
