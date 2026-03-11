#!/usr/bin/env python3
"""
push_tags_to_airtable.py — Push cleaned tag columns back to Airtable.

Updates 3 fields for each record: Category/Function Tags, Operating Model Tags,
Differentiation Tags. Matches by Company name.

Usage:
  python3 scripts/push_tags_to_airtable.py             # dry-run
  python3 scripts/push_tags_to_airtable.py --apply      # push to Airtable
"""

import argparse
import csv
import json
import os
import sys
import time
import urllib.request
import urllib.error
from urllib.parse import quote

TOKEN   = os.environ.get("AIRTABLE_TOKEN", "")
BASE_ID = os.environ.get("AIRTABLE_BASE_ID", "")
TABLE   = "Startups"

CSV_PATH = os.path.join(os.path.dirname(__file__), "..", "public", "data", "Startups-Grid view.csv")

CAT_COL  = "Category/Function Tags"
OP_COL   = "Operating Model Tags"
DIFF_COL = "Differentiation Tags"
IND_COL  = "Industries Served"

BATCH_SIZE = 10  # Airtable allows 10 records per PATCH


def fetch_all_records():
    """Fetch all records from Airtable to get record IDs mapped to company names."""
    records = []
    offset = None
    url = f"https://api.airtable.com/v0/{BASE_ID}/{quote(TABLE)}"

    while True:
        params = f"pageSize=100&fields%5B%5D=Company"
        if offset:
            params += f"&offset={offset}"
        req = urllib.request.Request(
            f"{url}?{params}",
            headers={"Authorization": f"Bearer {TOKEN}"}
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read())
        records.extend(data.get("records", []))
        offset = data.get("offset")
        if not offset:
            break

    return records


def patch_records(updates: list[dict]):
    """PATCH a batch of records (max 10)."""
    url = f"https://api.airtable.com/v0/{BASE_ID}/{quote(TABLE)}"
    payload = json.dumps({"records": updates}).encode()
    req = urllib.request.Request(
        url,
        data=payload,
        headers={
            "Authorization": f"Bearer {TOKEN}",
            "Content-Type": "application/json",
        },
        method="PATCH"
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read())


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()

    if not TOKEN or not BASE_ID:
        print("ERROR: AIRTABLE_TOKEN and AIRTABLE_BASE_ID must be set.")
        sys.exit(1)

    # Load local CSV
    with open(CSV_PATH, encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    local_tags = {}
    for row in rows:
        name = row.get("Company", "").strip()
        if name:
            local_tags[name] = {
                CAT_COL:  row.get(CAT_COL, ""),
                OP_COL:   row.get(OP_COL, ""),
                DIFF_COL: row.get(DIFF_COL, ""),
                IND_COL:  row.get(IND_COL, ""),
            }

    print(f"Local CSV: {len(local_tags)} companies with cleaned tags")

    # Fetch Airtable record IDs
    print("Fetching Airtable record IDs...")
    at_records = fetch_all_records()
    print(f"Airtable: {len(at_records)} records")

    # Build updates
    updates = []
    not_found = []
    for rec in at_records:
        name = rec.get("fields", {}).get("Company", "").strip()
        rec_id = rec["id"]
        if name in local_tags:
            tags = local_tags[name]
            # Fields are now "long text" — send plain comma-separated strings
            updates.append({
                "id": rec_id,
                "fields": {
                    CAT_COL:  tags[CAT_COL],
                    OP_COL:   tags[OP_COL],
                    DIFF_COL: tags[DIFF_COL],
                    IND_COL:  tags[IND_COL],
                }
            })
        else:
            not_found.append(name)

    print(f"Records to update: {len(updates)}")
    if not_found:
        print(f"Not found in local CSV ({len(not_found)}): {not_found[:10]}...")

    if not args.apply:
        # Show sample
        print("\nSample updates (first 5):")
        for u in updates[:5]:
            print(f"  {u['id']}: {u['fields'][OP_COL][:60]}...")
        print(f"\nDry run — pass --apply to push to Airtable.")
        return

    # Push in batches of 10
    total = len(updates)
    done = 0
    errors = 0
    for i in range(0, total, BATCH_SIZE):
        batch = updates[i:i+BATCH_SIZE]
        try:
            patch_records(batch)
            done += len(batch)
            pct = 100 * done // total
            print(f"  [{done}/{total}] ({pct}%) pushed", flush=True)
        except urllib.error.HTTPError as e:
            errors += len(batch)
            body = e.read().decode() if e.fp else ""
            print(f"  ERROR batch {i//BATCH_SIZE}: {e.code} — {body[:200]}")
        time.sleep(0.25)  # Airtable rate limit: 5 req/sec

    print(f"\nDone. Updated: {done}, Errors: {errors}")


if __name__ == "__main__":
    main()
