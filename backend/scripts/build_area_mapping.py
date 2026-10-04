#!/usr/bin/env python3
"""Build backend/app/data/manila_barangay_area_mapping.csv (columns: Barangay, Area).

Source: src/ML-thesis-updated/Input/manila_final_base_dataset_NEW.csv (read only).
Rule:   Area = `city_name` with the "City of Manila - " prefix removed, keyed by `brgy_name`.
        `brgy_name` must equal the published `Barangay` name in
        src/ML-thesis-updated/Output/barangay_flood_risk_predictions.csv (read only),
        suffixes included ("Barangay 818-A"). No number-based matching.
Excluded source rows (not barangays):
        - Tutuban Mall (Claimed by Five Barangays of Tondo, Manila)
        - Manila North Cemetery
Every check below must pass or nothing is written. Output rows follow the published order.

Usage: python3 backend/scripts/build_area_mapping.py [--dry-run]
"""

from __future__ import annotations

import csv
import sys
from collections import Counter
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
SOURCE_CSV = REPO_ROOT / "src" / "ML-thesis-updated" / "Input" / "manila_final_base_dataset_NEW.csv"
PUBLISHED_CSV = REPO_ROOT / "src" / "ML-thesis-updated" / "Output" / "barangay_flood_risk_predictions.csv"
OUTPUT_CSV = REPO_ROOT / "backend" / "app" / "data" / "manila_barangay_area_mapping.csv"

PREFIX = "City of Manila - "
EXCLUDED = {
    "Tutuban Mall (Claimed by Five Barangays of Tondo, Manila)",
    "Manila North Cemetery",
}
EXPECTED_COUNTS = {
    "Tondo I / II": 259, "Sampaloc": 243, "Santa Ana": 99, "Santa Cruz": 82, "Malate": 57,
    "Paco": 43, "Pandacan": 38, "Quiapo": 16, "San Nicolas": 15, "Ermita": 13,
    "San Miguel": 12, "Binondo": 10, "Port Area": 5, "Intramuros": 5,
}
SPOT_ROWS = {
    "Barangay 310": "Santa Cruz", "Barangay 628": "Sampaloc", "Barangay 649": "Port Area",
    "Barangay 818": "Paco", "Barangay 818-A": "Santa Ana",
    "Barangay 664": "Ermita", "Barangay 664-A": "Paco",
}


# Read one CSV as a list of dicts. The source file and the published
# file both go through here, so the column names stay as stored.
def read_rows(path: Path) -> list[dict]:
    with path.open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


# Check names, the city prefix, area counts, and the spot rows.
# Write the mapping only after every check passes.
# --dry-run prints the same checks and writes nothing.
def main() -> int:
    dry_run = "--dry-run" in sys.argv
    source = read_rows(SOURCE_CSV)
    published = [row["Barangay"] for row in read_rows(PUBLISHED_CSV)]
    failures: list[str] = []

    # Print PASS or FAIL. Keep going after a failure so every check still prints.
    def check(ok: bool, label: str) -> None:
        print(f"[{'PASS' if ok else 'FAIL'}] {label}")
        if not ok:
            failures.append(label)

    source_names = [row["brgy_name"] for row in source]
    source_dupes = sorted(n for n, c in Counter(source_names).items() if c > 1)
    published_dupes = sorted(n for n, c in Counter(published).items() if c > 1)
    check(not source_dupes, f"source duplicates: {source_dupes or 0}")
    check(not published_dupes, f"published duplicates: {published_dupes or 0}")

    excluded_found = sorted(EXCLUDED & set(source_names))
    check(excluded_found == sorted(EXCLUDED), f"excluded rows present in source: {excluded_found}")

    bad_prefix = [row["brgy_name"] for row in source if not row["city_name"].startswith(PREFIX)]
    check(not bad_prefix, f"rows without '{PREFIX}' prefix: {bad_prefix or 0}")

    areas = {
        row["brgy_name"]: row["city_name"][len(PREFIX):].strip()
        for row in source
        if row["brgy_name"] not in EXCLUDED
    }
    unmatched_published = [name for name in published if name not in areas]
    unmatched_source = sorted(set(areas) - set(published))
    check(not unmatched_published, f"published names missing from source: {unmatched_published or 0}")
    check(not unmatched_source, f"source names missing from published: {unmatched_source or 0}")
    matched = len(published) - len(unmatched_published)
    check(matched == len(published) == 897, f"matched {matched} of {len(published)} published barangays (expect 897)")

    blank = [name for name in published if name in areas and not areas[name]]
    check(not blank, f"blank areas: {blank or 0}")

    counts = Counter(areas[name] for name in published if name in areas)
    print(f"Areas ({len(counts)}):")
    for area, count in counts.most_common():
        expected = EXPECTED_COUNTS.get(area)
        print(f"  {area}: {count}" + ("" if expected == count else f"  (expected {expected})"))
    check(dict(counts) == EXPECTED_COUNTS, "area counts match the expected 14 areas")

    print("Spot rows:")
    for name, expected in SPOT_ROWS.items():
        actual = areas.get(name)
        print(f"  {name} = {actual}")
        check(actual == expected, f"{name} is {expected}")

    if failures:
        print(f"\n{len(failures)} check(s) failed; nothing written.")
        return 1
    if dry_run:
        print("\nAll checks passed (dry run; nothing written).")
        return 0
    with OUTPUT_CSV.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle, lineterminator="\n")
        writer.writerow(["Barangay", "Area"])
        writer.writerows([name, areas[name]] for name in published)
    print(f"\nAll checks passed; wrote {len(published)} rows to {OUTPUT_CSV.relative_to(REPO_ROOT)}.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
