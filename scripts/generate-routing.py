#!/usr/bin/env python3
"""
generate-routing.py — Agent routing table generator for ATUM claude-code-config.

Reads agents/registry.json (or falls back to scanning agents/*.md frontmatter) and:
  - Outputs a markdown routing table ready to paste into autonomous-routing/SKILL.md
  - In --check mode: cross-validates registry.json against actual agent .md files

Usage:
  python scripts/engines/generate-routing.py
  python scripts/engines/generate-routing.py --check
  python scripts/engines/generate-routing.py --output path/to/output.md
  python scripts/engines/generate-routing.py --registry path/to/registry.json
"""

import argparse
import json
import os
import re
import sys
from pathlib import Path


# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent
AGENTS_DIR = REPO_ROOT / "agents"
DEFAULT_REGISTRY = AGENTS_DIR / "registry.json"
SKILL_MD = REPO_ROOT / "skills" / "autonomous-routing" / "SKILL.md"


# ---------------------------------------------------------------------------
# Frontmatter parser
# ---------------------------------------------------------------------------

def parse_frontmatter(md_path: Path) -> dict:
    """Extract YAML-style frontmatter from a markdown file.

    Returns a dict with at minimum: name, description, model, tools, mcpServers.
    Falls back to sensible defaults when fields are absent.
    """
    content = md_path.read_text(encoding="utf-8", errors="replace")
    if not content.startswith("---"):
        return {"name": md_path.stem, "description": "", "model": "sonnet", "tools": [], "mcpServers": []}

    end = content.find("---", 3)
    if end == -1:
        return {"name": md_path.stem, "description": "", "model": "sonnet", "tools": [], "mcpServers": []}

    frontmatter_block = content[3:end].strip()
    result: dict = {"name": md_path.stem, "description": "", "model": "sonnet", "tools": [], "mcpServers": []}

    for line in frontmatter_block.splitlines():
        if ":" not in line:
            continue
        key, _, raw_value = line.partition(":")
        key = key.strip()
        raw_value = raw_value.strip()

        # Strip surrounding quotes (single or double)
        if (raw_value.startswith('"') and raw_value.endswith('"')) or \
           (raw_value.startswith("'") and raw_value.endswith("'")):
            raw_value = raw_value[1:-1]

        if key == "name":
            result["name"] = raw_value
        elif key == "description":
            # Descriptions can be multi-line JSON strings — keep first line only
            # Remove escaped newlines for display
            clean = raw_value.replace("\\n", " ").replace('\\"', '"')
            # Truncate to a readable length for table display
            result["description"] = clean[:120].rstrip()
        elif key == "model":
            result["model"] = raw_value
        elif key == "tools":
            # "Read, Write, Edit, Bash" or "[Read, Write]"
            cleaned = raw_value.strip("[]")
            result["tools"] = [t.strip() for t in cleaned.split(",") if t.strip()]
        elif key == "mcpServers":
            cleaned = raw_value.strip("[]")
            if cleaned:
                result["mcpServers"] = [s.strip() for s in cleaned.split(",") if s.strip()]
            else:
                result["mcpServers"] = []

    return result


# ---------------------------------------------------------------------------
# Registry loader
# ---------------------------------------------------------------------------

def load_registry(registry_path: Path) -> list[dict] | None:
    """Load agents from registry.json. Returns None if file does not exist."""
    if not registry_path.exists():
        return None
    try:
        data = json.loads(registry_path.read_text(encoding="utf-8"))
        # Accept both {"agents": [...]} and a bare list
        if isinstance(data, list):
            return data
        if isinstance(data, dict) and "agents" in data:
            return data["agents"]
        return None
    except (json.JSONDecodeError, KeyError):
        return None


def scan_agents_dir(agents_dir: Path) -> list[dict]:
    """Fallback: scan agents/*.md and parse frontmatter directly."""
    agents = []
    for md_file in sorted(agents_dir.glob("*.md")):
        fm = parse_frontmatter(md_file)
        agents.append(fm)
    return agents


