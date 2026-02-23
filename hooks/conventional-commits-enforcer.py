import sys
import json
import re

input_data = json.loads(sys.stdin.read())

if input_data.get('tool_name') != 'Bash':
    result = {"decision": "approve", "reason": "Not a Bash command"}
    print(json.dumps(result))
    sys.exit(0)

command = input_data.get('tool_input', {}).get('command', '')

# Only check git commit commands
if not re.search(r'git\s+commit\b', command):
    result = {"decision": "approve", "reason": "Not a git commit"}
    print(json.dumps(result))
    sys.exit(0)

# Extract commit message from -m flag
msg_match = re.search(r'-m\s+["\'](.+?)["\']', command)
if not msg_match:
    # Check for heredoc-style commit message
    heredoc_match = re.search(r'<<.*?EOF.*?\n(.+?)\n', command, re.DOTALL)
    if heredoc_match:
        msg = heredoc_match.group(1).strip().split('\n')[0]
    else:
        result = {"decision": "approve", "reason": "Could not parse commit message"}
        print(json.dumps(result))
        sys.exit(0)
else:
    msg = msg_match.group(1).strip()

# Validate conventional commit format
valid_types = ['feat', 'fix', 'refactor', 'docs', 'test', 'chore', 'perf', 'ci', 'style', 'build', 'revert']
pattern = r'^(' + '|'.join(valid_types) + r')(\(.+\))?!?:\s+.+'

if re.match(pattern, msg):
    result = {"decision": "approve", "reason": f"Valid conventional commit: {msg[:50]}"}
else:
    result = {
        "decision": "block",
        "reason": f"Commit message does not follow conventional format.\nExpected: <type>: <description>\nTypes: {', '.join(valid_types)}\nGot: {msg[:80]}"
    }

print(json.dumps(result))
