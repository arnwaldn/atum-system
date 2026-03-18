#!/usr/bin/env python3
"""Standardize SKILL.md frontmatter to Jeffallan-compatible format.

Adds missing fields: metadata.version, metadata.domain, metadata.triggers,
metadata.related-skills. Does NOT overwrite existing fields.
"""

import os
import re
import sys

# Domain and metadata mapping for each skill
SKILL_META = {
    "agence-atum": {
        "domain": "business",
        "version": "1.0.0",
        "role": "specialist",
        "scope": "implementation",
        "output-format": "document",
        "related-skills": "memoire, compliance-routing, scheduler",
    },
    "agent-browser": {
        "domain": "tooling",
        "version": "1.0.0",
        "triggers": "browser automation, test in browser, puppeteer, playwright, headless, agent-browser, browser test",
        "role": "specialist",
        "scope": "implementation",
        "output-format": "code",
        "related-skills": "terminal-emulator",
    },
    "audit-flow": {
        "domain": "quality",
        "version": "1.0.0",
        "triggers": "audit flow, system tracing, flow tracing, architecture audit, data flow, security boundaries, component interactions",
        "role": "specialist",
        "scope": "analysis",
        "output-format": "report",
        "related-skills": "spec-miner, design-doc-mermaid",
    },
    "autonomous-routing": {
        "domain": "workflow",
        "version": "1.0.0",
        "triggers": "routing, auto-detect, trigger mapping, skill selection, agent routing",
        "role": "specialist",
        "scope": "infrastructure",
        "output-format": "code",
        "related-skills": "compliance-routing, scheduler",
    },
    "chaos-engineer": {
        # Already complete (Jeffallan format)
    },
    "claude-a11y-skill": {
        "domain": "frontend",
        "role": "specialist",
        "scope": "review",
        "output-format": "code",
        "related-skills": "refactoring-ui, high-perf-browser",
    },
    "claude-d3js-skill": {
        "domain": "frontend",
        "version": "1.0.0",
        "triggers": "d3.js, data visualization, chart, graph, SVG, interactive visualization, network diagram, geographic visualization",
        "role": "specialist",
        "scope": "implementation",
        "output-format": "code",
        "related-skills": "refactoring-ui",
    },
    "clean-architecture": {
        "domain": "architecture",
        "triggers": "clean architecture, dependency rule, ports and adapters, hexagonal architecture, use case boundary, SOLID, onion architecture",
        "role": "architect",
        "scope": "architecture",
        "output-format": "architecture",
        "related-skills": "domain-driven-design, system-design",
    },
    "common-ground": {
        "domain": "workflow",
        "version": "1.0.0",
        "triggers": "hypotheses, assumptions, common ground, tu pars du principe que, validate assumptions, onboarding, starting project",
        "role": "specialist",
        "scope": "analysis",
        "output-format": "report",
        "related-skills": "prompt-architect, spec-miner",
    },
    "compliance-routing": {
        "domain": "compliance",
        "version": "1.0.0",
        "triggers": "RGPD, GDPR, PCI-DSS, HIPAA, cookies, privacy, user data, authentication, payments, e-commerce, health data, AI compliance",
        "role": "specialist",
        "scope": "review",
        "output-format": "report",
        "related-skills": "open-source-license-compliance, supply-chain-risk-auditor",
    },
    "context-engineering-kit": {
        "domain": "tooling",
        "version": "1.0.0",
        "triggers": "context window, context degradation, sub-agent, context handoff, MAKER pattern, context rot, fresh context",
        "role": "specialist",
        "scope": "infrastructure",
        "output-format": "code",
        "related-skills": "fresh-execute",
    },
    "ddia-systems": {
        "domain": "architecture",
        "triggers": "data systems, replication, partitioning, consistency, availability, stream processing, storage engines, distributed consensus, database choice",
        "role": "architect",
        "scope": "system-design",
        "output-format": "architecture",
        "related-skills": "system-design, clean-architecture",
    },
    "design-doc-mermaid": {
        "domain": "tooling",
        "triggers": "mermaid, diagram, architecture diagram, sequence diagram, activity diagram, deployment diagram, code to diagram, design doc",
        "role": "specialist",
        "scope": "design",
        "output-format": "document",
        "related-skills": "system-design, audit-flow",
    },
    "docx": {
        "domain": "document",
        "triggers": "word document, .docx, word doc, tables of contents, headings, page numbers, letterhead, tracked changes",
        "role": "specialist",
        "scope": "implementation",
        "output-format": "document",
        "related-skills": "pdf, pptx, xlsx",
    },
    "domain-driven-design": {
        "domain": "architecture",
        "triggers": "domain modeling, bounded context, aggregate root, ubiquitous language, anti-corruption layer, entities, value objects, domain events",
        "role": "architect",
        "scope": "architecture",
        "output-format": "architecture",
        "related-skills": "clean-architecture, system-design",
    },
    "fresh-execute": {
        "domain": "workflow",
        "version": "1.0.0",
        "triggers": "fresh context, decompose feature, sub-tasks, context degradation, long session, atomic tasks, fresh execute",
        "role": "specialist",
        "scope": "implementation",
        "output-format": "code",
        "related-skills": "context-engineering-kit",
    },
    "high-perf-browser": {
        "domain": "frontend",
        "triggers": "page load speed, Core Web Vitals, HTTP/2, resource hints, network latency, render blocking, web performance, caching, TCP optimization",
        "role": "specialist",
        "scope": "optimization",
        "output-format": "code",
        "related-skills": "refactoring-ui, claude-a11y-skill",
    },
    "image-guard-rules": {
        "domain": "tooling",
        "version": "1.0.0",
        "triggers": "image dimensions, screenshot resize, image too large, 2000px limit, image processing, workflow blocking",
        "role": "specialist",
        "scope": "infrastructure",
        "output-format": "code",
        "related-skills": "agent-browser",
    },
    "jobs-to-be-done": {
        "domain": "specialized",
        "triggers": "customer discovery, why customers churn, what job does this solve, competing against luck, product-market fit, JTBD, customer needs",
        "role": "specialist",
        "scope": "analysis",
        "output-format": "report",
        "related-skills": "mom-test, prompt-architect",
    },
    "mcp-builder": {
        "domain": "tooling",
        "role": "specialist",
        "scope": "implementation",
        "output-format": "code",
        "related-skills": "context-engineering-kit",
    },
    "memoire": {
        "domain": "business",
        "version": "1.0.0",
        "triggers": "memoire collective, souviens-toi, retiens que, note pour equipe, remember, save for team, decision equipe, collective memory",
        "role": "specialist",
        "scope": "implementation",
        "output-format": "document",
        "related-skills": "agence-atum",
    },
    "mom-test": {
        "domain": "specialized",
        "triggers": "customer interviews, validate my idea, leading questions, Mom Test, customer conversations, user research, idea validation",
        "role": "specialist",
        "scope": "analysis",
        "output-format": "report",
        "related-skills": "jobs-to-be-done, prompt-architect",
    },
    "monorepo": {
        "domain": "devops",
        "version": "1.0.0",
        "triggers": "monorepo, turborepo, nx, pnpm workspaces, workspace, multi-package, turbo.json",
        "role": "specialist",
        "scope": "infrastructure",
        "output-format": "code",
        "related-skills": "scheduler",
    },
    "no-code-maestro": {
        "domain": "no-code",
        "version": "1.0.0",
        "triggers": "no-code, make.com, airtable, notion, automation, scenario, blueprint, webhook, workflow automatise, maestro, integromat",
        "role": "specialist",
        "scope": "implementation",
        "output-format": "code",
        "related-skills": "scheduler",
    },
    "open-source-license-compliance": {
        "domain": "compliance",
        "triggers": "license compliance, open-source licensing, copyleft, GPL, AGPL, SPDX, dependency licenses, license audit",
        "role": "specialist",
        "scope": "review",
        "output-format": "report",
        "related-skills": "supply-chain-risk-auditor, compliance-routing",
    },
    "pdf": {
        "domain": "document",
        "triggers": "PDF, .pdf, extract text, merge PDF, split PDF, watermark, fill form, OCR, encrypt PDF, decrypt PDF",
        "role": "specialist",
        "scope": "implementation",
        "output-format": "code",
        "related-skills": "docx, pptx, xlsx",
    },
    "powershell-windows": {
        "domain": "infrastructure",
        "triggers": "PowerShell, Windows, registry, WMI, CIM, Windows services, firewall rules, scheduled tasks, Active Directory",
        "role": "specialist",
        "scope": "implementation",
        "output-format": "code",
        "related-skills": "scheduler",
    },
    "pptx": {
        "domain": "document",
        "triggers": "PowerPoint, presentation, slides, .pptx, slide deck, charts in slides, slide formatting",
        "role": "specialist",
        "scope": "implementation",
        "output-format": "document",
        "related-skills": "docx, pdf, xlsx",
    },
    "project-patterns": {
        "domain": "workflow",
        "version": "1.0.0",
        "triggers": "skeleton project, B12 website, template, repository pattern, API response, project scaffold",
        "role": "specialist",
        "scope": "implementation",
        "output-format": "code",
        "related-skills": "system-design, clean-architecture",
    },
    "prompt-architect": {
        "domain": "workflow",
        "version": "1.0.0",
        "triggers": "prompt engineering, CO-STAR, RISEN, prompt framework, improve prompt, chain of thought, prompt optimization",
        "role": "specialist",
        "scope": "analysis",
        "output-format": "document",
        "related-skills": "common-ground",
    },
    "property-based-testing": {
        "domain": "quality",
        "version": "1.0.0",
        "triggers": "property-based testing, hypothesis, QuickCheck, fuzzing, serialization roundtrip, invariant testing, generative testing",
        "role": "specialist",
        "scope": "testing",
        "output-format": "code",
        "related-skills": "audit-flow",
    },
    "rag-architect": {
        # Already complete (Jeffallan format)
    },
    "refactoring-ui": {
        "domain": "frontend",
        "triggers": "UI looks off, fix the design, Tailwind styling, color palette, visual hierarchy, spacing, shadows, grayscale-first",
        "role": "specialist",
        "scope": "review",
        "output-format": "code",
        "related-skills": "claude-a11y-skill, high-perf-browser",
    },
    "release-notes": {
        "domain": "workflow",
        "version": "1.0.0",
        "triggers": "release notes, changelog, summarize changes, version release, what changed",
        "role": "specialist",
        "scope": "implementation",
        "output-format": "document",
        "related-skills": "project-patterns",
    },
    "resilience": {
        "domain": "devops",
        "version": "1.0.0",
        "triggers": "resilience, circuit breaker, retry, timeout, fallback, rate limiting, bulkhead, external services, API calls",
        "role": "specialist",
        "scope": "implementation",
        "output-format": "code",
        "related-skills": "sre-engineer, chaos-engineer",
    },
    "scheduler": {
        # Already has full metadata
    },
    "spec-miner": {
        # Already complete (Jeffallan format)
    },
    "sre-engineer": {
        # Already complete (Jeffallan format)
    },
    "supply-chain-risk-auditor": {
        "domain": "security",
        "version": "1.0.0",
        "triggers": "supply chain, dependency risk, takeover, typosquatting, dependency health, package audit, npm audit",
        "role": "specialist",
        "scope": "review",
        "output-format": "report",
        "related-skills": "open-source-license-compliance, compliance-routing",
    },
    "system-design": {
        "domain": "architecture",
        "triggers": "system design, scale this, high availability, rate limiter, load balancing, caching, message queues, distributed systems",
        "role": "architect",
        "scope": "system-design",
        "output-format": "architecture",
        "related-skills": "clean-architecture, ddia-systems, domain-driven-design",
    },
    "terminal-emulator": {
        "domain": "tooling",
        "version": "1.0.0",
        "triggers": "test CLI, test TUI, interactive terminal, simulate input, tui-test, terminal automation, PTY",
        "role": "specialist",
        "scope": "testing",
        "output-format": "code",
        "related-skills": "agent-browser",
    },
    "the-fool": {
        # Already complete (Jeffallan format)
    },
    "whatsapp": {
        "domain": "business",
        "version": "1.0.0",
        "triggers": "WhatsApp, check WhatsApp, respond WhatsApp, Cloclo, verifie WhatsApp, messages WhatsApp",
        "role": "specialist",
        "scope": "implementation",
        "output-format": "code",
        "related-skills": "memoire, agence-atum",
    },
    "xlsx": {
        "domain": "document",
        "triggers": "spreadsheet, .xlsx, .csv, Excel, tabular data, pivot table, formula, workbook",
        "role": "specialist",
        "scope": "implementation",
        "output-format": "code",
        "related-skills": "docx, pdf, pptx",
    },
}


