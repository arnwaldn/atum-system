import sys
import json
import re

input_data = json.loads(sys.stdin.read())

if input_data.get('tool_name') != 'Bash':
    result = {"decision": "approve", "reason": "Not a Bash command"}
    print(json.dumps(result))
    sys.exit(0)

command = input_data.get('tool_input', {}).get('command', '')

# Check for git push commands
if not re.search(r'git\s+push\b', command):
    result = {"decision": "approve", "reason": "Not a git push"}
    print(json.dumps(result))
    sys.exit(0)

# Check if pushing to protected branches
protected_branches = ['main', 'master', 'production', 'release']

# Detect force push
is_force = bool(re.search(r'--force\b|-f\b', command))

# Detect target branch
target_branch = None
for branch in protected_branches:
    if re.search(rf'\b{branch}\b', command):
        target_branch = branch
        break

if is_force and target_branch:
    result = {
        "decision": "block",
        "reason": f"BLOCKED: Force push to protected branch '{target_branch}' is not allowed.\nUse a feature branch and create a PR instead."
    }
elif is_force:
    result = {
        "decision": "block",
        "reason": "BLOCKED: Force push detected. This can overwrite remote history.\nIf intentional, remove --force and use --force-with-lease instead."
    }
elif target_branch:
    result = {
        "decision": "block",
        "reason": f"WARNING: Direct push to '{target_branch}' detected.\nConsider using a feature branch and creating a PR.\nIf this is intentional, the user can approve this action."
    }
else:
    result = {"decision": "approve", "reason": "Push to non-protected branch"}

print(json.dumps(result))
