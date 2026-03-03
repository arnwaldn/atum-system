#!/usr/bin/env python3
"""
ATUM Shared Memory — Seed Hindsight with existing data.

Reads all ATUM data store JSONs + skill references and retains them
into the 'atum' shared memory bank. Creates 5 Mental Models.

Usage:
    export HINDSIGHT_URL="https://your-server.example.com"
    export HINDSIGHT_API_KEY="your-auth-token"
    python seed-hindsight.py

Requires: requests (pip install requests)
"""

import json
import os
import sys
import time
from pathlib import Path

try:
    import requests
except ImportError:
    print("ERROR: requests not installed. Run: pip install requests")
    sys.exit(1)

# =============================================================================
# Configuration
# =============================================================================
HINDSIGHT_URL = os.environ.get("HINDSIGHT_URL", "").rstrip("/")
HINDSIGHT_API_KEY = os.environ.get("HINDSIGHT_API_KEY", "")
BANK_ID = "atum"

if not HINDSIGHT_URL:
    print("ERROR: Set HINDSIGHT_URL environment variable")
    sys.exit(1)
if not HINDSIGHT_API_KEY:
    print("ERROR: Set HINDSIGHT_API_KEY environment variable")
    sys.exit(1)

HEADERS = {
    "Authorization": f"Bearer {HINDSIGHT_API_KEY}",
    "Content-Type": "application/json",
}

# Paths
HOME = Path.home()
DATA_DIR = HOME / ".claude" / "data" / "agence-atum"
REFS_DIR = HOME / ".claude" / "skills" / "agence-atum" / "references"

# =============================================================================
# Helpers
# =============================================================================
def retain(content: str, document_id: str = "", context: str = "") -> bool:
    """Retain a piece of content into the shared bank via /memories endpoint."""
    item = {"content": content}
    if document_id:
        item["document_id"] = document_id
    if context:
        item["context"] = context
    payload = {"items": [item]}

    try:
        resp = requests.post(
            f"{HINDSIGHT_URL}/v1/default/banks/{BANK_ID}/memories",
            headers=HEADERS,
            json=payload,
            timeout=120,
        )
        if resp.status_code in (200, 201, 202):
            return True
        print(f"  WARN: retain returned {resp.status_code}: {resp.text[:200]}")
        return False
    except requests.RequestException as e:
        print(f"  ERROR: {e}")
        return False


def create_mental_model(name: str, source_query: str, tags: list | None = None) -> bool:
    """Create an auto-refreshing mental model."""
    payload = {
        "name": name,
        "source_query": source_query,
    }
    if tags:
        payload["tags"] = tags

    try:
        resp = requests.post(
            f"{HINDSIGHT_URL}/v1/default/banks/{BANK_ID}/mental-models",
            headers=HEADERS,
            json=payload,
            timeout=60,
        )
        if resp.status_code in (200, 201):
            return True
        print(f"  WARN: mental model '{name}' returned {resp.status_code}: {resp.text[:200]}")
        return False
    except requests.RequestException as e:
        print(f"  ERROR: {e}")
        return False


