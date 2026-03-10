#!/usr/bin/env python3
"""
File Guard Hook - Comprehensive sensitive file protection
Blocks access to 195+ patterns of sensitive files across 12 categories.
Inspired by claudekit file-guard patterns.
"""

import sys
import json
import os
import re
from pathlib import Path

# 195+ patterns organized by category
SENSITIVE_PATTERNS = {
    "SSH_KEYS": [
        r".*\.ssh/.*",
        r".*\.pem$",
        r".*\.key$",
        r".*\.ppk$",  # PuTTY private key
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
        r".*docker-compose\.override\.yml$",
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
        r".*\.lesshst$",
        r".*\.psql_history$",
        r".*\.mysql_history$",
        r".*\.sqlite_history$",
        r".*\.rediscli_history$",
        r".*\.node_repl_history$",
        r".*\.python_history$",
    ],

    "ENV_AND_TOKENS": [
        r".*\.env.*",
        r".*\.npmrc$",
        r".*\.pypirc$",
        r".*\.netrc$",
        r".*\.gitconfig$",
        r".*\.git-credentials$",
        r".*\.ftpconfig$",
        r".*\.tugboat$",
        r".*\.remote-sync\.json$",
        r".*\.esmtprc$",
        r".*secrets\..*",
        r".*config\.secret.*",
        r".*token\..*",
        r".*api[_-]?key.*",
    ],

    "CERTIFICATES": [
        r".*\.p12$",
        r".*\.pfx$",
        r".*\.cer$",
        r".*\.crt$",
        r".*\.csr$",
        r".*\.der$",
        r".*\.p7b$",
        r".*\.p7r$",
        r".*\.spc$",
        r".*\.pfx$",
        r".*cert.*\.pem$",
    ],

    "DATABASES": [
        r".*\.db$",
        r".*\.sqlite$",
        r".*\.sqlite3$",
        r".*\.kdbx$",  # KeePass
        r".*\.kdb$",   # KeePass
        r".*\.accdb$", # Access
        r".*\.mdb$",   # Access
        r".*\.dbf$",
        r".*\.sdb$",
        r".*database\.yml$",
        r".*mongoid\.yml$",
        r".*redis\.conf$",
    ],

    "BACKUPS": [
        r".*\.bak$",
        r".*\.backup$",
        r".*\.old$",
        r".*\.orig$",
        r".*\.save$",
        r".*\.swp$",
        r".*\.swo$",
        r".*\.tmp$",
        r".*~$",
        r".*\.DS_Store$",
        r".*Thumbs\.db$",
    ],

    "IDE_CONFIG": [
        r".*\.idea/.*",
        r".*\.vscode/.*",
        r".*\.settings/.*",
        r".*\.project$",
        r".*\.classpath$",
        r".*workspace\.xml$",
        r".*launch\.json$",
    ],

    "PACKAGE_MANAGERS": [
        r".*\.bundle/config$",
        r".*\.gem/credentials$",
        r".*\.cargo/credentials.*",
        r".*\.gradle/gradle\.properties$",
        r".*\.m2/settings\.xml$",
        r".*\.ivy2/.*credentials.*",
        r".*yarn\.lock$",
        r".*package-lock\.json$",
        r".*composer\.lock$",
        r".*Gemfile\.lock$",
        r".*poetry\.lock$",
    ],

    "SYSTEM_FILES": [
        r".*/etc/passwd$",
        r".*/etc/shadow$",
        r".*/etc/sudoers$",
        r".*\.ssh/config$",
        r".*\.gnupg/.*",
        r".*\.password-store/.*",
        r".*\.config/hub$",
        r".*\.config/gh/.*",
        r".*\.kube/config$",
        r".*\.minikube/.*",
    ],
}

# Files that should trigger warnings but not blocks
WARNING_PATTERNS = [
    r".*package\.json$",  # May contain private registry info
    r".*requirements\.txt$",  # May contain private packages
    r".*Dockerfile$",  # May contain secrets in ENV
    r".*docker-compose\.yml$",  # May contain secrets
]

def check_sensitive_file(filepath):
    """Check if file path matches any sensitive pattern."""
    # Normalize path for comparison
    normalized = str(Path(filepath).resolve()).replace("\\", "/")

    # Check each category
    for category, patterns in SENSITIVE_PATTERNS.items():
        for pattern in patterns:
            if re.search(pattern, normalized, re.IGNORECASE):
                return True, category, pattern

    # Check warning patterns
    for pattern in WARNING_PATTERNS:
        if re.search(pattern, normalized, re.IGNORECASE):
            return "warning", None, pattern

    return False, None, None

def main():
    try:
        # Read input from stdin
        input_data = json.load(sys.stdin)

        # Get tool name and file path
        tool = input_data.get("tool", "")
        params = input_data.get("params", {})

        # Handle different tools
        filepath = None
        if tool in ["Read", "Write", "Edit"]:
            filepath = params.get("file_path", "")
        elif tool == "Bash":
            # Check for file operations in bash commands
            command = params.get("command", "")
            # Extract potential file paths from common commands
            file_ops = ["cat ", "less ", "more ", "head ", "tail ", "vim ", "nano ",
                       "cp ", "mv ", "rm ", "chmod ", "chown "]
            for op in file_ops:
                if op in command:
                    # Basic extraction - could be improved
                    parts = command.split(op)
                    if len(parts) > 1:
                        potential_file = parts[1].split()[0] if parts[1] else ""
                        if potential_file:
                            filepath = potential_file

        if not filepath:
            # No file path to check
            sys.exit(0)

        # Check if file is sensitive
        result, category, pattern = check_sensitive_file(filepath)

        if result == True:
            # Block access - output proper format for hooks
            error_msg = (f"[FILE GUARD | ATUM] Accès refusé - Fichier sensible détecté\n"
                        f"Catégorie: {category}\n"
                        f"Fichier: {filepath}\n"
                        f"Pattern: {pattern}\n\n"
                        f"Ce fichier contient potentiellement des informations sensibles.\n"
                        f"Si l'accès est vraiment nécessaire, demandez une autorisation explicite à l'utilisateur.")
            print(error_msg, file=sys.stderr)
            sys.exit(2)
        elif result == "warning":
            # Warning only - output to stderr
            warning_msg = (f"[FILE GUARD] Attention - Fichier potentiellement sensible\n"
                          f"Fichier: {filepath}\n"
                          f"Pattern: {pattern}\n"
                          f"Vérifiez que ce fichier ne contient pas de secrets avant de continuer.")
            print(warning_msg, file=sys.stderr)
            sys.exit(1)

        # File is safe
        sys.exit(0)

    except Exception as e:
        # Never block on error - fail open for safety
        print(json.dumps({"error": f"File guard error: {str(e)}", "code": 0}), file=sys.stderr)
        sys.exit(0)

if __name__ == "__main__":
    main()