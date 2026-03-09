#!/usr/bin/env python3
"""
clean_tags.py — Interactive tag taxonomy cleaner for ThreadMoat startup database.

Human-in-the-loop workflow:
  Phase 1 (analyze):  LLM proposes canonical form + correct column for every unique tag
  Phase 2 (review):   You approve / edit / skip each proposal interactively
  Phase 3 (apply):    Approved changes written to CSV (backup created first)

LLM backends (auto-detected, use --model to override):
  ollama    — local Ollama on :11434 (default, free)
  lmstudio  — local LM Studio on :1234  (OpenAI-compatible, free)
  azure     — Azure AI Foundry (set AZURE_AI_ENDPOINT + AZURE_AI_KEY in env)
  skip      — skip LLM entirely, go straight to manual review

Usage:
  python3 scripts/clean_tags.py                   # full run (analyze → review → apply)
  python3 scripts/clean_tags.py --model azure      # force Azure backend
  python3 scripts/clean_tags.py --review-only      # skip analyze, review existing proposals
  python3 scripts/clean_tags.py --apply-only       # skip analyze+review, apply approved.json
  python3 scripts/clean_tags.py --dry-run          # show what would change, don't write CSV
"""

import argparse
import csv
import json
import os
import re
import shutil
import sys
import time
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path

# ─── Config ───────────────────────────────────────────────────────────────────

CSV_PATH = Path(__file__).parent.parent / "public/data/Startups-Grid view.csv"
CHECKPOINT_DIR = Path(__file__).parent / ".tag_clean_checkpoints"

COL_CATEGORY = "Category/Function Tags"
COL_OPMODEL  = "Operating Model Tags"
COL_DIFFTAGS = "Differentiation Tags"
ALL_COLS     = [COL_CATEGORY, COL_OPMODEL, COL_DIFFTAGS]

COL_SHORT = {
    COL_CATEGORY: "category",
    COL_OPMODEL:  "operating_model",
    COL_DIFFTAGS: "differentiation",
}
COL_FROM_SHORT = {v: k for k, v in COL_SHORT.items()}

OLLAMA_URL    = "http://localhost:11434"
LMSTUDIO_URL  = "http://localhost:1234"
OLLAMA_MODEL  = "qwen3:8b"    # best available for reasoning
BATCH_SIZE    = 15            # tags per LLM call

# ANSI colours
R  = "\033[0;31m"
G  = "\033[0;32m"
Y  = "\033[0;33m"
B  = "\033[0;34m"
M  = "\033[0;35m"
C  = "\033[0;36m"
W  = "\033[1;37m"
DIM = "\033[2m"
RESET = "\033[0m"

# ─── LLM backends ─────────────────────────────────────────────────────────────

def detect_backend():
    """Auto-detect best available backend."""
    import urllib.request
    # Try Ollama
    try:
        urllib.request.urlopen(f"{OLLAMA_URL}/api/tags", timeout=2)
        return "ollama"
    except Exception:
        pass
    # Try LM Studio
    try:
        urllib.request.urlopen(f"{LMSTUDIO_URL}/v1/models", timeout=2)
        return "lmstudio"
    except Exception:
        pass
    # Try Azure
    if os.getenv("AZURE_AI_ENDPOINT") and os.getenv("AZURE_AI_KEY"):
        return "azure"
    return "skip"