# ---------------------------------------------------------------------------
# Markdown table renderer
# ---------------------------------------------------------------------------

# Column order and display widths
COL_DEFS = [
    ("Agent",        "name",        28),
    ("Model",        "model",       8),
    ("MCPs",         "mcpServers",  32),
    ("Description",  "description", 60),
]


def _cell(value: str, width: int) -> str:
    if len(value) > width:
        value = value[: width - 1] + "…"
    return value.ljust(width)


def render_table(agents: list[dict]) -> str:
    header_parts = [_cell(col_label, width) for col_label, _, width in COL_DEFS]
    sep_parts = ["-" * width for _, _, width in COL_DEFS]

    lines = [
        "| " + " | ".join(header_parts) + " |",
        "| " + " | ".join(sep_parts) + " |",
    ]

    for agent in sorted(agents, key=lambda a: a.get("name", "")):
        row_parts = []
        for col_label, field, width in COL_DEFS:
            raw = agent.get(field, "")
            if isinstance(raw, list):
                raw = ", ".join(raw) if raw else "—"
            if not raw:
                raw = "—"
            row_parts.append(_cell(str(raw), width))
        lines.append("| " + " | ".join(row_parts) + " |")

    return "\n".join(lines)


def render_markdown(agents: list[dict], source_label: str) -> str:
    """Build the full markdown section to paste into autonomous-routing/SKILL.md."""
    table = render_table(agents)
    count = len(agents)

    lines = [
        "## Agent Registry",
        "",
        f"<!-- Auto-generated by scripts/engines/generate-routing.py — source: {source_label} -->",
        f"<!-- {count} agents registered -->",
        "",
        table,
        "",
        "### Model Legend",
        "",
        "| Model   | Use case                                  |",
        "| ------- | ----------------------------------------- |",
        "| haiku   | Lightweight, high-frequency tasks         |",
        "| sonnet  | Standard development work (default)       |",
        "| opus    | Complex architecture, deep reasoning      |",
        "",
        "### MCP Legend",
        "",
        "| MCP            | Purpose                                   |",
        "| -------------- | ----------------------------------------- |",
        "| context7       | Library docs lookup                       |",
        "| github         | Repository operations                     |",
        "| figma          | Design file access                        |",
        "| supabase       | Supabase database operations              |",
        "| atum-audit     | File integrity + EU AI Act compliance     |",
        "| notion         | Notion workspace                          |",
        "| google-workspace | Gmail, Calendar, Drive, Docs             |",
        "| make           | Make.com automation                       |",
        "| airtable       | Airtable bases                            |",
    ]
    return "\n".join(lines) + "\n"


# ---------------------------------------------------------------------------
# Check mode
# ---------------------------------------------------------------------------

