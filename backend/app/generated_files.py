# Paths and hashes for files we generate at runtime (exports, reports).
# They live in backend/generated, which git ignores. Tests point
# GENERATED_DIR at a temp folder so they do not write into the repo.
# public_exports.py stores the sha256 this module computes.

from __future__ import annotations

import hashlib
from pathlib import Path

# Git-ignored. Tests point this at a temporary directory.
GENERATED_DIR = Path(__file__).resolve().parents[1] / "generated"


# Join parts under GENERATED_DIR and create the parent folder if needed.
def generated_path(*parts: str) -> Path:
    path = GENERATED_DIR.joinpath(*parts)
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


# Hash the file in 64KB chunks so a large report is not loaded at once.
def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(65536), b""):
            digest.update(chunk)
    return digest.hexdigest()