def parse_frontmatter(content):
    """Extract frontmatter and body from a SKILL.md file."""
    if not content.startswith("---"):
        return None, content

    end = content.find("---", 3)
    if end == -1:
        return None, content

    fm_text = content[3:end].strip()
    body = content[end + 3:]
    return fm_text, body


def has_field(fm_text, field):
    """Check if a field exists in frontmatter text."""
    # Check top-level field
    if re.search(rf"^{re.escape(field)}:", fm_text, re.MULTILINE):
        return True
    # Check in metadata block
    if re.search(rf"^\s+{re.escape(field)}:", fm_text, re.MULTILINE):
        return True
    return False


def add_metadata_fields(fm_text, meta):
    """Add missing metadata fields to frontmatter."""
    if not meta:
        return fm_text

    # Check if metadata block exists
    has_metadata = has_field(fm_text, "metadata")

    lines_to_add = []
    for key, value in meta.items():
        if not has_field(fm_text, key):
            lines_to_add.append((key, value))

    if not lines_to_add:
        return fm_text

    # Build the additions
    metadata_additions = []
    top_level_additions = []

    for key, value in lines_to_add:
        if key in ("domain", "triggers", "role", "scope", "output-format", "related-skills"):
            metadata_additions.append(f"  {key}: {value}")
        elif key == "version":
            top_level_additions.append(f'version: "{value}"')
        else:
            top_level_additions.append(f"{key}: {value}")

    result = fm_text

    # Add top-level fields after description
    if top_level_additions:
        # Find the end of description (may be multiline)
        desc_match = re.search(r"^description:.*?(?=\n[a-z]|\nmetadata:|\n---|\Z)", result, re.MULTILINE | re.DOTALL)
        if desc_match:
            insert_pos = desc_match.end()
            result = result[:insert_pos] + "\n" + "\n".join(top_level_additions) + result[insert_pos:]

    # Add metadata fields
    if metadata_additions:
        if has_metadata:
            # Find end of existing metadata block
            meta_match = re.search(r"^metadata:\n((\s+\S.*\n)*)", result, re.MULTILINE)
            if meta_match:
                insert_pos = meta_match.end()
                result = result[:insert_pos] + "\n".join(metadata_additions) + "\n" + result[insert_pos:]
        else:
            # Add new metadata block at the end
            result = result.rstrip() + "\nmetadata:\n" + "\n".join(metadata_additions)

    return result


