# What each role is allowed to do, as plain string names.
# Staff can view and prepare. Admin gets those plus publish, the audit
# log, and account management. require_permission in dependencies/auth.py
# calls has_permission before a route runs.
# A role we do not know gets an empty set, so it is denied.

from __future__ import annotations

ROLE_STAFF = "staff"
ROLE_ADMIN = "admin"

# Permission constants
BARANGAY_VIEW_INTERNAL = "barangay:view_internal"
BARANGAY_PREPARE = "barangay:prepare"
BARANGAY_PUBLISH = "barangay:publish"
DATASET_UPLOAD = "dataset:upload"
DATASET_SUBMIT = "dataset:submit"
DATASET_PUBLISH = "dataset:publish"
MODEL_VIEW = "model:view"
MODEL_SUBMIT = "model:submit"
MODEL_PUBLISH = "model:publish"
REPORT_PREPARE = "report:prepare"
REPORT_PUBLISH = "report:publish"
CONTENT_PREPARE = "content:prepare"
CONTENT_PUBLISH = "content:publish"
AUDIT_VIEW = "audit:view"
ACCOUNT_MANAGE = "account:manage"
ROLE_MANAGE = "role:manage"

# Prepare, upload, and view. No publish and no account admin.
STAFF_PERMISSIONS = {
    BARANGAY_VIEW_INTERNAL,
    BARANGAY_PREPARE,
    DATASET_UPLOAD,
    DATASET_SUBMIT,
    MODEL_VIEW,
    MODEL_SUBMIT,
    REPORT_PREPARE,
    CONTENT_PREPARE,
}

# Everything staff has, plus the publish and admin actions.
ADMIN_PERMISSIONS = STAFF_PERMISSIONS | {
    BARANGAY_PUBLISH,
    DATASET_PUBLISH,
    MODEL_PUBLISH,
    REPORT_PUBLISH,
    CONTENT_PUBLISH,
    AUDIT_VIEW,
    ACCOUNT_MANAGE,
    ROLE_MANAGE,
}


# A copy of the set, so callers cannot mutate the constants above.
def permissions_for_role(role: str) -> set[str]:
    if role == ROLE_ADMIN:
        return set(ADMIN_PERMISSIONS)
    if role == ROLE_STAFF:
        return set(STAFF_PERMISSIONS)
    return set()


def has_permission(role: str, permission: str) -> bool:
    return permission in permissions_for_role(role)
