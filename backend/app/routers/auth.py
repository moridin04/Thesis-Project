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


@router.post("/logout", response_model=MessageResponse)
def logout(response: Response) -> MessageResponse:
    clear_refresh_cookie(response)
    return MessageResponse(message="Logged out successfully.")


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