def call_ollama(prompt: str, model: str = OLLAMA_MODEL) -> str:
    import urllib.request, urllib.error
    payload = json.dumps({
        "model": model,
        "prompt": prompt,
        "stream": False,
        "options": {"temperature": 0.1}
    }).encode()
    req = urllib.request.Request(
        f"{OLLAMA_URL}/api/generate",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        data = json.loads(resp.read())
        return data.get("response", "")


def call_openai_compat(base_url: str, prompt: str, api_key: str = "lm-studio", model: str = None) -> str:
    """OpenAI-compatible endpoint (LM Studio or Azure AI Foundry)."""
    import urllib.request
    if model is None:
        # Get first available model
        try:
            req = urllib.request.Request(f"{base_url}/v1/models",
                                         headers={"Authorization": f"Bearer {api_key}"})
            with urllib.request.urlopen(req, timeout=5) as r:
                models = json.loads(r.read())
                model = models["data"][0]["id"]
        except Exception:
            model = "default"
    payload = json.dumps({
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.1,
    }).encode()
    req = urllib.request.Request(
        f"{base_url}/v1/chat/completions",
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        data = json.loads(resp.read())
        return data["choices"][0]["message"]["content"]


def call_llm(prompt: str, backend: str) -> str:
    if backend == "ollama":
        return call_ollama(prompt)
    elif backend == "lmstudio":
        return call_openai_compat(LMSTUDIO_URL, prompt)
    elif backend == "azure":
        endpoint = os.environ["AZURE_AI_ENDPOINT"].rstrip("/")
        api_key  = os.environ["AZURE_AI_KEY"]
        model    = os.getenv("AZURE_AI_MODEL")  # optional, e.g. "gpt-4o-mini"
        return call_openai_compat(endpoint, prompt, api_key=api_key, model=model)
    else:
        raise ValueError(f"Unknown backend: {backend}")


# ─── CSV helpers ──────────────────────────────────────────────────────────────

def load_csv() -> tuple[list[dict], list[str]]:
    with open(CSV_PATH, encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        fieldnames = reader.fieldnames or []
    return rows, fieldnames


def split_tags(raw: str) -> list[str]:
    return [t.strip() for t in raw.split(",") if t.strip()]


def join_tags(tags: list[str]) -> str:
    return ", ".join(tags)


def collect_unique_tags(rows: list[dict]) -> dict[str, dict]:
    """
    Returns {tag_text: {col_short: count, ...}}
    where col_short is one of category / operating_model / differentiation.
    """
    tag_map: dict[str, dict] = defaultdict(lambda: defaultdict(int))
    for row in rows:
        for col in ALL_COLS:
            short = COL_SHORT[col]
            for tag in split_tags(row.get(col, "")):
                tag_map[tag][short] += 1
    return {k: dict(v) for k, v in tag_map.items()}


# ─── LLM prompt & parsing ─────────────────────────────────────────────────────

SYSTEM_CONTEXT = """You are a taxonomy expert for industrial software startups in the PLM, CAD, manufacturing, simulation, and AI space.

There are exactly 3 tag columns with clear meanings:

CATEGORY/FUNCTION TAGS — WHAT the product does (functional domain).
  Examples: "Simulation", "Digital Twin", "CAD", "MES", "Robotics", "Additive Manufacturing",
            "Workflow Automation", "Engineering Software", "AI for Design"
  Rule: concrete software capability or product category.

OPERATING MODEL TAGS — HOW the business operates (go-to-market + delivery model).
  Examples: "B2B", "SaaS", "Cloud-native", "API-first", "Enterprise", "SMB",
            "Subscription", "Product-led growth", "Open-source", "Marketplace"
  Rule: business model, pricing model, delivery method, customer segment.

DIFFERENTIATION TAGS — WHY they are unique vs. competitors (competitive angle).
  Examples: "Proprietary AI Models", "Real-time collaboration", "Deep Domain Expertise",
            "No-code workflows", "Fast Deployment", "Patented process", "AI-native"
  Rule: the specific moat or differentiator, not the category itself.

Common misclassifications to fix:
- "Workflow Automation" in Differentiation → usually belongs in Category
- "Digital Twins" in Differentiation → belongs in Category
- "cloud-native workflow" in Differentiation → Operating Model
- "AI Copilot", "AI Platform" in Operating Model → could be Category or Differentiation
- Duplicate case variants must be unified to one canonical form"""


def build_batch_prompt(batch: list[tuple[str, str]]) -> str:
    """batch = list of (tag_text, current_column_short)"""
    lines = []
    for i, (tag, col) in enumerate(batch, 1):
        lines.append(f'{i}. tag="{tag}" currently_in="{col}"')
    tags_block = "\n".join(lines)

    return f"""{SYSTEM_CONTEXT}

For each tag below, return a JSON array (one object per tag, in the same order).
Each object must have exactly these keys:
  "canonical"   — correct capitalization/spelling (fix case drift, merge near-duplicates)
  "column"      — one of: category | operating_model | differentiation
  "confidence"  — float 0.0–1.0
  "reason"      — one short sentence explaining the classification

Tags to classify:
{tags_block}

Return ONLY the JSON array, no markdown fences, no commentary."""


def extract_json_array(text: str) -> list[dict]:
    """Extract first JSON array from LLM response (handles prose wrapping)."""
    text = text.strip()
    # strip markdown fences if present
    text = re.sub(r"^```[a-z]*\n?", "", text)
    text = re.sub(r"\n?```$", "", text)
    # find first [ ... ]
    start = text.find("[")
    end   = text.rfind("]")
    if start == -1 or end == -1:
        raise ValueError("No JSON array found in response")
    return json.loads(text[start:end+1])


# ─── Phase 1: Analyze ─────────────────────────────────────────────────────────

def phase_analyze(rows, backend, proposals_path: Path):
    print(f"\n{B}{'─'*60}{RESET}")
    print(f"{W}PHASE 1 — Tag Analysis via LLM ({backend}){RESET}")
    print(f"{B}{'─'*60}{RESET}\n")

    tag_map = collect_unique_tags(rows)
    total   = len(tag_map)
    print(f"Found {W}{total}{RESET} unique tags across {len(rows)} companies.\n")

    # Flatten to list of (tag, dominant_column)
    items = []
    for tag, col_counts in tag_map.items():
        dominant = max(col_counts, key=col_counts.get)
        items.append((tag, dominant, col_counts))

    proposals = {}
    batches = [items[i:i+BATCH_SIZE] for i in range(0, len(items), BATCH_SIZE)]

    for b_idx, batch in enumerate(batches):
        batch_display = [(tag, col) for tag, col, _ in batch]
        print(f"  {DIM}Batch {b_idx+1}/{len(batches)} ({len(batch)} tags)...{RESET}", end="", flush=True)

        try:
            prompt   = build_batch_prompt(batch_display)
            response = call_llm(prompt, backend)
            parsed   = extract_json_array(response)

            if len(parsed) != len(batch):
                print(f" {Y}⚠ got {len(parsed)} results for {len(batch)} tags — padding with skips{RESET}")
                parsed += [None] * (len(batch) - len(parsed))

            for (tag, dominant, col_counts), result in zip(batch, parsed):
                if result is None:
                    proposals[tag] = {
                        "canonical": tag,
                        "column":    dominant,
                        "confidence": 0.0,
                        "reason":    "LLM returned no result",
                        "current_columns": col_counts,
                        "status":    "pending",
                    }
                else:
                    proposals[tag] = {
                        "canonical":  result.get("canonical", tag),
                        "column":     result.get("column", dominant),
                        "confidence": float(result.get("confidence", 0.5)),
                        "reason":     result.get("reason", ""),
                        "current_columns": col_counts,
                        "status":    "pending",
                    }
            print(f" {G}✓{RESET}")

        except Exception as e:
            print(f" {R}✗ {e}{RESET}")
            for tag, dominant, col_counts in batch:
                proposals[tag] = {
                    "canonical": tag,
                    "column":    dominant,
                    "confidence": 0.0,
                    "reason":    f"Error: {e}",
                    "current_columns": col_counts,
                    "status":    "pending",
                }

        time.sleep(0.3)  # be nice to local inference server

    proposals_path.write_text(json.dumps(proposals, indent=2, ensure_ascii=False))
    print(f"\n{G}✓ Proposals saved → {proposals_path.name}{RESET}")
    return proposals


# ─── Phase 2: Human Review ────────────────────────────────────────────────────

def fmt_col(col_short: str) -> str:
    colours = {"category": C, "operating_model": M, "differentiation": Y}
    return f"{colours.get(col_short, W)}{col_short}{RESET}"

def fmt_conf(conf: float) -> str:
    if conf >= 0.8: return f"{G}{conf:.0%}{RESET}"
    if conf >= 0.5: return f"{Y}{conf:.0%}{RESET}"
    return f"{R}{conf:.0%}{RESET}"


def phase_review(proposals: dict, proposals_path: Path) -> dict:
    print(f"\n{B}{'─'*60}{RESET}")
    print(f"{W}PHASE 2 — Human Review{RESET}")
    print(f"{B}{'─'*60}{RESET}")
    print(f"Commands: {G}y{RESET}=approve  {R}n{RESET}=reject  {Y}e{RESET}=edit  {C}s{RESET}=skip  {W}q{RESET}=save&quit\n")

    pending = {k: v for k, v in proposals.items() if v["status"] == "pending"}
    total   = len(pending)
    done    = 0

    for tag, prop in pending.items():
        done += 1
        current_cols = prop["current_columns"]
        current_str  = ", ".join(f"{fmt_col(c)}×{n}" for c, n in current_cols.items())

        # Detect changes
        canonical_changed = (prop["canonical"].strip().lower() != tag.strip().lower())
        col_changed       = any(c != prop["column"] for c in current_cols)
        is_trivial        = not canonical_changed and not col_changed

        # Skip trivial no-changes silently at high confidence
        if is_trivial and prop["confidence"] >= 0.85:
            proposals[tag]["status"] = "approved"
            continue

        print(f"\n{DIM}[{done}/{total}]{RESET}  {W}{tag!r}{RESET}  (currently in: {current_str})")
        if canonical_changed:
            print(f"  {DIM}canonical:{RESET}  {R}{tag!r}{RESET}  →  {G}{prop['canonical']!r}{RESET}")
        if col_changed:
            dom = max(current_cols, key=current_cols.get)
            print(f"  {DIM}column:   {RESET}  {fmt_col(dom)}  →  {fmt_col(prop['column'])}")
        print(f"  {DIM}confidence:{RESET} {fmt_conf(prop['confidence'])}   {DIM}reason:{RESET} {prop['reason']}")

        while True:
            choice = input(f"  {DIM}>{RESET} ").strip().lower()
            if choice in ("y", ""):
                proposals[tag]["status"] = "approved"
                break
            elif choice == "n":
                proposals[tag]["status"] = "rejected"
                break
            elif choice == "s":
                proposals[tag]["status"] = "skipped"
                break
            elif choice == "q":
                proposals_path.write_text(json.dumps(proposals, indent=2, ensure_ascii=False))
                print(f"\n{Y}Progress saved. Re-run with --review-only to continue.{RESET}")
                sys.exit(0)
            elif choice == "e":
                print(f"  New canonical (blank=keep {prop['canonical']!r}): ", end="")
                new_canon = input().strip() or prop["canonical"]
                print(f"  New column [category/operating_model/differentiation] (blank=keep {prop['column']}): ", end="")
                new_col = input().strip() or prop["column"]
                if new_col not in ("category", "operating_model", "differentiation"):
                    print(f"  {R}Invalid column, keeping {prop['column']}{RESET}")
                    new_col = prop["column"]
                proposals[tag]["canonical"] = new_canon
                proposals[tag]["column"]    = new_col
                proposals[tag]["status"]    = "approved"
                break
            else:
                print(f"  {R}Unknown command. Use y/n/e/s/q{RESET}")

    proposals_path.write_text(json.dumps(proposals, indent=2, ensure_ascii=False))
    approved = sum(1 for p in proposals.values() if p["status"] == "approved")
    rejected = sum(1 for p in proposals.values() if p["status"] == "rejected")
    skipped  = sum(1 for p in proposals.values() if p["status"] == "skipped")
    print(f"\n{G}Review complete:{RESET} {G}{approved} approved{RESET}  {R}{rejected} rejected{RESET}  {C}{skipped} skipped{RESET}")
    return proposals


# ─── Phase 3: Apply ───────────────────────────────────────────────────────────

def build_rewrite_map(proposals: dict) -> tuple[dict[str, str], dict[str, str]]:
    """
    Returns:
      canonical_map: {old_tag → canonical_tag}   (for text normalization)
      column_map:    {canonical_tag → column_short}  (for column reassignment)
    """
    canonical_map = {}
    column_map    = {}
    for tag, prop in proposals.items():
        if prop["status"] != "approved":
            continue
        canonical = prop["canonical"]
        canonical_map[tag] = canonical
        column_map[canonical] = prop["column"]
    return canonical_map, column_map


def apply_to_row(row: dict, canonical_map: dict, column_map: dict) -> tuple[dict, list[str]]:
    """Apply approved changes to one CSV row. Returns (new_row, change_log)."""
    new_row  = dict(row)
    changes  = []

    # Collect all current tags per column
    col_tags: dict[str, list[str]] = {}
    for col in ALL_COLS:
        col_tags[col] = split_tags(row.get(col, ""))

    # Normalize and reclassify
    new_col_tags: dict[str, list[str]] = {col: [] for col in ALL_COLS}

    for col in ALL_COLS:
        for tag in col_tags[col]:
            canonical = canonical_map.get(tag, tag)
            target_short = column_map.get(canonical)
            target_col   = COL_FROM_SHORT.get(target_short, col) if target_short else col

            if canonical != tag:
                changes.append(f"  rename: {col!r}: {tag!r} → {canonical!r}")
            if target_col != col:
                changes.append(f"  move:   {tag!r}: {COL_SHORT[col]} → {COL_SHORT[target_col]}")

            if canonical not in new_col_tags[target_col]:  # dedup
                new_col_tags[target_col].append(canonical)

    for col in ALL_COLS:
        new_row[col] = join_tags(new_col_tags[col])

    return new_row, changes


def phase_apply(rows: list[dict], fieldnames: list[str], proposals: dict, dry_run: bool):
    print(f"\n{B}{'─'*60}{RESET}")
    print(f"{W}PHASE 3 — Apply Changes{RESET}")
    print(f"{B}{'─'*60}{RESET}\n")

    canonical_map, column_map = build_rewrite_map(proposals)
    approved_count = sum(1 for p in proposals.values() if p["status"] == "approved")
    print(f"{approved_count} approved rules loaded.\n")

    all_changes = []
    new_rows    = []
    companies_changed = 0

    for row in rows:
        new_row, changes = apply_to_row(row, canonical_map, column_map)
        new_rows.append(new_row)
        if changes:
            companies_changed += 1
            all_changes.append((row.get("Company", "?"), changes))

    # Print diff summary
    print(f"Companies affected: {W}{companies_changed}{RESET} / {len(rows)}\n")
    if all_changes:
        show = min(20, len(all_changes))
        print(f"{DIM}Showing first {show} companies with changes:{RESET}")
        for company, changes in all_changes[:show]:
            print(f"\n  {C}{company}{RESET}")
            for c in changes[:6]:
                print(f"    {c}")
            if len(changes) > 6:
                print(f"    {DIM}... +{len(changes)-6} more{RESET}")
        if len(all_changes) > show:
            print(f"\n  {DIM}... and {len(all_changes)-show} more companies{RESET}")

    if dry_run:
        print(f"\n{Y}Dry run — no files written.{RESET}")
        return

    # Backup original
    ts     = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup = CSV_PATH.with_name(f"Startups-Grid view.BACKUP_{ts}.csv")
    shutil.copy2(CSV_PATH, backup)
    print(f"\n{G}Backup saved → {backup.name}{RESET}")

    # Write cleaned CSV
    with open(CSV_PATH, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(new_rows)

    print(f"{G}✓ CSV updated: {CSV_PATH.name}{RESET}")

    # Write change log
    log_path = CHECKPOINT_DIR / f"changes_{ts}.txt"
    with open(log_path, "w") as f:
        f.write(f"ThreadMoat Tag Clean — {ts}\n")
        f.write(f"Companies changed: {companies_changed}/{len(rows)}\n\n")
        for company, changes in all_changes:
            f.write(f"\n{company}\n")
            for c in changes:
                f.write(f"  {c}\n")
    print(f"{G}✓ Change log → {log_path.name}{RESET}")


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Interactive tag taxonomy cleaner")
    parser.add_argument("--model", choices=["ollama", "lmstudio", "azure", "skip", "auto"],
                        default="auto", help="LLM backend to use")
    parser.add_argument("--review-only", action="store_true",
                        help="Skip analysis, go straight to reviewing existing proposals")
    parser.add_argument("--apply-only", action="store_true",
                        help="Skip analysis+review, apply approved.json directly")
    parser.add_argument("--dry-run", action="store_true",
                        help="Show what would change without writing CSV")
    args = parser.parse_args()

    CHECKPOINT_DIR.mkdir(exist_ok=True)
    proposals_path = CHECKPOINT_DIR / "proposals.json"

    rows, fieldnames = load_csv()
    print(f"\n{G}Loaded {len(rows)} companies from {CSV_PATH.name}{RESET}")

    # ── Backend detection ──
    if not args.apply_only and not args.review_only:
        backend = args.model if args.model != "auto" else detect_backend()
        if backend == "skip":
            print(f"{Y}No LLM backend available — all proposals will be manual{RESET}")
        else:
            print(f"LLM backend: {W}{backend}{RESET}", end="")
            if backend == "ollama":
                print(f"  ({OLLAMA_MODEL})")
            else:
                print()

    # ── Phase 1: Analyze ──
    if args.apply_only:
        if not proposals_path.exists():
            print(f"{R}No proposals.json found. Run without --apply-only first.{RESET}")
            sys.exit(1)
        proposals = json.loads(proposals_path.read_text())
    elif args.review_only:
        if not proposals_path.exists():
            print(f"{R}No proposals.json found. Run without --review-only first.{RESET}")
            sys.exit(1)
        proposals = json.loads(proposals_path.read_text())
        pending = sum(1 for p in proposals.values() if p["status"] == "pending")
        print(f"\nLoaded {len(proposals)} proposals ({pending} still pending).")
    else:
        proposals = phase_analyze(rows, backend, proposals_path)

    # ── Phase 2: Review ──
    if not args.apply_only:
        proposals = phase_review(proposals, proposals_path)

    # ── Phase 3: Apply ──
    if not args.review_only or args.apply_only:
        phase_apply(rows, fieldnames, proposals, dry_run=args.dry_run)
    else:
        print(f"\n{Y}Review-only mode — run without --review-only to apply changes.{RESET}")


if __name__ == "__main__":
    main()
