#!/usr/bin/env python3
"""
enrich_op_model.py — Use LM Studio (port 1234) to enrich Operating Model Tags
with structured 5-dimension taxonomy for all 557 ThreadMoat startups.

5 Dimensions of Operating Model:
  DEPLOYMENT    → Cloud | On-premises | Edge | Hybrid
  SEGMENT       → Enterprise | SMB | B2B | B2C
  DELIVERY      → SaaS | PaaS | DaaS | API/SDK | Plugin | HW+SW | Services | Open Source
  SALES MOTION  → Direct Sales | Product-led Growth | Partner-led | OEM | Marketplace | Community-driven
  COMPUTE TYPE  → Standard | Cloud HPC | Edge AI

Designed for ralph-loop: run repeatedly until all companies processed.
Outputs "ALL DONE" when complete so ralph-loop can terminate with <promise>.

Usage:
  python3 scripts/enrich_op_model.py               # process next batch (default 20)
  python3 scripts/enrich_op_model.py --batch 50    # larger batch
  python3 scripts/enrich_op_model.py --reset       # clear state, start over
  python3 scripts/enrich_op_model.py --dry-run     # show what would happen
  python3 scripts/enrich_op_model.py --status      # show progress only
"""

import argparse
import csv
import json
import shutil
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime
from pathlib import Path

# ─── Config ───────────────────────────────────────────────────────────────────

ROOT           = Path(__file__).parent.parent
CSV_PATH       = ROOT / "public/data/Startups-Grid view.csv"
CHECKPOINT_DIR = Path(__file__).parent / ".tag_clean_checkpoints"
STATE_FILE     = CHECKPOINT_DIR / "op_model_enrichment_state.json"

LMSTUDIO_URL   = "http://localhost:1234"
BATCH_SIZE     = 20
MAX_RETRIES    = 3

OP_COL   = "Operating Model Tags"
CAT_COL  = "Category/Function Tags"
DIFF_COL = "Differentiation Tags"

# ─── Canonical Op Model Vocabulary ────────────────────────────────────────────
# LLM must only use tags from these lists.

DEPLOYMENT_TAGS = ["Cloud", "On-premises", "Edge", "Hybrid"]
SEGMENT_TAGS    = ["Enterprise", "SMB", "B2B", "B2C"]
DELIVERY_TAGS   = ["SaaS", "PaaS", "DaaS", "API/SDK", "Plugin", "HW+SW", "Services", "Open Source"]
SALES_TAGS      = ["Direct Sales", "Product-led Growth", "Partner-led", "OEM",
                   "Marketplace", "Community-driven", "Channel"]
COMPUTE_TAGS    = ["Standard", "Cloud HPC", "Edge AI"]

ALL_VALID = set(DEPLOYMENT_TAGS + SEGMENT_TAGS + DELIVERY_TAGS + SALES_TAGS + COMPUTE_TAGS)

# Tags from old taxonomy to PRESERVE as-is (don't strip them)
PRESERVE_TAGS = {
    "Subscription", "Usage-based", "Perpetual License", "Freemium", "Open Core",
    "White-label", "Vertical SaaS", "Vertical Focus", "Enterprise SaaS", "B2B SaaS",
    "Self-Service", "Enterprise Sales", "HW+SW",
}

# ─── LM Studio call ───────────────────────────────────────────────────────────

def get_lmstudio_model() -> str:
    """Get the first available model from LM Studio."""
    req = urllib.request.Request(
        f"{LMSTUDIO_URL}/v1/models",
        headers={"Authorization": "Bearer lm-studio"}
    )
    with urllib.request.urlopen(req, timeout=5) as resp:
        data = json.loads(resp.read())
        models = data.get("data", [])
        if not models:
            raise RuntimeError("No models loaded in LM Studio")
        return models[0]["id"]


def call_lmstudio(prompt: str, model: str) -> str:
    """Call LM Studio OpenAI-compatible endpoint."""
    payload = json.dumps({
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.05,
        "max_tokens": 512,
    }).encode()
    req = urllib.request.Request(
        f"{LMSTUDIO_URL}/v1/chat/completions",
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": "Bearer lm-studio",
        },
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=90) as resp:
        data = json.loads(resp.read())
        return data["choices"][0]["message"]["content"]


# ─── Prompt ───────────────────────────────────────────────────────────────────

