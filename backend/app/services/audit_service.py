from __future__ import annotations

import logging
import re
from datetime import date, datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog

logger = logging.getLogger(__name__)

MANILA_TZ = ZoneInfo("Asia/Manila")
PUBLIC_ACTOR = "public"
SYSTEM_ACTOR = "system"
PUBLIC_DOWNLOAD_ACTION = "export_downloaded_public"
PUBLIC_DOWNLOAD_WINDOW = timedelta(minutes=10)

# Action-name prefixes behind each Audit Log filter option.
AUDIT_GROUPS: dict[str, tuple[str, ...]] = {
    "uploads": ("upload_", "dataset_"),
    "exports": ("export_",),
    "reports": ("report_",),
    "accounts": ("account_", "login_"),
}

_COUNT_SUFFIX = re.compile(r"^(?P<base>.*?)(?: \(x(?P<count>\d+)\))?$")


def add_audit_log(
    db: Session,
    *,
    action: str,
    actor_username: str | None = None,
    resource_type: str | None = None,
    resource_id: str | None = None,
    details: str | None = None,
) -> AuditLog:
    """Stage an audit row in the caller's transaction (committed together with the change it records)."""
    entry = AuditLog(
        action=action,
        actor_username=actor_username,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details,
    )
    db.add(entry)
    return entry


def record_audit_log(
    db: Session,
    *,
    action: str,
    actor_username: str | None = None,
    resource_type: str | None = None,
    resource_id: str | None = None,
    details: str | None = None,
) -> None:
    add_audit_log(
        db,
        action=action,
        actor_username=actor_username,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details,
    )
    db.commit()


def record_audit_log_safely(db: Session, **fields) -> None:
    """For downloads: a failed audit write is logged and swallowed so the file is still served."""
    try:
        record_audit_log(db, **fields)
    except Exception:
        db.rollback()
        logger.exception("Audit write failed for action %s", fields.get("action"))


def record_public_download(db: Session, *, resource_id: str, label: str) -> None:
    """Anonymous download: no IP, user agent or cookie is stored. Repeats within 10 minutes bump a count."""
    try:
        since = datetime.now(timezone.utc).replace(tzinfo=None) - PUBLIC_DOWNLOAD_WINDOW
        recent = (
            db.query(AuditLog)
            .filter(
                AuditLog.action == PUBLIC_DOWNLOAD_ACTION,
                AuditLog.resource_type == "public_export",
                AuditLog.resource_id == resource_id,
                AuditLog.created_at >= since,
            )
            .order_by(AuditLog.created_at.desc(), AuditLog.id.desc())
            .first()
        )
        if recent is None:
            add_audit_log(
                db,
                action=PUBLIC_DOWNLOAD_ACTION,
                actor_username=PUBLIC_ACTOR,
                resource_type="public_export",
                resource_id=resource_id,
                details=label,
            )
        else:
            match = _COUNT_SUFFIX.match(recent.details or label)
            count = int(match.group("count") or 1) + 1
            recent.details = f"{match.group('base')} (x{count})"
        db.commit()
    except Exception:
        db.rollback()
        logger.exception("Audit write failed for a public export download")


def _manila_day_bounds(day: date) -> tuple[datetime, datetime]:
    start = datetime.combine(day, time.min, tzinfo=MANILA_TZ).astimezone(timezone.utc).replace(tzinfo=None)
    return start, start + timedelta(days=1)


def list_audit_logs(
    db: Session, *, group: str | None = None, day: date | None = None, limit: int = 50, offset: int = 0
) -> list[AuditLog]:
    query = db.query(AuditLog)
    if group:
        query = query.filter(or_(*(AuditLog.action.startswith(prefix) for prefix in AUDIT_GROUPS[group])))
    if day:
        start, end = _manila_day_bounds(day)
        query = query.filter(AuditLog.created_at >= start, AuditLog.created_at < end)
    return query.order_by(AuditLog.created_at.desc(), AuditLog.id.desc()).offset(offset).limit(limit).all()
