"""
Fetch Airtable views as CSVs and write to public/data/.
Run locally or via GitHub Actions (see .github/workflows/sync-airtable.yml).
"""

import csv
import os
import sys

import requests

TOKEN = os.environ.get("AIRTABLE_TOKEN")
BASE_ID = os.environ.get("AIRTABLE_BASE_ID")

if not TOKEN or not BASE_ID:
    print("ERROR: AIRTABLE_TOKEN and AIRTABLE_BASE_ID must be set.")
    sys.exit(1)

# Each entry maps a table + view to an output CSV path.
# Table names and view names must match exactly what's in Airtable.
VIEWS = [
    {
        "table": "Startups",
        "view": "Grid view",
        "output": "public/data/Startups-Grid view.csv",
    },
    {
        "table": "Startups",
        "view": "Financial Health",
        "output": "public/data/Startups-Financial Health.csv",
    },
    {
        "table": "Startups",
        "view": "Funding",
        "output": "public/data/Startups-Funding.csv",
    },
    {
        "table": "Investors",
        "view": "Grid view",
        "output": "public/data/Investors-Grid view.csv",
    },
]


def fetch_all_records(table: str, view: str) -> list[dict]:
    """Paginate through all records in a given Airtable table/view."""
    records, offset = [], None
    url = f"https://api.airtable.com/v0/{BASE_ID}/{requests.utils.quote(table)}"
    headers = {"Authorization": f"Bearer {TOKEN}"}

    while True:
        params: dict = {"view": view, "pageSize": 100}
        if offset:
            params["offset"] = offset

        r = requests.get(url, headers=headers, params=params, timeout=30)
        r.raise_for_status()

        data = r.json()
        records.extend(data.get("records", []))
        offset = data.get("offset")
        if not offset:
            break

    return records


def records_to_csv(records: list[dict], path: str) -> None:
    """Write a list of Airtable records to a CSV file."""
    if not records:
        print(f"  No records — skipping {path}")
        return

    # Collect all field names across records (some records may omit empty fields)
    all_fields: list[str] = []
    seen: set[str] = set()
    for rec in records:
        for key in rec.get("fields", {}).keys():
            if key not in seen:
                all_fields.append(key)
                seen.add(key)

    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=all_fields, extrasaction="ignore")
        writer.writeheader()
        for rec in records:
            writer.writerow(rec.get("fields", {}))

    print(f"  Wrote {len(records)} rows → {path}")


def main() -> None:
    for cfg in VIEWS:
        table, view, output = cfg["table"], cfg["view"], cfg["output"]
        print(f"Fetching '{table}' / '{view}' ...")
        try:
            recs = fetch_all_records(table, view)
            records_to_csv(recs, output)
        except requests.HTTPError as e:
            print(f"  HTTP error: {e.response.status_code} — {e.response.text}")
            sys.exit(1)

    print("Done.")


if __name__ == "__main__":
    main()
