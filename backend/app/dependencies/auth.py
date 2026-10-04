# FastAPI dependencies that turn a Bearer token into an Account.
# Routes ask for require_staff_or_admin, require_admin, or
# require_permission instead of reading the token themselves.
# A missing token, a bad token, and an unknown account all return
# 401 with the same "Not authenticated." text.

from __future__ import annotations

from typing import Annotated, Optional

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.account import Account
from app.permissions import has_permission
from app.security import ROLE_ADMIN, ROLE_STAFF, VALID_ROLES, decode_access_token

# auto_error=False so we can return our own 401 instead of FastAPI's default.
bearer_scheme = HTTPBearer(auto_error=False)


# Load the account named in the access token. Does not check is_active.
def get_current_account(
    db: Annotated[Session, Depends(get_db)],
    credentials: Annotated[
        Optional[HTTPAuthorizationCredentials], Depends(bearer_scheme)
    ],
) -> Account:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated.",
        )

    try:
        payload = decode_access_token(credentials.credentials)
        account_id = int(payload["sub"])
    except (jwt.PyJWTError, ValueError, TypeError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated.",
        ) from exc

    account = db.query(Account).filter(Account.id == account_id).first()
    if account is None or account.role not in VALID_ROLES:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated.",
        )
    return account


# Same as get_current_account, but 403 when the account was deactivated.
def require_active_account(
    current_account: Annotated[Account, Depends(get_current_account)],
) -> Account:
    if not current_account.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive account.",
        )
    return current_account


# Build a dependency that allows only the roles passed in.
def require_roles(*roles: str):
    allowed = set(roles)

    def dependency(
        current_account: Annotated[Account, Depends(require_active_account)],
    ) -> Account:
        if current_account.role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions.",
            )
        return current_account

    return dependency


require_staff_or_admin = require_roles(ROLE_STAFF, ROLE_ADMIN)
require_admin = require_roles(ROLE_ADMIN)


# Build a dependency that checks one permission name from permissions.py.
def require_permission(permission: str):
    def dependency(
        current_account: Annotated[Account, Depends(require_active_account)],
    ) -> Account:
        if not has_permission(current_account.role, permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions.",
            )
        return current_account

    return dependency