SYSTEM_CONTEXT = """You are a B2B industrial software analyst classifying startups into a structured operating model taxonomy.

You must classify each startup across exactly 5 dimensions using ONLY the allowed tags listed.

DIMENSION 1 — DEPLOYMENT (how the software runs):
  Cloud        = hosted in cloud, customers access via internet, no local install needed
  On-premises  = software installed on customer's own servers/hardware
  Edge         = runs on customer's edge devices/machines (OT layer, factory floor)
  Hybrid       = mix of cloud + edge OR cloud + on-premises

DIMENSION 2 — CUSTOMER SEGMENT (who buys it):
  Enterprise   = large companies, complex sales, long contracts
  SMB          = small/medium businesses, simpler sales
  B2B          = sells to businesses generally (use if both Enterprise and SMB, or unclear)
  B2C          = sells to individual consumers or prosumers

DIMENSION 3 — DELIVERY MODEL (what they sell):
  SaaS         = subscription software accessed as a service
  PaaS         = platform others build apps on top of
  DaaS         = data or data pipelines as the primary product
  API/SDK      = consumed programmatically, embedded in developer workflows
  Plugin       = extends an existing tool (CAD, PLM, ERP plugin)
  HW+SW        = hardware device bundled with software
  Services     = professional services, implementation, consulting
  Open Source  = freely available source code (may have commercial tier)

DIMENSION 4 — SALES MOTION (how they sell):
  Direct Sales        = enterprise sales team, outbound, account executives
  Product-led Growth  = product drives adoption, self-serve, bottom-up
  Partner-led         = sells through resellers, system integrators, OEM partners
  OEM                 = software embedded into another vendor's product
  Marketplace         = listed/sold on a platform marketplace (e.g. Salesforce AppExchange)
  Community-driven    = open source or developer community drives growth
  Channel             = indirect channel sales (VARs, distributors)

DIMENSION 5 — COMPUTE TYPE (for the core workload):
  Standard    = normal SaaS compute (web servers, standard databases)
  Cloud HPC   = requires heavy cloud compute: GPU clusters, HPC, for simulation/AI training/rendering
  Edge AI     = runs ML/AI inference on edge hardware at the factory/machine level

RULES:
- Return ONLY a JSON object with keys: deployment, segment, delivery, sales, compute
- Each value is a single string from the allowed tags above
- If unclear, pick the most likely answer
- Do NOT invent new tag names
- "delivery" can be a comma-separated list if genuinely multi-model (e.g. "SaaS, Plugin")"""


def build_prompt(company: str, strengths: str, tech_diff: str,
                 current_op: str, current_cat: str) -> str:
    return f"""{SYSTEM_CONTEXT}

Classify this startup:

Company: {company}
Category tags: {current_cat}
Current op model tags: {current_op}
Strengths: {strengths[:500]}
Technology differentiation: {tech_diff[:500]}

Return ONLY the JSON object, no markdown, no commentary."""


def parse_llm_response(text: str) -> dict | None:
    """Extract JSON from LM Studio response."""
    text = text.strip()
    # Strip markdown fences
    import re
    text = re.sub(r"^```[a-z]*\n?", "", text)
    text = re.sub(r"\n?```$", "", text)
    start, end = text.find("{"), text.rfind("}")
    if start == -1 or end == -1:
        return None
    try:
        return json.loads(text[start:end+1])
    except Exception:
        return None


def validate_result(result: dict) -> dict:
    """Clamp result to allowed values; fall back to 'Unknown' if invalid."""
    def pick(value: str, allowed: list) -> str:
        if not value:
            return "Unknown"
        # Handle comma-separated lists in delivery
        parts = [p.strip() for p in value.split(",")]
        valid = [p for p in parts if p in allowed]
        return ", ".join(valid) if valid else "Unknown"

    return {
        "deployment": pick(result.get("deployment", ""), DEPLOYMENT_TAGS),
        "segment":    pick(result.get("segment", ""),    SEGMENT_TAGS),
        "delivery":   pick(result.get("delivery", ""),   DELIVERY_TAGS),
        "sales":      pick(result.get("sales", ""),      SALES_TAGS),
        "compute":    pick(result.get("compute", ""),    COMPUTE_TAGS),
    }


def build_op_tags(classified: dict, existing_op: str) -> str:
    """
    Merge new structured tags with preserved existing tags.
    Preserves Subscription, Usage-based, Vertical SaaS etc from existing.
    """
    existing = [t.strip() for t in existing_op.split(",") if t.strip()]
    preserved = [t for t in existing if t in PRESERVE_TAGS]

    new_tags = []
    for dim, value in classified.items():
        if value and value != "Unknown":
            # delivery can be multi-value
            for v in value.split(", "):
                v = v.strip()
                if v and v not in new_tags:
                    new_tags.append(v)

    # Merge: structured first, then preserved extras
    all_tags = new_tags + [t for t in preserved if t not in new_tags]
    return ", ".join(all_tags)


# ─── State management ─────────────────────────────────────────────────────────

def load_state() -> dict:
    if STATE_FILE.exists():
        return json.loads(STATE_FILE.read_text())
    return {"processed": [], "errors": [], "started": datetime.now().isoformat()}