# =============================================================================
# Phase 1: Seed JSON data store
# =============================================================================
def seed_json_files():
    """Retain all ATUM data store JSON files."""
    print("\n=== Phase 1: Seeding JSON data store ===\n")

    json_files = {
        "societe.json": ("Identite et structure juridique d'ATUM SAS", ["societe", "legal"]),
        "actionnariat.json": ("Registre des actionnaires ATUM SAS", ["actionnariat", "governance"]),
        "produits.json": ("Catalogue produits, roadmap et strategie commerciale ATUM", ["produits", "strategie"]),
        "obligations.json": ("Calendrier des obligations legales ATUM SAS", ["obligations", "legal"]),
        "equipe.json": ("Registre du personnel ATUM SAS", ["equipe", "rh"]),
        "participations.json": ("Participations work-for-equity ATUM", ["equity", "participations"]),
        "assurances.json": ("Contrats d'assurance ATUM SAS", ["assurances", "compliance"]),
        "odoo-infrastructure.json": ("Infrastructure Odoo SH ATUM", ["odoo", "infrastructure"]),
    }

    # Subdirectory JSON files
    subdir_files = {
        "finances/budget-2026.json": ("Budget previsionnel ATUM SAS 2026", ["finances", "budget"]),
        "finances/quarter-2026-Q1.json": ("Rapport financier Q1 2026 ATUM", ["finances", "trimestre"]),
        "contrats/registre.json": ("Registre des contrats ATUM SAS", ["contrats", "legal"]),
        "contrats/cgv.json": ("Conditions Generales de Vente ATUM SAS", ["contrats", "cgv"]),
        "facturation/compteurs.json": ("Compteurs de facturation ATUM", ["facturation"]),
        "rgpd/registre-traitements.json": ("Registre des traitements RGPD ATUM", ["rgpd", "compliance"]),
        "projets/pipeline.json": ("Pipeline commercial ATUM SAS", ["pipeline", "clients"]),
        "decisions/registre.json": ("Registre des decisions de gouvernance ATUM", ["governance", "decisions"]),
    }

    all_files = {**json_files, **subdir_files}
    ok_count = 0
    fail_count = 0

    for filename, (description, tags) in all_files.items():
        filepath = DATA_DIR / filename
        if not filepath.exists():
            print(f"  SKIP: {filename} (not found)")
            continue

        try:
            with open(filepath, "r", encoding="utf-8") as f:
                data = json.load(f)

            content = f"{description}\n\nSource: {filename}\nDate: {data.get('updated_at', 'unknown')}\n\n{json.dumps(data, indent=2, ensure_ascii=False)}"
            doc_id = f"atum-data-{filename.replace('/', '-').replace('.json', '')}"

            if retain(content, document_id=doc_id, context=tags[0] if tags else "atum"):
                print(f"  OK: {filename}")
                ok_count += 1
            else:
                fail_count += 1

            # Rate limit: Groq free tier = 30 req/min
            time.sleep(3)

        except (json.JSONDecodeError, OSError) as e:
            print(f"  ERROR: {filename} — {e}")
            fail_count += 1

    print(f"\n  Result: {ok_count} OK, {fail_count} FAIL out of {ok_count + fail_count}")
    return ok_count


# =============================================================================
# Phase 2: Seed skill references
# =============================================================================
def seed_references():
    """Retain skill reference markdown files."""
    print("\n=== Phase 2: Seeding skill references ===\n")

    ref_files = {
        "statuts-resume.md": ("Resume des statuts ATUM SAS — structure, gouvernance, quorum, majorites", ["legal", "statuts"]),
        "business-plan-targets.md": ("Objectifs Business Plan V2 ATUM — 3 moteurs, chiffres cles, roadmap", ["strategie", "business-plan"]),
        "facturation-regles.md": ("Regles de facturation ATUM — TJM, acomptes, relances, numerotation", ["facturation", "regles"]),
        "syntec-grille.md": ("Grille Syntec applicable — coefficients, TJM reference", ["syntec", "rh"]),
        "rgpd-guide.md": ("Guide RGPD ATUM — traitements, bases legales, droits", ["rgpd", "compliance"]),
        "templates-catalog.md": ("Catalogue des templates de documents ATUM", ["templates", "documents"]),
    }

    ok_count = 0
    for filename, (description, tags) in ref_files.items():
        filepath = REFS_DIR / filename
        if not filepath.exists():
            print(f"  SKIP: {filename} (not found)")
            continue

        try:
            content = filepath.read_text(encoding="utf-8")
            full_content = f"{description}\n\nSource: skills/agence-atum/references/{filename}\n\n{content}"
            doc_id = f"atum-ref-{filename.replace('.md', '')}"

            if retain(full_content, document_id=doc_id, context=tags[0] if tags else "reference"):
                print(f"  OK: {filename}")
                ok_count += 1

            time.sleep(3)

        except OSError as e:
            print(f"  ERROR: {filename} — {e}")

    print(f"\n  Result: {ok_count} OK")
    return ok_count