def run_check(registry_path: Path, agents_dir: Path) -> int:
    """Cross-validate registry.json against agents/*.md files.

    Exit code 0 = clean, 1 = discrepancies found.
    """
    md_files = {f.stem for f in agents_dir.glob("*.md")}
    registry_data = load_registry(registry_path)

    if registry_data is None:
        print(f"[CHECK] registry.json not found at: {registry_path}")
        print("[CHECK] Scanning agents/ directory to enumerate known agents...")
        print(f"[CHECK] Found {len(md_files)} .md files in agents/:")
        for name in sorted(md_files):
            print(f"         agents/{name}.md")
        print()
        print("[CHECK] ACTION REQUIRED: Create agents/registry.json to enable full validation.")
        print("         Run without --check to auto-generate a registry from frontmatter.")
        return 1

    registry_names = {entry.get("name", "") for entry in registry_data}

    in_registry_not_on_disk = registry_names - md_files
    on_disk_not_in_registry = md_files - registry_names

    ok = True

    if in_registry_not_on_disk:
        ok = False
        print("[CHECK] FAIL — In registry.json but NO matching .md file in agents/:")
        for name in sorted(in_registry_not_on_disk):
            print(f"         MISSING FILE  agents/{name}.md")

    if on_disk_not_in_registry:
        ok = False
        print("[CHECK] FAIL — .md files in agents/ with NO entry in registry.json:")
        for name in sorted(on_disk_not_in_registry):
            print(f"         MISSING ENTRY  {name}  (agents/{name}.md)")

    # Validate required fields in each registry entry
    # Note: 'description' lives in the agent .md frontmatter, not duplicated in registry
    field_errors = []
    field_warnings = []
    for entry in registry_data:
        name = entry.get("name", "<unnamed>")
        for required_field in ("name", "model"):
            if not entry.get(required_field):
                field_errors.append(f"  {name}: missing or empty field '{required_field}'")
        if not entry.get("domain"):
            field_warnings.append(f"  {name}: missing optional field 'domain'")

    if field_errors:
        ok = False
        print("[CHECK] FAIL — Registry entries with missing required fields:")
        for err in field_errors:
            print(err)

    if field_warnings:
        print("[CHECK] WARN — Registry entries with missing optional fields:")
        for w in field_warnings:
            print(w)

    if ok:
        print(f"[CHECK] PASS — {len(registry_names)} registry entries match {len(md_files)} .md files. No discrepancies.")
    else:
        print()
        print(f"[CHECK] SUMMARY: {len(in_registry_not_on_disk)} missing files, "
              f"{len(on_disk_not_in_registry)} unregistered agents, "
              f"{len(field_errors)} field errors.")

    return 0 if ok else 1


# ---------------------------------------------------------------------------
# Registry builder (from frontmatter scan)
# ---------------------------------------------------------------------------

def build_registry_from_disk(agents_dir: Path) -> tuple[list[dict], Path]:
    """Scan agents/*.md, parse frontmatter, return (agents_list, source_path)."""
    agents = scan_agents_dir(agents_dir)
    return agents, agents_dir


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> int:
    parser = argparse.ArgumentParser(
        description="Generate agent routing table from agents/registry.json or agents/*.md frontmatter.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Validate registry.json against agents/ directory without generating output.",
    )
    parser.add_argument(
        "--output",
        metavar="PATH",
        help="Write generated markdown to this file (default: print to stdout).",
    )
    parser.add_argument(
        "--registry",
        metavar="PATH",
        default=str(DEFAULT_REGISTRY),
        help=f"Path to registry.json (default: {DEFAULT_REGISTRY}).",
    )
    parser.add_argument(
        "--agents-dir",
        metavar="PATH",
        default=str(AGENTS_DIR),
        help=f"Path to agents/ directory (default: {AGENTS_DIR}).",
    )

    args = parser.parse_args()

    registry_path = Path(args.registry)
    agents_dir = Path(args.agents_dir)

    if not agents_dir.is_dir():
        print(f"ERROR: agents directory not found: {agents_dir}", file=sys.stderr)
        return 1

    # --check mode
    if args.check:
        return run_check(registry_path, agents_dir)

    # Generation mode
    registry_data = load_registry(registry_path)

    if registry_data is not None:
        agents = registry_data
        source_label = str(registry_path)
        print(f"[INFO] Loaded {len(agents)} agents from registry.json", file=sys.stderr)
    else:
        print(f"[INFO] registry.json not found at {registry_path} — scanning agents/ frontmatter", file=sys.stderr)
        agents, _ = build_registry_from_disk(agents_dir)
        source_label = f"agents/*.md frontmatter scan ({len(agents)} files)"
        print(f"[INFO] Parsed {len(agents)} agent files from {agents_dir}", file=sys.stderr)

    if not agents:
        print("ERROR: No agents found. Check agents/ directory.", file=sys.stderr)
        return 1

    markdown = render_markdown(agents, source_label)

    if args.output:
        output_path = Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(markdown, encoding="utf-8")
        print(f"[INFO] Routing table written to: {output_path}", file=sys.stderr)
    else:
        print(markdown)

    return 0


if __name__ == "__main__":
    sys.exit(main())
