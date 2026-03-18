#!/usr/bin/env python3
"""File guard hook - FAIL-CLOSED design.
Blocks access to sensitive file patterns across 12 categories.
If any error occurs, defaults to BLOCK."""
import sys
import json
import re
from pathlib import Path

SENSITIVE_PATTERNS = {
    "SSH_KEYS": [
        r".*\.ssh/.*",
        r".*\.pem$",
        r".*\.key$",
        r".*\.ppk$",
        r".*id_rsa.*",
        r".*id_dsa.*",
        r".*id_ecdsa.*",
        r".*id_ed25519.*",
        r".*ssh_host_.*_key$",
        r".*authorized_keys.*",
        r".*known_hosts$",
    ],
    "AWS_CREDENTIALS": [
        r".*\.aws/.*",
        r".*credentials$",
        r".*aws_access_key.*",
        r".*aws_secret.*",
        r".*\.s3cfg$",
        r".*\.boto$",
    ],
    "DOCKER_CONFIG": [
        r".*\.docker/config\.json$",
        r".*\.dockercfg$",
    ],
    "CRYPTO_WALLETS": [
        r".*wallet\.dat$",
        r".*wallet\.json$",
        r".*keystore/.*",
        r".*\.keystore$",
        r".*\.wallet$",
        r".*mnemonic.*",
        r".*seed\.txt$",
        r".*private_key.*",
    ],
    "SHELL_HISTORY": [
        r".*_history$",
        r".*\.bash_history$",
        r".*\.zsh_history$",
        r".*\.fish_history$",
        r".*\.sh_history$",
        r".*\.histfile$",
        r".*\.psql_history$",
        r".*\.mysql_history$",
        r".*\.node_repl_history$",
        r".*\.python_history$",
    ],
    "ENV_AND_TOKENS": [
        r".*\.env($|\.)",
        r".*\.npmrc$",
        r".*\.pypirc$",
        r".*\.netrc$",
        r".*\.git-credentials$",
        r".*secrets?\.(ya?ml|json|toml)",
        r".*config\.secret.*",
        r".*api[_-]?key.*",
    ],
    "CERTIFICATES": [
        r".*\.p12$",
        r".*\.pfx$",
        r".*\.cer$",
        r".*\.crt$",
        r".*\.csr$",
        r".*\.der$",
        r".*cert.*\.pem$",
    ],
    "DATABASES": [
        r".*\.kdbx$",
        r".*\.kdb$",
    ],
    "SYSTEM_FILES": [
        r".*/etc/passwd$",
        r".*/etc/shadow$",
        r".*/etc/sudoers$",
        r".*\.gnupg/.*",
        r".*\.password-store/.*",
        r".*\.kube/config$",
    ],
}

try:
    input_data = json.load(sys.stdin)
    tool_input = input_data.get("tool_input", {})

    # Extract file path from various tool input formats
    file_path = (
        tool_input.get("file_path", "")
        or tool_input.get("path", "")
        or tool_input.get("command", "")
    )

    if not file_path:
        print(json.dumps({"decision": "allow"}))
        sys.exit(0)

    normalized = str(Path(file_path)).replace("\\", "/")

    for category, patterns in SENSITIVE_PATTERNS.items():
        for pattern in patterns:
            if re.search(pattern, normalized, re.IGNORECASE):
                print(json.dumps({
                    "decision": "block",
                    "message": f"BLOCKED: Access to sensitive file ({category}) matching '{pattern}'"
                }))
                sys.exit(0)

    print(json.dumps({"decision": "allow"}))

except Exception as e:
    # FAIL-CLOSED: on error, block
    print(json.dumps({
        "decision": "block",
        "message": f"file-guard error (fail-closed): {e}"
    }))
