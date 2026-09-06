from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.auth import AuthResponse, LoginRequest, MessageResponse, TokenResponse
from app.security import REFRESH_COOKIE_NAME
from app.services.audit_service import record_audit_log
from app.services.auth_service import (
    clear_refresh_cookie,
    login_administrator,
    refresh_admin_session,
)

router = APIRouter(prefix="/admin/auth", tags=["admin-auth"])


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
        record_audit_log(
            db,
            action="admin_login_success",
            actor_email=administrator.email,
        )
        return AuthResponse(access_token=access_token, administrator=administrator)
    except Exception:
        record_audit_log(
            db,
            action="admin_login_failed",
            actor_email=str(payload.email),
        )
        raise


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


@router.post("/logout", response_model=MessageResponse)
def admin_logout(response: Response) -> MessageResponse:
    clear_refresh_cookie(response)
    return MessageResponse(message="Logged out successfully.")
