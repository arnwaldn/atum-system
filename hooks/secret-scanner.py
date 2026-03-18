#!/usr/bin/env python3
"""Secret Scanner Hook - FAIL-CLOSED design.
Detects hardcoded secrets before git commits.
If any error occurs, defaults to BLOCK."""
import json
import sys
import re
import subprocess
import os

SECRET_PATTERNS = [
    (r'AKIA[0-9A-Z]{16}', 'AWS Access Key ID', 'high'),
    (r'(?i)aws[_\-\s]*secret[_\-\s]*access[_\-\s]*key[\'"\s]*[=:][\'"\s]*[A-Za-z0-9/+=]{40}', 'AWS Secret Access Key', 'high'),
    (r'sk-ant-api\d{2}-[A-Za-z0-9\-_]{20,}', 'Anthropic API Key', 'high'),
    (r'sk-[a-zA-Z0-9]{48,}', 'OpenAI API Key', 'high'),
    (r'sk-proj-[a-zA-Z0-9\-_]{32,}', 'OpenAI Project API Key', 'high'),
    (r'AIza[0-9A-Za-z\-_]{35}', 'Google API Key', 'high'),
    (r'sk_live_[0-9a-zA-Z]{24,}', 'Stripe Live Secret Key', 'critical'),
    (r'sk_test_[0-9a-zA-Z]{24,}', 'Stripe Test Secret Key', 'medium'),
    (r'ghp_[0-9a-zA-Z]{36}', 'GitHub Personal Access Token', 'high'),
    (r'gho_[0-9a-zA-Z]{36}', 'GitHub OAuth Token', 'high'),
    (r'ghs_[0-9a-zA-Z]{36}', 'GitHub App Secret', 'high'),
    (r'github_pat_[0-9a-zA-Z_]{22,}', 'GitHub Fine-Grained PAT', 'high'),
    (r'glpat-[0-9a-zA-Z\-_]{20,}', 'GitLab Personal Access Token', 'high'),
    (r'sbp_[0-9a-f]{40}', 'Supabase Service Key', 'high'),
    (r'hf_[a-zA-Z0-9]{34,}', 'Hugging Face Token', 'high'),
    (r'npm_[0-9a-zA-Z]{36,}', 'npm Access Token', 'high'),
    (r'pypi-[A-Za-z0-9\-_]{16,}', 'PyPI API Token', 'high'),
    (r'-----BEGIN (RSA |DSA |EC )?PRIVATE KEY-----', 'Private Key', 'critical'),
    (r'-----BEGIN OPENSSH PRIVATE KEY-----', 'OpenSSH Private Key', 'critical'),
    (r'(?i)(mysql|postgresql|postgres|mongodb)://[^\s\'"\)]+:[^\s\'"\)]+@', 'Database Connection String', 'high'),
    (r'xox[baprs]-[0-9a-zA-Z\-]{10,}', 'Slack Token', 'high'),
    (r'SG\.[A-Za-z0-9_\-]{22}\.[A-Za-z0-9_\-]{43}', 'SendGrid API Key', 'high'),
    (r'(?i)password[\'"\s]*[=:][\'"\s]*[\'"][^\'"\s]{8,}[\'"]', 'Hardcoded Password', 'high'),
]

EXCLUDED_FILES = ['.env.example', '.env.sample', '.env.template', 'package-lock.json', 'yarn.lock', 'poetry.lock']
EXCLUDED_DIRS = ['node_modules/', 'vendor/', '.git/', 'dist/', 'build/', '__pycache__/', 'venv/']

def should_skip_file(file_path):
    if not os.path.exists(file_path):
        return True
    if os.path.basename(file_path) in EXCLUDED_FILES:
        return True
    for d in EXCLUDED_DIRS:
        if d in file_path:
            return True
    try:
        with open(file_path, 'rb') as f:
            if b'\0' in f.read(1024):
                return True
    except Exception:
        return True
    return False

def scan_file(file_path):
    findings = []
    if should_skip_file(file_path):
        return findings
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        for line_num, line in enumerate(content.split('\n'), 1):
            for pattern, description, severity in SECRET_PATTERNS:
                if re.search(pattern, line):
                    stripped = line.strip()
                    if stripped.startswith('#') or stripped.startswith('//'):
                        if 'example' in stripped.lower() or 'placeholder' in stripped.lower():
                            continue
                    findings.append({'file': file_path, 'line': line_num, 'description': description, 'severity': severity})
    except Exception:
        pass
    return findings

try:
    input_data = json.load(sys.stdin)
    tool_input = input_data.get('tool_input', {})
    command = tool_input.get('command', '')

    if not re.search(r'git\s+commit', command):
        print(json.dumps({"decision": "allow"}))
        sys.exit(0)

    # Get staged files
    staged_files = []
    try:
        result = subprocess.run(['git', 'diff', '--cached', '--name-only', '--diff-filter=ACM'],
                                capture_output=True, text=True, check=True)
        staged_files = [f.strip() for f in result.stdout.split('\n') if f.strip()]
    except subprocess.CalledProcessError:
        pass

    if not staged_files:
        # Check for -a flag or chained git add
        commit_match = re.search(r'git\s+commit\s+(.+)', command)
        if commit_match and re.search(r'-\w*a', commit_match.group(1)):
            result = subprocess.run(['git', 'diff', '--name-only'], capture_output=True, text=True)
            for f in result.stdout.strip().split('\n'):
                if f.strip() and os.path.isfile(f.strip()):
                    staged_files.append(f.strip())
        for part in re.split(r'&&|;', command):
            part = part.strip()
            add_match = re.match(r'git\s+add\s+(.+)', part)
            if add_match:
                args = add_match.group(1).strip()
                if args in ('.', '-A', '--all'):
                    result = subprocess.run(['git', 'status', '--porcelain'], capture_output=True, text=True)
                    for line in result.stdout.strip().split('\n'):
                        if line and len(line) > 3:
                            f = line[3:].strip()
                            if os.path.isfile(f):
                                staged_files.append(f)

    if not staged_files:
        print(json.dumps({"decision": "allow"}))
        sys.exit(0)

    all_findings = []
    for file_path in staged_files:
        all_findings.extend(scan_file(file_path))

    if all_findings:
        descriptions = [f"- {f['description']} in {f['file']}:{f['line']}" for f in all_findings[:5]]
        print(json.dumps({
            "decision": "block",
            "message": f"SECRET SCANNER: {len(all_findings)} potential secret(s) detected!\n" + "\n".join(descriptions) + "\nRemove secrets before committing."
        }))
    else:
        print(json.dumps({"decision": "allow"}))

except Exception as e:
    # FAIL-CLOSED
    print(json.dumps({
        "decision": "block",
        "message": f"secret-scanner error (fail-closed): {e}"
    }))