def save_state(state: dict):
    CHECKPOINT_DIR.mkdir(exist_ok=True)
    STATE_FILE.write_text(json.dumps(state, indent=2))


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Enrich Op Model tags via LM Studio")
    parser.add_argument("--batch",   type=int, default=BATCH_SIZE, help="Companies per run")
    parser.add_argument("--reset",   action="store_true", help="Clear state and start over")
    parser.add_argument("--dry-run", action="store_true", help="Show prompts, don't write")
    parser.add_argument("--status",  action="store_true", help="Show progress and exit")
    args = parser.parse_args()

    CHECKPOINT_DIR.mkdir(exist_ok=True)

    # Load CSV
    with open(CSV_PATH, encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        fieldnames = list(reader.fieldnames or [])

    total = len(rows)

    # State management
    if args.reset and STATE_FILE.exists():
        STATE_FILE.unlink()
        print("State reset.")

    state = load_state()
    processed_set = set(state["processed"])

    if args.status:
        pct = 100 * len(processed_set) // total
        print(f"Progress: {len(processed_set)}/{total} ({pct}%)")
        if state.get("errors"):
            print(f"Errors: {len(state['errors'])}")
        return

    # Check if already done
    if len(processed_set) >= total:
        print(f"ALL DONE — {total} companies processed.")
        return

    remaining = [r for r in rows if r.get("Company", "?") not in processed_set]
    batch = remaining[:args.batch]
    print(f"Progress: {len(processed_set)}/{total} | Processing {len(batch)} companies this run")

    if args.dry_run:
        for row in batch[:3]:
            company = row.get("Company", "?")
            prompt = build_prompt(
                company,
                row.get("Strengths", ""),
                row.get("Technology Differentiation", ""),
                row.get(OP_COL, ""),
                row.get(CAT_COL, ""),
            )
            print(f"\n--- {company} ---")
            print(prompt[:600])
        return

    # Connect to LM Studio
    try:
        model = get_lmstudio_model()
        print(f"LM Studio model: {model}")
    except Exception as e:
        print(f"ERROR: Cannot connect to LM Studio on :1234 — {e}")
        sys.exit(1)

    # Process batch
    rows_by_company = {r.get("Company", ""): r for r in rows}
    changed = 0

    for row in batch:
        company = row.get("Company", "?")
        prompt = build_prompt(
            company,
            row.get("Strengths", ""),
            row.get("Technology Differentiation", ""),
            row.get(OP_COL, ""),
            row.get(CAT_COL, ""),
        )

        result = None
        for attempt in range(MAX_RETRIES):
            try:
                raw = call_lmstudio(prompt, model)
                result = parse_llm_response(raw)
                if result:
                    break
                print(f"  {company}: parse failed (attempt {attempt+1}), raw: {raw[:100]!r}")
            except Exception as e:
                print(f"  {company}: error (attempt {attempt+1}): {e}")
                time.sleep(2)

        if result is None:
            state["errors"].append({"company": company, "error": "Failed after retries"})
            state["processed"].append(company)
            processed_set.add(company)
            save_state(state)
            continue

        classified = validate_result(result)
        new_op = build_op_tags(classified, row.get(OP_COL, ""))
        old_op = row.get(OP_COL, "")

        if new_op != old_op:
            rows_by_company[company][OP_COL] = new_op
            changed += 1
            print(f"  ✓ {company}")
            print(f"      WAS: {old_op[:80]}")
            print(f"      NOW: {new_op[:80]}")
        else:
            print(f"  = {company} (no change)")

        state["processed"].append(company)
        processed_set.add(company)
        save_state(state)
        time.sleep(0.2)

    # Write CSV
    if changed > 0 and not args.dry_run:
        ts     = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup = CSV_PATH.with_name(f"Startups-Grid view.BACKUP_{ts}.csv")
        shutil.copy2(CSV_PATH, backup)

        updated_rows = [rows_by_company.get(r.get("Company", ""), r) for r in rows]
        with open(CSV_PATH, "w", encoding="utf-8", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(updated_rows)
        print(f"\nBackup → {backup.name}")
        print(f"CSV updated: {changed} companies changed")

    # Check completion
    total_processed = len(state["processed"])
    pct = 100 * total_processed // total
    print(f"\nTotal progress: {total_processed}/{total} ({pct}%)")

    if total_processed >= total:
        errors = len(state.get("errors", []))
        print(f"\nALL DONE — {total} companies processed. Errors: {errors}")
        if errors:
            print("Check state file for error details.")
    else:
        remaining_count = total - total_processed
        print(f"{remaining_count} companies remaining — re-run to continue.")


if __name__ == "__main__":
    main()
