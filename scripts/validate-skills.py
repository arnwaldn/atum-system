#!/usr/bin/env python3
"""Validate SKILL.md files: YAML frontmatter, required fields, references.

Usage:
    python scripts/validate-skills.py           # Validate all
    python scripts/validate-skills.py --skill scheduler  # Single skill
    python scripts/validate-skills.py --check   # CI mode (exit 1 on errors)
"""

import os
import re
import sys


def parse_yaml_frontmatter(content):
    """Simple YAML frontmatter parser (no PyYAML dependency)."""
    if not content.startswith("---"):
        return None, "No frontmatter delimiter"

    end = content.find("---", 3)
    if end == -1:
        return None, "Unclosed frontmatter"

    fm_text = content[3:end].strip()
    fields = {}

    for line in fm_text.split("\n"):
        line = line.rstrip()
        # Top-level field
        match = re.match(r"^([a-z][a-z0-9_-]*)\s*:\s*(.*)$", line)
        if match:
            key, value = match.group(1), match.group(2).strip()
            fields[key] = value
        # Metadata sub-field
        match = re.match(r"^\s{2,}([a-z][a-z0-9_-]*)\s*:\s*(.*)$", line)
        if match:
            key, value = match.group(1), match.group(2).strip()
            fields[f"metadata.{key}"] = value

    return fields, None


def validate_skill(skill_dir, skill_name):
    """Validate a single skill. Returns (errors, warnings)."""
    errors = []
    warnings = []

    skill_path = os.path.join(skill_dir, "SKILL.md")
    if not os.path.exists(skill_path):
        errors.append("Missing SKILL.md")
        return errors, warnings

    with open(skill_path, "r", encoding="utf-8", errors="replace") as f:
        content = f.read()

    # Parse frontmatter
    fields, parse_error = parse_yaml_frontmatter(content)
    if parse_error:
        errors.append(f"Frontmatter: {parse_error}")
        return errors, warnings

    # Required fields
    if "name" not in fields:
        errors.append("Missing required field: name")
    elif fields["name"] != skill_name:
        warnings.append(f"Name mismatch: frontmatter='{fields['name']}', dir='{skill_name}'")

    if "description" not in fields:
        errors.append("Missing required field: description")
    else:
        desc = fields["description"]
        # Check for "Use when" trigger (skip multiline descriptions)
        if not desc.startswith("|") and not desc.startswith(">"):
            if "use when" not in desc.lower() and "use this" not in desc.lower():
                warnings.append("Description should contain 'Use when' trigger clause")

    # Recommended metadata fields
    recommended = ["metadata.domain", "metadata.triggers", "metadata.role"]
    for field in recommended:
        if field not in fields:
            warnings.append(f"Missing recommended field: {field}")

    # Check references directory
    refs_dir = os.path.join(skill_dir, "references")
    if os.path.isdir(refs_dir):
        ref_files = [f for f in os.listdir(refs_dir) if f.endswith(".md")]
        if not ref_files:
            warnings.append("References directory exists but is empty")

        # Check routing table in SKILL.md
        if "Reference Guide" not in content and "reference" not in content.lower().split("##")[-1] if "##" in content else "":
            warnings.append("Has references/ but no routing table in SKILL.md")

    return errors, warnings


def main():
    check_mode = "--check" in sys.argv
    single_skill = None

    for i, arg in enumerate(sys.argv):
        if arg == "--skill" and i + 1 < len(sys.argv):
            single_skill = sys.argv[i + 1]

    skills_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "skills")

    if not os.path.isdir(skills_dir):
        print(f"ERROR: skills directory not found: {skills_dir}")
        sys.exit(1)

    total_errors = 0
    total_warnings = 0
    total_skills = 0

    skills = [single_skill] if single_skill else sorted(os.listdir(skills_dir))

    for skill_name in skills:
        skill_path = os.path.join(skills_dir, skill_name)
        if not os.path.isdir(skill_path):
            continue

        total_skills += 1
        errors, warnings = validate_skill(skill_path, skill_name)

        if errors or warnings:
            print(f"\n{skill_name}:")
            for e in errors:
                print(f"  ERROR: {e}")
                total_errors += 1
            for w in warnings:
                print(f"  WARN:  {w}")
                total_warnings += 1
        else:
            if not check_mode:
                print(f"  OK: {skill_name}")

    print(f"\n{'='*50}")
    print(f"Skills: {total_skills} | Errors: {total_errors} | Warnings: {total_warnings}")

    if check_mode and total_errors > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
