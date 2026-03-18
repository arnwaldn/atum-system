#!/usr/bin/env python3
"""Validate agent .md files: YAML frontmatter, required fields.

Usage:
    python scripts/validate-agents.py           # Validate all
    python scripts/validate-agents.py --check   # CI mode (exit 1 on errors)
"""

import os
import re
import sys


VALID_MODELS = {"opus", "sonnet", "haiku"}


def parse_agent_frontmatter(content):
    """Parse agent YAML frontmatter."""
    if not content.startswith("---"):
        return None, "No frontmatter delimiter"

    end = content.find("---", 3)
    if end == -1:
        return None, "Unclosed frontmatter"

    fm_text = content[3:end].strip()
    fields = {}

    for line in fm_text.split("\n"):
        line = line.rstrip()
        match = re.match(r"^([a-z][a-zA-Z0-9_-]*)\s*:\s*(.*)$", line)
        if match:
            key, value = match.group(1), match.group(2).strip()
            fields[key] = value

    return fields, None


def validate_agent(agent_path, agent_name):
    """Validate a single agent file. Returns (errors, warnings)."""
    errors = []
    warnings = []

    with open(agent_path, "r", encoding="utf-8", errors="replace") as f:
        content = f.read()

    fields, parse_error = parse_agent_frontmatter(content)
    if parse_error:
        errors.append(f"Frontmatter: {parse_error}")
        return errors, warnings

    # Required: model
    if "model" not in fields:
        errors.append("Missing required field: model")
    elif fields["model"] not in VALID_MODELS:
        errors.append(f"Invalid model: '{fields['model']}' (must be one of: {', '.join(VALID_MODELS)})")

    # Required: description (or name)
    if "description" not in fields and "name" not in fields:
        warnings.append("Missing description or name field")

    # Recommended: tools
    if "tools" not in fields:
        warnings.append("Missing tools field")

    # Check for body content after frontmatter
    body_start = content.find("---", 3) + 3
    body = content[body_start:].strip()
    if len(body) < 50:
        warnings.append("Agent body is very short (< 50 chars)")

    return errors, warnings


def main():
    check_mode = "--check" in sys.argv

    agents_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "agents")

    if not os.path.isdir(agents_dir):
        print(f"ERROR: agents directory not found: {agents_dir}")
        sys.exit(1)

    total_errors = 0
    total_warnings = 0
    total_agents = 0

    for agent_file in sorted(os.listdir(agents_dir)):
        if not agent_file.endswith(".md"):
            continue

        total_agents += 1
        agent_path = os.path.join(agents_dir, agent_file)
        agent_name = agent_file[:-3]  # Remove .md

        errors, warnings = validate_agent(agent_path, agent_name)

        if errors or warnings:
            print(f"\n{agent_name}:")
            for e in errors:
                print(f"  ERROR: {e}")
                total_errors += 1
            for w in warnings:
                print(f"  WARN:  {w}")
                total_warnings += 1
        else:
            if not check_mode:
                print(f"  OK: {agent_name}")

    print(f"\n{'='*50}")
    print(f"Agents: {total_agents} | Errors: {total_errors} | Warnings: {total_warnings}")

    if check_mode and total_errors > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
