#!/usr/bin/env python3
"""
ATUM Workspace Indexer — Seed Hindsight with ATUM-Agency workspace + projects.

Indexes all text files (md, txt, csv) and PDFs from:
  - ~/Documents/ATUM-Agency/ (agency workspace)
  - ~/Documents/projets/ (active projects)
  - ~/.claude/data/agence-atum/ (Claude data store)
  - ~/.claude/skills/agence-atum/references/ (skill references)

Also creates Mental Models for key business domains.

Usage:
    export HINDSIGHT_URL="https://arnwald84-atum-hindsight.hf.space"
    export HINDSIGHT_API_KEY="your-auth-token"
    python seed-workspace.py [--skip-pdf] [--skip-data] [--only-verify]

Requires: requests, PyPDF2
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

try:
    import PyPDF2
except ImportError:
    PyPDF2 = None
    print("WARNING: PyPDF2 not installed. PDFs will be skipped.")

# =============================================================================
# Configuration
# =============================================================================
HINDSIGHT_URL = os.environ.get("HINDSIGHT_URL", "").rstrip("/")
HINDSIGHT_API_KEY = os.environ.get("HINDSIGHT_API_KEY", "")
BANK_ID = "atum"

SKIP_PDF = "--skip-pdf" in sys.argv
SKIP_DATA = "--skip-data" in sys.argv
ONLY_VERIFY = "--only-verify" in sys.argv

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
ATUM_AGENCY = HOME / "Documents" / "ATUM-Agency"
PROJETS = HOME / "Documents" / "projets"
DATA_DIR = HOME / ".claude" / "data" / "agence-atum"
REFS_DIR = HOME / ".claude" / "skills" / "agence-atum" / "references"

# Token budget: Groq free tier = 200K tokens/day
# llama-3.1-8b-instant: ~2K tokens per extraction
# Budget: ~100 documents per day safely
RATE_LIMIT_SECONDS = 15  # 15s between documents (cpu-basic needs significant breathing room)
MAX_CONTENT_CHARS = 5000  # Truncate to prevent >50 consolidation ops per doc (crash threshold ~50-67)

# Backpressure: prevent consolidation queue from overwhelming cpu-basic
# Each retain triggers ~20-30 consolidation ops (entity extraction via Gemini + graph)
# cpu-basic processes ~8 ops/min, so we must be very conservative
BATCH_SIZE = 1              # Check after EVERY retain (cpu-basic can't handle bursts)
CONSOLIDATION_THRESHOLD = 3   # Max pending consolidations before waiting (very conservative)
BACKPRESSURE_WAIT = 30      # Seconds between backpressure checks
MAX_WAIT_CYCLES = 40        # 40 x 30s = 20min max wait before continuing
INITIAL_WAIT_CYCLES = 40    # 40 x 30s = 20min max wait for initial drain

# =============================================================================
# Stats tracking
# =============================================================================
stats = {"ok": 0, "fail": 0, "skip": 0, "total_tokens_estimate": 0}
_batch_count = 0  # Global retain call counter for backpressure
_server_down = False  # Set True on 503 or crash detection — stops further retains
_last_known_nodes = 0  # Track node count to detect Space restarts
REST_EVERY_N_DOCS = 5  # After every 5 docs, rest to let CPU cool down
REST_DURATION = 300  # 5 minutes of complete inactivity (cpu-basic needs long breaks)


# =============================================================================
# Backpressure
# =============================================================================
def wait_for_initial_drain() -> bool:
    """Wait for the server's consolidation queue to drain before starting seed.

    After a pg_restore, the server may have 200+ pending consolidations.
    Seeding on top of that will crash cpu-basic. Wait until queue is near-zero.
    Returns True if ready, False if timed out (seed will proceed cautiously).
    """
    print("\n  Checking server consolidation queue before seeding...")
    for cycle in range(INITIAL_WAIT_CYCLES):
        try:
            resp = requests.get(
                f"{HINDSIGHT_URL}/v1/default/banks/{BANK_ID}/stats",
                headers=HEADERS,
                timeout=15,
            )
            if resp.status_code != 200:
                print(f"  Stats returned {resp.status_code} — waiting...")
                time.sleep(BACKPRESSURE_WAIT)
                continue

            data = resp.json()
            pending = data.get("pending_consolidation", 0)
            nodes = data.get("total_nodes", 0)

            if pending <= CONSOLIDATION_THRESHOLD:
                print(f"  Queue drained: {pending} pending, {nodes} nodes — ready to seed")
                return True

            print(
                f"  [{cycle+1}/{INITIAL_WAIT_CYCLES}] "
                f"Waiting for drain: {pending} pending, {nodes} nodes... "
                f"(next check in {BACKPRESSURE_WAIT}s)"
            )
            time.sleep(BACKPRESSURE_WAIT)

        except requests.RequestException as e:
            print(f"  Connection error: {e} — retrying in {BACKPRESSURE_WAIT}s...")
            time.sleep(BACKPRESSURE_WAIT)

    print(f"  WARNING: Queue not drained after {INITIAL_WAIT_CYCLES} cycles — proceeding cautiously")
    return False


def wait_for_consolidation() -> None:
    """Backpressure: wait if consolidation queue is too deep.

    Queries /stats for pending_consolidation count. If above CONSOLIDATION_THRESHOLD,
    waits in a loop until the queue drains or MAX_WAIT_CYCLES is reached.
    Detects Space restarts by monitoring node count drops.
    On network errors, proceeds after 3 consecutive failures.
    """
    global _server_down, _last_known_nodes
    consecutive_errors = 0
    for cycle in range(MAX_WAIT_CYCLES):
        try:
            resp = requests.get(
                f"{HINDSIGHT_URL}/v1/default/banks/{BANK_ID}/stats",
                headers=HEADERS,
                timeout=15,
            )
            if resp.status_code != 200:
                return  # Can't check — proceed anyway

            consecutive_errors = 0
            data = resp.json()
            pending = data.get("pending_consolidation", 0)
            nodes = data.get("total_nodes", 0)

            # Crash detection: if nodes dropped significantly, Space restarted
            if _last_known_nodes > 20 and nodes < _last_known_nodes * 0.5:
                print(
                    f"    CRASH DETECTED: nodes dropped {_last_known_nodes} -> {nodes}. "
                    f"Space restarted. Aborting seed."
                )
                _server_down = True
                return

            _last_known_nodes = max(_last_known_nodes, nodes)

            if pending <= CONSOLIDATION_THRESHOLD:
                if cycle > 0:
                    print(f"    Backpressure OK: {pending} pending (resumed)")
                return

            print(
                f"    Backpressure: {pending} pending consolidations, "
                f"waiting {BACKPRESSURE_WAIT}s... (cycle {cycle+1}/{MAX_WAIT_CYCLES})"
            )
            time.sleep(BACKPRESSURE_WAIT)

        except requests.RequestException as e:
            consecutive_errors += 1
            if consecutive_errors >= 3:
                print(f"    WARNING: Stats unreachable after 3 attempts — continuing")
                return
            print(f"    Backpressure check failed ({consecutive_errors}/3): {e}")
            time.sleep(5)

    print(f"    WARNING: consolidation still high after {MAX_WAIT_CYCLES} cycles — continuing")


def check_backpressure() -> None:
    """Increment batch counter, check backpressure, and rest periodically."""
    global _batch_count
    _batch_count += 1
    if _batch_count % BATCH_SIZE == 0:
        wait_for_consolidation()
    # Rest period: after every N docs, drain queue to 0 then let CPU cool
    if _batch_count % REST_EVERY_N_DOCS == 0 and not _server_down:
        print(f"    REST: {REST_EVERY_N_DOCS} docs done — draining queue first...")
        # Wait for pending to reach 0 (full drain)
        for _ in range(MAX_WAIT_CYCLES):
            try:
                resp = requests.get(
                    f"{HINDSIGHT_URL}/v1/default/banks/{BANK_ID}/stats",
                    headers=HEADERS, timeout=15,
                )
                if resp.status_code == 200:
                    pending = resp.json().get("pending_consolidation", 0)
                    if pending == 0:
                        break
                    print(f"      Draining: {pending} pending...")
            except requests.RequestException:
                pass
            time.sleep(BACKPRESSURE_WAIT)
        print(f"    REST: cooling down {REST_DURATION}s (CPU idle)...")
        time.sleep(REST_DURATION)


# =============================================================================
# Helpers
# =============================================================================
def retain(content: str, document_id: str, context: str = "") -> bool:
    """Retain content into the shared bank."""
    global _server_down

    # Abort if server is down (503 detected)
    if _server_down:
        stats["fail"] += 1
        return False

    # Backpressure: check consolidation queue every BATCH_SIZE calls
    check_backpressure()

    # Truncate if too long
    if len(content) > MAX_CONTENT_CHARS:
        content = content[:MAX_CONTENT_CHARS] + "\n\n[TRUNCATED — original was longer]"

    item = {"content": content, "document_id": document_id}
    if context:
        item["context"] = context
    payload = {"items": [item]}

    # Estimate tokens (~4 chars per token)
    tokens_est = len(content) // 4
    stats["total_tokens_estimate"] += tokens_est

    try:
        resp = requests.post(
            f"{HINDSIGHT_URL}/v1/default/banks/{BANK_ID}/memories",
            headers=HEADERS,
            json=payload,
            timeout=300,
        )
        if resp.status_code in (200, 201, 202):
            stats["ok"] += 1
            return True
        error_text = resp.text[:200]
        if "rate_limit" in error_text.lower() or "429" in error_text:
            print(f"    RATE LIMITED — waiting 60s...")
            time.sleep(60)
            # Retry once
            resp2 = requests.post(
                f"{HINDSIGHT_URL}/v1/default/banks/{BANK_ID}/memories",
                headers=HEADERS,
                json=payload,
                timeout=300,
            )
            if resp2.status_code in (200, 201, 202):
                stats["ok"] += 1
                return True
        if resp.status_code == 503:
            print(f"    SERVER DOWN (503) — aborting seed to prevent crash cascade")
            _server_down = True
            stats["fail"] += 1
            return False
        print(f"    WARN: HTTP {resp.status_code}: {error_text}")
        stats["fail"] += 1
        return False
    except requests.exceptions.Timeout:
        print(f"    TIMEOUT (300s) — data may still be processing")
        stats["fail"] += 1
        return False
    except requests.RequestException as e:
        print(f"    ERROR: {e}")
        stats["fail"] += 1
        return False


def extract_pdf_text(filepath: Path) -> str:
    """Extract text from a PDF file."""
    if PyPDF2 is None:
        return ""
    try:
        with open(filepath, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            pages = []
            for i, page in enumerate(reader.pages):
                text = page.extract_text()
                if text:
                    pages.append(f"[Page {i+1}]\n{text}")
            return "\n\n".join(pages)
    except Exception as e:
        print(f"    PDF extraction error: {e}")
        return ""


def create_mental_model(name: str, source_query: str) -> bool:
    """Create an auto-refreshing mental model."""
    try:
        resp = requests.post(
            f"{HINDSIGHT_URL}/v1/default/banks/{BANK_ID}/mental-models",
            headers=HEADERS,
            json={"name": name, "source_query": source_query},
            timeout=60,
        )
        if resp.status_code in (200, 201):
            return True
        if resp.status_code == 409:
            print(f"    Already exists: {name}")
            return True
        print(f"    WARN: HTTP {resp.status_code}: {resp.text[:200]}")
        return False
    except requests.RequestException as e:
        print(f"    ERROR: {e}")
        return False


# =============================================================================
# Phase 1: ATUM-Agency workspace (text files)
# =============================================================================
def seed_atum_agency_text():
    """Index text files from ATUM-Agency workspace."""
    print("\n=== Phase 1: ATUM-Agency text files ===\n")

    if not ATUM_AGENCY.exists():
        print("  SKIP: ATUM-Agency directory not found")
        return

    # Skip template directories
    skip_patterns = ["_template-", "_archive"]

    text_extensions = {".md", ".txt", ".csv"}
    count = 0

    for filepath in sorted(ATUM_AGENCY.rglob("*")):
        if not filepath.is_file():
            continue
        if filepath.suffix.lower() not in text_extensions:
            continue
        if any(p in str(filepath) for p in skip_patterns):
            stats["skip"] += 1
            continue

        relative = filepath.relative_to(ATUM_AGENCY)
        doc_id = f"atum-workspace-{str(relative).replace(os.sep, '-').replace('.', '-')}"
        context = str(relative.parts[0]) if relative.parts else "atum"

        try:
            content = filepath.read_text(encoding="utf-8", errors="replace")
            if len(content.strip()) < 20:
                stats["skip"] += 1
                continue

            full_content = f"ATUM-Agency workspace: {relative}\n\n{content}"
            print(f"  [{count+1}] {relative}...", end=" ", flush=True)

            if retain(full_content, document_id=doc_id, context=context):
                print("OK")
            else:
                print("FAIL")

            count += 1
            time.sleep(RATE_LIMIT_SECONDS)

        except OSError as e:
            print(f"  ERROR: {relative} -> {e}")
            stats["fail"] += 1

    print(f"\n  Phase 1 done: {count} text files processed")


# =============================================================================
# Phase 2: ATUM-Agency PDFs
# =============================================================================
def seed_atum_agency_pdfs():
    """Index PDF files from ATUM-Agency workspace."""
    print("\n=== Phase 2: ATUM-Agency PDFs ===\n")

    if SKIP_PDF or PyPDF2 is None:
        print("  SKIP: PDF indexing disabled")
        return

    if not ATUM_AGENCY.exists():
        print("  SKIP: ATUM-Agency directory not found")
        return

    count = 0
    for filepath in sorted(ATUM_AGENCY.rglob("*.pdf")):
        if "_archive" in str(filepath):
            continue

        relative = filepath.relative_to(ATUM_AGENCY)
        doc_id = f"atum-pdf-{filepath.stem.lower().replace(' ', '-')[:40]}"
        context = str(relative.parts[0]) if relative.parts else "atum"

        print(f"  [{count+1}] {relative}...", end=" ", flush=True)

        text = extract_pdf_text(filepath)
        if len(text.strip()) < 50:
            print("EMPTY")
            stats["skip"] += 1
            continue

        full_content = f"ATUM-Agency document (PDF): {relative}\n\n{text}"

        if retain(full_content, document_id=doc_id, context=context):
            print("OK")
        else:
            print("FAIL")

        count += 1
        time.sleep(RATE_LIMIT_SECONDS)

    print(f"\n  Phase 2 done: {count} PDFs processed")


# =============================================================================
# Phase 3: Active projects
# =============================================================================
def seed_projects():
    """Index documentation from active project directories."""
    print("\n=== Phase 3: Active projects ===\n")

    if not PROJETS.exists():
        print("  SKIP: projets directory not found")
        return

    # Only index actual project directories (not zips)
    projects = {
        "agent-owl": "ATUM/OWL — EU AI Act compliance audit tool",
        "cogito": "Cogito — AI-powered deliberation and decision platform",
        "tour-manager": "GigRoute — Tour management SaaS for artists",
    }

    text_extensions = {".md", ".txt"}
    count = 0

    for project_name, description in projects.items():
        project_dir = PROJETS / project_name
        if not project_dir.exists():
            print(f"  SKIP: {project_name} (not found)")
            continue

        print(f"\n  --- {project_name}: {description} ---\n")

        for filepath in sorted(project_dir.rglob("*")):
            if not filepath.is_file():
                continue
            if filepath.suffix.lower() not in text_extensions:
                continue
            # Skip common non-doc directories
            skip_dirs = {".git", "node_modules", "__pycache__", ".venv", "venv",
                        ".pytest_cache", "dist", "build", ".eggs"}
            if any(part in skip_dirs for part in filepath.parts):
                continue

            relative = filepath.relative_to(PROJETS)
            doc_id = f"projet-{str(relative).replace(os.sep, '-').replace('.', '-')[:60]}"

            try:
                content = filepath.read_text(encoding="utf-8", errors="replace")
                if len(content.strip()) < 30:
                    stats["skip"] += 1
                    continue

                full_content = f"Projet ATUM: {project_name} ({description})\nFichier: {relative}\n\n{content}"
                print(f"  [{count+1}] {relative}...", end=" ", flush=True)

                if retain(full_content, document_id=doc_id, context=project_name):
                    print("OK")
                else:
                    print("FAIL")

                count += 1
                time.sleep(RATE_LIMIT_SECONDS)

            except OSError as e:
                print(f"  ERROR: {relative} -> {e}")
                stats["fail"] += 1

    print(f"\n  Phase 3 done: {count} project files processed")


# =============================================================================
# Phase 4: Claude data store (JSON)
# =============================================================================
def seed_claude_data():
    """Retain all ATUM data store JSON files."""
    print("\n=== Phase 4: Claude data store (JSON) ===\n")

    if SKIP_DATA:
        print("  SKIP: data store indexing disabled")
        return

    json_files = [
        ("societe.json", "Identite et structure juridique d'ATUM SAS"),
        ("actionnariat.json", "Registre des actionnaires ATUM SAS"),
        ("produits.json", "Catalogue produits et roadmap ATUM"),
        ("obligations.json", "Calendrier des obligations legales ATUM SAS"),
        ("equipe.json", "Registre du personnel ATUM SAS"),
        ("participations.json", "Participations work-for-equity ATUM"),
        ("assurances.json", "Contrats d'assurance ATUM SAS"),
        ("odoo-infrastructure.json", "Infrastructure Odoo SH ATUM"),
        ("finances/budget-2026.json", "Budget previsionnel ATUM SAS 2026"),
        ("finances/quarter-2026-Q1.json", "Rapport financier Q1 2026 ATUM"),
        ("contrats/registre.json", "Registre des contrats ATUM SAS"),
        ("contrats/cgv.json", "Conditions Generales de Vente ATUM"),
        ("facturation/compteurs.json", "Compteurs de facturation ATUM"),
        ("rgpd/registre-traitements.json", "Registre des traitements RGPD ATUM"),
        ("projets/pipeline.json", "Pipeline commercial ATUM SAS"),
        ("decisions/registre.json", "Registre des decisions ATUM"),
    ]

    count = 0
    for filename, description in json_files:
        filepath = DATA_DIR / filename
        if not filepath.exists():
            print(f"  SKIP: {filename}")
            stats["skip"] += 1
            continue

        try:
            with open(filepath, "r", encoding="utf-8") as f:
                data = json.load(f)

            content = f"{description}\n\nSource: .claude/data/agence-atum/{filename}\n\n{json.dumps(data, indent=2, ensure_ascii=False)}"
            doc_id = f"atum-data-{filename.replace('/', '-').replace('.json', '')}"

            print(f"  [{count+1}] {filename}...", end=" ", flush=True)

            if retain(content, document_id=doc_id, context="data-store"):
                print("OK")
            else:
                print("FAIL")

            count += 1
            time.sleep(RATE_LIMIT_SECONDS)

        except (json.JSONDecodeError, OSError) as e:
            print(f"  ERROR: {filename} -> {e}")
            stats["fail"] += 1

    # Skill references
    print("\n  --- Skill references ---\n")
    ref_files = [
        ("statuts-resume.md", "Resume des statuts ATUM SAS"),
        ("business-plan-targets.md", "Objectifs Business Plan V2 ATUM"),
        ("facturation-regles.md", "Regles de facturation ATUM"),
        ("syntec-grille.md", "Grille Syntec applicable"),
        ("rgpd-guide.md", "Guide RGPD ATUM"),
        ("templates-catalog.md", "Catalogue des templates ATUM"),
    ]

    for filename, description in ref_files:
        filepath = REFS_DIR / filename
        if not filepath.exists():
            print(f"  SKIP: {filename}")
            stats["skip"] += 1
            continue

        try:
            content = filepath.read_text(encoding="utf-8", errors="replace")
            full_content = f"{description}\n\nSource: skills/agence-atum/references/{filename}\n\n{content}"
            doc_id = f"atum-ref-{filename.replace('.md', '')}"

            print(f"  [{count+1}] {filename}...", end=" ", flush=True)

            if retain(full_content, document_id=doc_id, context="reference"):
                print("OK")
            else:
                print("FAIL")

            count += 1
            time.sleep(RATE_LIMIT_SECONDS)

        except OSError as e:
            print(f"  ERROR: {filename} -> {e}")
            stats["fail"] += 1

    print(f"\n  Phase 4 done: {count} data files processed")


# =============================================================================
# Phase 5: Mental Models
# =============================================================================
def create_mental_models():
    """Create auto-refreshing mental models."""
    print("\n=== Phase 5: Mental Models ===\n")

    models = [
        ("statut-agence",
         "Quel est l'etat actuel d'ATUM SAS ? Sante financiere, projets actifs, equipe, priorites."),
        ("portefeuille-produits",
         "Quels sont les produits ATUM, leur statut, metriques, et roadmap ?"),
        ("relations-clients",
         "Quels sont les clients et prospects, statut, livrables en cours ?"),
        ("sante-financiere",
         "Quelles sont les finances ? MRR, ARR, budget vs reel, tresorerie."),
        ("conformite",
         "Statut conformite: RGPD, Syntec, assurances, obligations legales."),
    ]

    ok = 0
    for name, query in models:
        if create_mental_model(name, query):
            print(f"  OK: {name}")
            ok += 1
        else:
            print(f"  FAIL: {name}")
        time.sleep(2)

    print(f"\n  Phase 5 done: {ok}/5 Mental Models")


# =============================================================================
# Phase 6: Verification
# =============================================================================
def verify():
    """Run verification queries."""
    print("\n=== Phase 6: Verification ===\n")

    queries = [
        "Qui sont les fondateurs d'ATUM SAS ?",
        "Quels produits ATUM sont en production ?",
        "Quel est le capital social d'ATUM ?",
        "Qu'est-ce que GigRoute ?",
        "Qu'est-ce que Cogito ?",
    ]

    for query in queries:
        try:
            resp = requests.post(
                f"{HINDSIGHT_URL}/v1/default/banks/{BANK_ID}/memories/recall",
                headers=HEADERS,
                json={"query": query, "n": 3},
                timeout=30,
            )
            results = resp.json().get("results", []) if resp.status_code == 200 else []
            print(f"  Q: {query}")
            print(f"  A: {len(results)} memories found")
            if results:
                print(f"     -> {results[0].get('text', '')[:120]}...")
            print()
        except Exception as e:
            print(f"  ERROR: {e}\n")
        time.sleep(2)


# =============================================================================
# Main
# =============================================================================
def main():
    print("=" * 60)
    print("  ATUM Workspace Indexer")
    print(f"  Server: {HINDSIGHT_URL}")
    print(f"  Bank:   {BANK_ID}")
    print(f"  PDF:    {'enabled' if not SKIP_PDF and PyPDF2 else 'disabled'}")
    print(f"  Data:   {'enabled' if not SKIP_DATA else 'disabled'}")
    print("=" * 60)

    # Health check
    try:
        resp = requests.get(f"{HINDSIGHT_URL}/health", timeout=10)
        if resp.status_code != 200:
            print(f"ERROR: Server returned {resp.status_code}")
            sys.exit(1)
        print(f"\n  Server healthy: {resp.json()}")
    except requests.RequestException as e:
        print(f"ERROR: Cannot reach server: {e}")
        sys.exit(1)

    if ONLY_VERIFY:
        verify()
        return

    # Wait for consolidation queue to drain before starting
    # (critical after pg_restore which queues 200+ consolidations on cpu-basic)
    wait_for_initial_drain()

    # Run all phases (backpressure checks happen inside retain())
    seed_atum_agency_text()
    if not _server_down:
        seed_atum_agency_pdfs()
    if not _server_down:
        seed_projects()
    if not _server_down:
        seed_claude_data()
    if not _server_down:
        create_mental_models()
    if not _server_down:
        verify()

    # Summary
    print("=" * 60)
    if _server_down:
        print(f"  ABORTED -- server went down (503)")
    else:
        print(f"  DONE")
    print(f"  OK: {stats['ok']}, FAIL: {stats['fail']}, SKIP: {stats['skip']}")
    print(f"  Estimated tokens used: ~{stats['total_tokens_estimate']:,}")
    print("=" * 60)

    # Post-seed finalization: wait for full consolidation then remove SKIP_RESTORE
    if not _server_down and stats["ok"] > 0:
        finalize_after_seed()


def finalize_after_seed() -> None:
    """Wait for consolidation to complete, then remove SKIP_RESTORE so restore works."""
    print("\n  Post-seed finalization...")

    # Wait for pending_consolidation = 0
    print("  Waiting for full consolidation (pending=0)...")
    for cycle in range(60):  # 60 x 30s = 30 min max
        try:
            resp = requests.get(
                f"{HINDSIGHT_URL}/v1/default/banks/{BANK_ID}/stats",
                headers=HEADERS, timeout=15,
            )
            if resp.status_code == 200:
                pending = resp.json().get("pending_consolidation", 0)
                nodes = resp.json().get("total_nodes", 0)
                if pending == 0:
                    print(f"  Consolidation complete: {nodes} nodes, 0 pending")
                    break
                print(f"  Consolidation: {pending} pending, {nodes} nodes... ({cycle+1}/60)")
        except requests.RequestException:
            pass
        time.sleep(30)

    # Remove SKIP_RESTORE via HuggingFace Hub API
    hf_token = os.environ.get("HF_TOKEN", "")
    if not hf_token:
        print("  HF_TOKEN not set -- cannot remove SKIP_RESTORE automatically")
        print("  Manual step: remove SKIP_RESTORE secret from Space settings")
        return

    try:
        from huggingface_hub import HfApi
        api = HfApi(token=hf_token)
        repo_id = "Arnwald84/atum-hindsight"
        try:
            api.delete_space_secret(repo_id, "SKIP_RESTORE")
            print(f"  SKIP_RESTORE removed from {repo_id}")
        except Exception as e:
            if "404" in str(e) or "not found" in str(e).lower():
                print(f"  SKIP_RESTORE already removed (not found)")
            else:
                print(f"  WARNING: Could not remove SKIP_RESTORE: {e}")
    except ImportError:
        print("  huggingface_hub not installed -- remove SKIP_RESTORE manually")


if __name__ == "__main__":
    main()
