from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


def record_audit_log(
    db: Session,
    *,
    action: str,
    actor_username: str | None = None,
    resource_type: str | None = None,
    resource_id: str | None = None,
    details: str | None = None,
) -> None:
    entry = AuditLog(
        action=action,
        actor_username=actor_username,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details,
    )
    db.add(entry)
    db.commit()
