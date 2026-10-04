# CSV file for a public export. public_exports.py passes in the ranked rows.
# Lines that start with # are the title block and the disclaimer, not data rows.
# The table is Rank, then the whitelist columns the admin kept for that export.
# Rounding here is only for the download. The stored records stay as they are.

"""Public CSV: a "# " comment header, Rank plus the selected whitelist columns, and a disclaimer footer."""

from __future__ import annotations

import csv
import io
from datetime import datetime

from app.exports import class_guide
from app.exports.records import PUBLIC_EXPORT_COLUMNS

# First comment line. A different admin title is written on the following line.
CSV_TITLE = "AGOS Barangay Risk Summary"

# Display rounding only; stored data keeps full precision.
_DECIMALS = {
    "dpi_scaled": 2,
    "flood_pct_5yr": 2,
    "flood_pct_25yr": 2,
    "elevation_mean": 2,
    "hazard": 4,
    "exposure": 4,
    "vulnerability": 4,
}


# One body cell. Population is a whole number. Other numeric keys use _DECIMALS.
def _cell(key: str, value) -> str:
    if value is None:
        return ""
    if key == "population_2024":
        return str(int(round(float(value))))
    if key in _DECIMALS:
        return f"{float(value):.{_DECIMALS[key]}f}"
    return str(value)


# Split a paragraph into # lines and drop blank lines.
def _comment_lines(text: str, prefix: str) -> list[str]:
    lines = [line.strip() for line in text.strip().splitlines() if line.strip()]
    return [f"# {prefix}{line}" for line in lines]


# Header comments, the table, then the disclaimer again, with a UTF-8 BOM for Excel.
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
    header = [f"# {CSV_TITLE}"]
    if title.strip() != CSV_TITLE:
        header.append(f"# Title: {title.strip()}")
    if description:
        header += _comment_lines(description, "Description: ")
    header += [
        f"# Version: {version} | Data version: {data_version} | "
        f"Generated: {generated_at:%Y-%m-%d %H:%M} (Asia/Manila) | Records: {len(rows)}",
        f"# Source: {class_guide.SOURCE_NOTE}",
        *_comment_lines(disclaimer, "Disclaimer: "),
        f"# {class_guide.TERTILE_NOTE}",
        f"# Columns: Rank by DPI_Scaled, highest first (ties by barangay number). "
        f"DPI = {class_guide.DPI_NAME}, scaled 0 to 100. "
        "Flood_PCT_5yr and Flood_PCT_25yr are percent 0 to 100; Elevation_Mean is in meters.",
        "# Rounding: DPI_Scaled, Flood_PCT_5yr, Flood_PCT_25yr and Elevation_Mean to 2 decimals; "
        "Hazard, Exposure and Vulnerability to 4 decimals; Population_2024 as a whole number. "
        "Stored data is unchanged.",
    ]

    buffer = io.StringIO()
    # Windows line endings, so each comment line stays its own row in Excel.
    buffer.write("\r\n".join(header) + "\r\n")
    writer = csv.writer(buffer, lineterminator="\r\n", quoting=csv.QUOTE_MINIMAL)
    writer.writerow(["Rank", *(PUBLIC_EXPORT_COLUMNS[key] for key in columns)])
    writer.writerows([row["rank"], *(_cell(key, row[key]) for key in columns)] for row in rows)
    buffer.write("\r\n".join(_comment_lines(disclaimer, "Disclaimer: ")) + "\r\n")
    # BOM so Excel opens the file as UTF-8.
    return ("\ufeff" + buffer.getvalue()).encode("utf-8")