def process_skill(skill_dir, skill_name, dry_run=False):
    """Process a single skill directory."""
    skill_path = os.path.join(skill_dir, "SKILL.md")
    if not os.path.exists(skill_path):
        return f"  SKIP: {skill_name} (no SKILL.md)"

    meta = SKILL_META.get(skill_name, {})
    if not meta:
        return f"  OK: {skill_name} (already complete)"

    with open(skill_path, "r", encoding="utf-8", errors="replace") as f:
        content = f.read()

    fm_text, body = parse_frontmatter(content)
    if fm_text is None:
        return f"  WARN: {skill_name} (no frontmatter)"

    new_fm = add_metadata_fields(fm_text, meta)

    if new_fm == fm_text:
        return f"  OK: {skill_name} (no changes needed)"

    if not dry_run:
        new_content = f"---\n{new_fm}\n---{body}"
        with open(skill_path, "w", encoding="utf-8", newline="\n") as f:
            f.write(new_content)

    return f"  UPDATE: {skill_name}"


def main():
    dry_run = "--dry-run" in sys.argv
    skills_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "skills")

    if not os.path.isdir(skills_dir):
        print(f"ERROR: skills directory not found: {skills_dir}")
        sys.exit(1)

    print(f"{'DRY RUN - ' if dry_run else ''}Standardizing skill frontmatter...")
    print(f"Skills directory: {skills_dir}")
    print()

    updates = 0
    skips = 0
    ok = 0

    for skill_name in sorted(os.listdir(skills_dir)):
        skill_path = os.path.join(skills_dir, skill_name)
        if not os.path.isdir(skill_path):
            continue

        result = process_skill(skill_path, skill_name, dry_run)
        print(result)

        if "UPDATE" in result:
            updates += 1
        elif "SKIP" in result or "WARN" in result:
            skips += 1
        else:
            ok += 1

    print()
    print(f"Results: {updates} updated, {ok} already ok, {skips} skipped")


if __name__ == "__main__":
    main()
