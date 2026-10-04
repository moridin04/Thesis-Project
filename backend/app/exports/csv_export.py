"""Compact public CSV: a "# " comment header, Rank plus the whitelisted columns, and a disclaimer footer."""

from __future__ import annotations

import csv
import io
from datetime import datetime

from app.exports import class_guide
from app.exports.records import PUBLIC_EXPORT_COLUMNS

CSV_TITLE = "AGOS Barangay Risk Summary"

# Display rounding only; stored data keeps full precision.
_DECIMALS = {"hazard": 4, "exposure": 4, "vulnerability": 4, "dpi_scaled": 2}


def _cell(key: str, value) -> str:
    if value is None:
        return ""
    if key in _DECIMALS:
        return f"{float(value):.{_DECIMALS[key]}f}"
    return str(value)


def _comment_lines(text: str, prefix: str) -> list[str]:
    lines = [line.strip() for line in text.strip().splitlines() if line.strip()]
    return [f"# {prefix}{line}" for line in lines]


def render_csv(
    *,
    title: str,
    description: str | None,
    version: int,
    data_version: str,
    generated_at: datetime,
    disclaimer: str,
    columns: list[str],
    rows: list[dict],
) -> bytes:
    ranges = class_guide.class_ranges(rows)
    header = [f"# {CSV_TITLE}"]
    if title.strip() != CSV_TITLE:
        header.append(f"# Title: {title.strip()}")
    if description:
        header += _comment_lines(description, "Description: ")
    header += [
        f"# Version: {version} | Data version: {data_version} | "
        f"Generated: {generated_at:%Y-%m-%d %H:%M} (Asia/Manila) | Records: {len(rows)}",
        *_comment_lines(disclaimer, "Disclaimer: "),
        f"# {class_guide.TERTILE_NOTE}",
        "# Class guide (DRRM pillars, short; planning summary):",
        *(f"# {line}" for line in class_guide.csv_guide_lines(ranges)),
        f"# Columns: Rank by DPI_Scaled, highest first (ties by barangay number). "
        f"DPI = {class_guide.DPI_NAME}, scaled 0 to 100.",
        "# Rounding: Hazard, Exposure and Vulnerability to 4 decimals; DPI_Scaled to 2 decimals. "
        "Stored data is unchanged.",
    ]

    buffer = io.StringIO()
    buffer.write("\n".join(header) + "\n")
    writer = csv.writer(buffer, lineterminator="\n")
    writer.writerow(["Rank", *(PUBLIC_EXPORT_COLUMNS[key] for key in columns)])
    writer.writerows([row["rank"], *(_cell(key, row[key]) for key in columns)] for row in rows)
    buffer.write("\n".join(_comment_lines(disclaimer, "Disclaimer: ")) + "\n")
    # BOM so Excel opens the file as UTF-8.
    return ("\ufeff" + buffer.getvalue()).encode("utf-8")
