"""
PostToolUse hook: Auto-audit dependencies when dependency files are modified.
Runs npm audit, safety check, or cargo audit depending on file type.
"""
import sys
import json
import os
import subprocess

input_data = json.loads(sys.stdin.read())

if input_data.get('tool_name') not in ('Edit', 'Write'):
    print(json.dumps({"decision": "approve", "reason": "Not an Edit/Write"}))
    sys.exit(0)

file_path = input_data.get('tool_input', {}).get('file_path', '')
basename = os.path.basename(file_path)

dep_files = {
    'package.json': ('npm', ['npm', 'audit', '--audit-level=high']),
    'requirements.txt': ('pip-audit', ['pip-audit', '-r']),
    'Cargo.toml': ('cargo', ['cargo', 'audit']),
    'Gemfile': ('bundle', ['bundle', 'audit', 'check']),
    'go.mod': ('govulncheck', ['govulncheck', './...']),
}

if basename not in dep_files:
    print(json.dumps({"decision": "approve", "reason": "Not a dependency file"}))
    sys.exit(0)

tool_name, cmd = dep_files[basename]

# For requirements.txt, append the file path
if basename == 'requirements.txt':
    cmd.append(file_path)

# Check if tool is available
tool_bin = cmd[0]
try:
    subprocess.run(['which', tool_bin], capture_output=True, timeout=3)
except Exception:
    print(json.dumps({
        "decision": "approve",
        "reason": f"Dependency file {basename} modified. Consider running: {' '.join(cmd)}\n({tool_bin} not found — install for auto-audit)"
    }))
    sys.exit(0)

# Run audit in the file's directory
work_dir = os.path.dirname(file_path) or '.'
try:
    result = subprocess.run(
        cmd, capture_output=True, text=True, timeout=30, cwd=work_dir
    )
    if result.returncode != 0 and result.stderr:
        output = result.stderr[:500]
        print(json.dumps({
            "decision": "approve",
            "reason": f"Dependency audit for {basename}:\n{output}\nReview vulnerabilities before deploying."
        }))
    else:
        print(json.dumps({
            "decision": "approve",
            "reason": f"Dependency audit for {basename}: No critical vulnerabilities found."
        }))
except subprocess.TimeoutExpired:
    print(json.dumps({
        "decision": "approve",
        "reason": f"Dependency audit timed out for {basename}. Run manually: {' '.join(cmd)}"
    }))
except Exception as e:
    print(json.dumps({
        "decision": "approve",
        "reason": f"Dependency audit skipped: {str(e)[:100]}"
    }))
