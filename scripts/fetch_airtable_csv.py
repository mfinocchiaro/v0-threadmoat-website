import csv
import io
import os
import sys
import requests

TOKEN   = os.environ["AIRTABLE_TOKEN"]
BASE_ID = os.environ["AIRTABLE_BASE_ID"]
BASE_URL = f"https://api.airtable.com/v0/{BASE_ID}"

VIEWS = [
    {
        "table": "Startups",
        "view":   "Software-Only ThreadMoat",
        "output": "data/Startups-Grid view.csv",
    },
    {
        "table": "Startups",
        "view":   "Financial Health",
        "output": "data/Startups-Financial Health.csv",
    },
    {
        "table": "Investors",
        "view":   "Grid view",
        "output": "data/Investors-main.csv",
    },
]


def fetch_all_records(table: str, view: str) -> list[dict]:
    headers = {"Authorization": f"Bearer {TOKEN}"}
    records = []
    params  = {"view": view, "pageSize": 100}

    while True:
        resp = requests.get(f"{BASE_URL}/{requests.utils.quote(table)}", headers=headers, params=params)
        resp.raise_for_status()
        body = resp.json()
        records.extend(body.get("records", []))
        offset = body.get("offset")
        if not offset:
            break
        params["offset"] = offset

    return records


def records_to_csv(records: list[dict], output_path: str) -> None:
    if not records:
        print(f"  No records returned — skipping {output_path}")
        return

    # Collect all field names preserving insertion order
    fieldnames: list[str] = ["id"]
    for rec in records:
        for key in rec.get("fields", {}):
            if key not in fieldnames:
                fieldnames.append(key)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        for rec in records:
            row = {"id": rec["id"], **rec.get("fields", {})}
            writer.writerow(row)

    print(f"  Wrote {len(records)} records → {output_path}")


def main() -> None:
    errors = []
    for cfg in VIEWS:
        table, view, output = cfg["table"], cfg["view"], cfg["output"]
        print(f"Fetching '{table}' / '{view}' ...")
        try:
            recs = fetch_all_records(table, view)
            records_to_csv(recs, output)
        except requests.HTTPError as e:
            msg = f"  HTTP error: {e.response.status_code} — {e.response.text}"
            print(msg)
            errors.append(f"{table}/{view}: {msg}")

    if errors:
        print("\nCompleted with errors:")
        for err in errors:
            print(f"  {err}")
        sys.exit(1)

    print("\nDone.")


if __name__ == "__main__":
    main()
