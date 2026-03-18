#!/usr/bin/env python3
"""Validate markdown files for common syntax issues.

Checks:
- Unclosed code blocks
- Missing table separators
- Table column count consistency
- BOM bytes

Usage:
    python scripts/validate-markdown.py           # Validate all
    python scripts/validate-markdown.py --check   # CI mode (exit 1 on issues)
    python scripts/validate-markdown.py --path FILE  # Single file
"""

import os
import re
import sys


def check_code_blocks(content, filepath):
    """Check for unclosed code blocks."""
    issues = []
    lines = content.split("\n")
    in_code = False
    code_start = 0

    for i, line in enumerate(lines, 1):
        stripped = line.strip()
        if stripped.startswith("```"):
            if in_code:
                in_code = False
            else:
                in_code = True
                code_start = i

    if in_code:
        issues.append(f"{filepath}:{code_start}: Unclosed code block")

    return issues


def check_tables(content, filepath):
    """Check table syntax."""
    issues = []
    lines = content.split("\n")
    in_table = False
    header_cols = 0
    table_start = 0

    for i, line in enumerate(lines, 1):
        stripped = line.strip()

        if stripped.startswith("|") and stripped.endswith("|"):
            if not in_table:
                in_table = True
                table_start = i
                header_cols = stripped.count("|") - 1

            # Check separator row (second row should be |---|)
            if i == table_start + 1:
                if not re.match(r"^\|[\s:-]+(\|[\s:-]+)+\|$", stripped):
                    issues.append(f"{filepath}:{i}: Missing or malformed table separator")

            # Check column count
            cols = stripped.count("|") - 1
            if cols != header_cols and header_cols > 0:
                issues.append(f"{filepath}:{i}: Column count mismatch (expected {header_cols}, got {cols})")
        else:
            if in_table:
                in_table = False
                header_cols = 0

    return issues


def check_bom(filepath):
    """Check for UTF-8 BOM."""
    with open(filepath, "rb") as f:
        header = f.read(3)
    if header == b"\xef\xbb\xbf":
        return [f"{filepath}: UTF-8 BOM detected (should be removed)"]
    return []


def validate_file(filepath):
    """Validate a single markdown file."""
    issues = []

    # BOM check
    issues.extend(check_bom(filepath))

    with open(filepath, "r", encoding="utf-8", errors="replace") as f:
        content = f.read()

    issues.extend(check_code_blocks(content, filepath))
    issues.extend(check_tables(content, filepath))

    return issues


def find_markdown_files(root_dir):
    """Find all .md files, excluding .git and node_modules."""
    md_files = []
    for dirpath, dirnames, filenames in os.walk(root_dir):
        dirnames[:] = [d for d in dirnames if d not in (".git", "node_modules", "__pycache__")]
        for f in filenames:
            if f.endswith(".md"):
                md_files.append(os.path.join(dirpath, f))
    return sorted(md_files)


def main():
    check_mode = "--check" in sys.argv
    single_path = None

    for i, arg in enumerate(sys.argv):
        if arg == "--path" and i + 1 < len(sys.argv):
            single_path = sys.argv[i + 1]

    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    if single_path:
        files = [single_path]
    else:
        files = find_markdown_files(root_dir)

    total_issues = 0

    for filepath in files:
        issues = validate_file(filepath)
        for issue in issues:
            print(issue)
            total_issues += 1

    if total_issues == 0:
        print(f"All {len(files)} markdown files valid.")
    else:
        print(f"\n{total_issues} issues found across {len(files)} files.")

    if check_mode and total_issues > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
