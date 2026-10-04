# Login, refresh, logout, and the current account, under /api/auth.
# The access token is in the JSON body. The refresh token is an HttpOnly
# cookie set by auth_service, so page scripts cannot read it.
# Failed and successful logins are written to the audit log by username.
# That log has no IP or browser column. Live roles are staff and admin.

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import require_active_account
from app.models.account import Account
from app.schemas.auth import (
    AccountPublic,
    AuthResponse,
    LoginRequest,
    MessageResponse,
    TokenResponse,
)
from app.security import REFRESH_COOKIE_NAME
from app.services.audit_service import record_audit_log
from app.services.auth_service import (
    LoginFailed,
    clear_refresh_cookie,
    login_account,
    refresh_session,
)

router = APIRouter(prefix="/auth", tags=["auth"])


# Check the password, set the refresh cookie, and return the access token.
# A failure is audited with a server-side reason, then re-raised. The client
# still sees the generic error from LoginFailed, not that reason.
@router.post("/login", response_model=AuthResponse)
def login(
    payload: LoginRequest,
    response: Response,
    db: Annotated[Session, Depends(get_db)],
) -> AuthResponse:
    try:
        access_token, account = login_account(
            db,
            username=payload.username,
            password=payload.password,
            response=response,
        )
        record_audit_log(
            db,
            action="login_success",
            actor_username=account.username,
        )
        return AuthResponse(access_token=access_token, account=account)
    except LoginFailed as exc:
        record_audit_log(
            db,
            action="login_failed",
            actor_username=payload.username.strip().lower()[:32],
            details=exc.reason,
        )
        raise


# Mint a new access token from the refresh cookie, and rotate that cookie.
@router.post("/refresh", response_model=TokenResponse)
def refresh(
    request: Request,
    response: Response,
    db: Annotated[Session, Depends(get_db)],
) -> TokenResponse:
    refresh_token = request.cookies.get(REFRESH_COOKIE_NAME)
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated.",
        )
    access_token, _account = refresh_session(
        db,
        refresh_token=refresh_token,
        response=response,
    )
    return TokenResponse(access_token=access_token)


# Drop the refresh cookie. The access token is left to expire on its own.
@router.post("/logout", response_model=MessageResponse)
def logout(response: Response) -> MessageResponse:
    clear_refresh_cookie(response)
    return MessageResponse(message="Logged out successfully.")


# The signed-in account, without the password hash. 401 or 403 if not active.
@router.get("/me", response_model=AccountPublic)
def me(
    current_account: Annotated[Account, Depends(require_active_account)],
) -> AccountPublic:
    return AccountPublic(
        id=current_account.id,
        username=current_account.username,
        full_name=current_account.full_name,
        role=current_account.role,
        is_active=current_account.is_active,
        last_login_at=current_account.last_login_at,
    )
