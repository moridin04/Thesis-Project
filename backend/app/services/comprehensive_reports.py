from __future__ import annotations

import json
import os
import threading
from datetime import datetime
from pathlib import Path

from app import generated_files
from app.reports import comprehensive_report

REPORTS_SUBDIR = "reports"
_build_lock = threading.Lock()


def _paths(data_version: str) -> tuple[Path, Path]:
    pdf = generated_files.generated_path(REPORTS_SUBDIR, f"comprehensive-{data_version}.pdf")
    return pdf, pdf.with_suffix(".json")


def _read_meta(meta_path: Path, pdf_path: Path) -> dict | None:
    if not (meta_path.is_file() and pdf_path.is_file()):
        return None
    meta = json.loads(meta_path.read_text("utf-8"))
    meta["generated_at"] = datetime.fromisoformat(meta["generated_at"])
    return meta


def cached_meta() -> dict | None:
    """Metadata of the cached report for the current data version, or None if it isn't built yet."""
    pdf_path, meta_path = _paths(comprehensive_report.report_data_version())
    return _read_meta(meta_path, pdf_path)


def get_or_build(*, force: bool = False) -> tuple[Path, dict, bool]:
    """Return (pdf path, metadata, built_now). Reuses the cached file for the current data version."""
    with _build_lock:
        data_version = comprehensive_report.report_data_version()
        pdf_path, meta_path = _paths(data_version)
        if not force:
            meta = _read_meta(meta_path, pdf_path)
            if meta is not None:
                return pdf_path, meta, False

        partial = pdf_path.with_suffix(".pdf.part")
        result = comprehensive_report.build_comprehensive_report(partial)
        os.replace(partial, pdf_path)
        meta = {
            "generated_at": result["generated_at"],
            "data_version": result["data_version"],
            "page_count": result["page_count"],
            "file_size": pdf_path.stat().st_size,
            "sha256": generated_files.sha256_file(pdf_path),
        }
        meta_path.write_text(json.dumps({**meta, "generated_at": meta["generated_at"].isoformat()}), "utf-8")
        return pdf_path, meta, True


def download_filename(meta: dict) -> str:
    stamp = meta["generated_at"].astimezone(comprehensive_report.MANILA_TZ).strftime("%Y-%m-%d")
    return f"Manila_Barangay_Flood_Risk_Comprehensive_Report_{stamp}.pdf"
