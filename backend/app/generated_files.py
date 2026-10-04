from __future__ import annotations

import hashlib
from pathlib import Path

# Git-ignored. Tests point this at a temporary directory.
GENERATED_DIR = Path(__file__).resolve().parents[1] / "generated"


def generated_path(*parts: str) -> Path:
    path = GENERATED_DIR.joinpath(*parts)
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(65536), b""):
            digest.update(chunk)
    return digest.hexdigest()
