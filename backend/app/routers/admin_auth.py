# Login, refresh, and logout under the prefix /admin/auth.
# main.py does not include this router. Live login is routers/auth.py
# at /api/auth, and that one uses an Account username.
# These handlers call login_administrator and pass actor_email on the
# audit call. Audit rows still have no IP or user-agent column.

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.auth import AuthResponse, LoginRequest, MessageResponse, TokenResponse
# HttpOnly cookie name that holds the refresh token.
from app.security import REFRESH_COOKIE_NAME
from app.services.audit_service import record_audit_log
from app.services.auth_service import (
    clear_refresh_cookie,
    login_administrator,
    refresh_admin_session,
)

router = APIRouter(prefix="/admin/auth", tags=["admin-auth"])


# Try login with the email and password, and pass response so the helper
# can set the refresh cookie. The password is not copied into the audit call.
@router.post("/login", response_model=AuthResponse)
def admin_login(
    payload: LoginRequest,
    response: Response,
    db: Annotated[Session, Depends(get_db)],
) -> AuthResponse:
    try:
        access_token, administrator = login_administrator(
            db,
            email=payload.email,
            password=payload.password,
            response=response,
        )
        # Success row. The actor argument is the email. No IP is sent.
        record_audit_log(
            db,
            action="admin_login_success",
            actor_email=administrator.email,
        )
        return AuthResponse(access_token=access_token, administrator=administrator)
    except Exception:
        # Failure is recorded, then the original error is raised again.
        record_audit_log(
            db,
            action="admin_login_failed",
            actor_email=str(payload.email),
        )
        raise


# Read the refresh cookie and return a new access token.
# A missing cookie is 401. We do not accept the token from the body.
@router.post("/refresh", response_model=TokenResponse)
def admin_refresh(
    request: Request,
    response: Response,
    db: Annotated[Session, Depends(get_db)],
) -> TokenResponse:
    refresh_token = request.cookies.get(REFRESH_COOKIE_NAME)
    if not refresh_token:
        from fastapi import HTTPException, status

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated.",
        )

    access_token, _administrator = refresh_admin_session(
        db,
        refresh_token=refresh_token,
        response=response,
    )
    return TokenResponse(access_token=access_token)


# Clear the refresh cookie and return a short success message.
# This route does not check a bearer token and does not write an audit row.
@router.post("/logout", response_model=MessageResponse)
def admin_logout(response: Response) -> MessageResponse:
    clear_refresh_cookie(response)
    return MessageResponse(message="Logged out successfully.")