# =============================================================================
# Phase 3: Create Mental Models
# =============================================================================
def create_mental_models():
    """Create auto-refreshing mental models for key business domains."""
    print("\n=== Phase 3: Creating Mental Models ===\n")

    models = [
        (
            "statut-agence",
            "Quel est l'etat actuel d'ATUM SAS ? Sante financiere, projets actifs, allocation equipe, priorites immediates, decisions recentes.",
            ["dashboard"],
        ),
        (
            "portefeuille-produits",
            "Quels sont tous les produits ATUM (GigRoute, TradingBrain, Quick Summarize, OWL, sites satellites), leur statut de developpement, metriques, et roadmap ?",
            ["produits"],
        ),
        (
            "relations-clients",
            "Quels sont les clients et prospects actuels d'ATUM ? Statut de chaque relation, livrables en cours, satisfaction, prochaines actions.",
            ["clients"],
        ),
        (
            "sante-financiere",
            "Quelles sont les finances actuelles d'ATUM SAS ? MRR, ARR, budget vs reel, tresorerie, previsions par moteur (Services, SaaS, Satellites).",
            ["finances"],
        ),
        (
            "conformite",
            "Quel est le statut de conformite ATUM ? RGPD (traitements, bases legales), Syntec, assurances (RC Pro), obligations legales a venir, echeances.",
            ["compliance"],
        ),
    ]

    ok_count = 0
    for name, query, tags in models:
        if create_mental_model(name, query, tags):
            print(f"  OK: Mental Model '{name}'")
            ok_count += 1
        time.sleep(2)

    print(f"\n  Result: {ok_count}/5 Mental Models created")
    return ok_count


# =============================================================================
# Phase 4: Verification
# =============================================================================
def verify():
    """Run basic verification queries."""
    print("\n=== Phase 4: Verification ===\n")

    test_queries = [
        "Qui est le president d'ATUM SAS ?",
        "Quels produits ATUM sont en production ?",
        "Quel est le capital social d'ATUM ?",
    ]

    for query in test_queries:
        try:
            resp = requests.post(
                f"{HINDSIGHT_URL}/v1/default/banks/{BANK_ID}/memories/recall",
                headers=HEADERS,
                json={"query": query},
                timeout=30,
            )
            if resp.status_code == 200:
                data = resp.json()
                results = data.get("results", [])
                print(f"  Q: {query}")
                print(f"  A: {len(results)} memories found")
                if results:
                    first = results[0]
                    snippet = first.get("text", "")[:150]
                    print(f"     -> {snippet}...")
                print()
            else:
                print(f"  Q: {query}")
                print(f"  A: HTTP {resp.status_code}")
                print()
        except requests.RequestException as e:
            print(f"  ERROR: {e}")

        time.sleep(2)


# =============================================================================
# Main
# =============================================================================
def main():
    print("=" * 60)
    print("  ATUM Hindsight — Data Migration")
    print(f"  Server: {HINDSIGHT_URL}")
    print(f"  Bank:   {BANK_ID}")
    print("=" * 60)

    # Check connectivity
    try:
        resp = requests.get(f"{HINDSIGHT_URL}/health", headers=HEADERS, timeout=10)
        if resp.status_code != 200:
            print(f"ERROR: Server returned {resp.status_code}")
            sys.exit(1)
        print(f"\n  Server healthy: {resp.status_code}")
    except requests.RequestException as e:
        print(f"ERROR: Cannot reach server: {e}")
        sys.exit(1)

    # Run phases
    json_count = seed_json_files()
    ref_count = seed_references()
    model_count = create_mental_models()
    verify()

    # Summary
    print("=" * 60)
    print(f"  DONE — {json_count} JSONs + {ref_count} refs seeded, {model_count} Mental Models")
    print("=" * 60)


if __name__ == "__main__":
    main()
