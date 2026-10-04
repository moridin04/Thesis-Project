# Password check, login rate limit, refresh cookie, and new accounts.
# Routers call these instead of talking to the hasher themselves.
# Failed logins share one error string. A separate reason is kept only
# for the audit log. The limit below is in memory and resets on restart.
# Tokens themselves are built in security.py.

from __future__ import annotations

import secrets
from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, Response, status
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.account import Account
from app.schemas.auth import AccountPublic
from app.security import (
    GENERIC_AUTH_ERROR,
    GENERIC_RATE_LIMIT_ERROR,
    REFRESH_COOKIE_NAME,
    REFRESH_COOKIE_PATH,
    ROLE_ADMIN,
    ROLE_STAFF,
    VALID_ROLES,
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    hash_password,
    normalize_username,
    validate_password_strength,
    validate_username,
    verify_password,
)

settings = get_settings()

_login_attempts: dict[str, deque[datetime]] = defaultdict(deque)
# 8 attempts per username inside 15 minutes. Older stamps are dropped.
LOGIN_RATE_LIMIT = 8
LOGIN_RATE_WINDOW = timedelta(minutes=15)
# No stored password can be this long (creation caps at 128), so longer input always fails.
MAX_LOGIN_PASSWORD_LENGTH = 1024
# Verified when the username is unknown so response time does not reveal whether it exists.
_DUMMY_PASSWORD_HASH = hash_password(secrets.token_urlsafe(32))


# The HTTP detail is generic. reason stays on the exception for the audit row.
class LoginFailed(HTTPException):
    """Login failure with a server-side reason for the audit log; the reason is never sent."""

    def __init__(self, status_code: int, detail: str, reason: str) -> None:
        super().__init__(status_code=status_code, detail=detail)
        self.reason = reason


# Account fields the client may see. The hash is not copied across.
def _serialize_account(account: Account) -> AccountPublic:
    return AccountPublic(
        id=account.id,
        username=account.username,
        full_name=account.full_name,
        role=account.role,
        is_active=account.is_active,
        last_login_at=account.last_login_at,
    )


# HttpOnly so scripts cannot read it. Path is /api/auth only.
def _set_refresh_cookie(response: Response, refresh_token: str) -> None:
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=refresh_token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        domain=settings.cookie_domain or None,
        max_age=settings.refresh_token_expire_days * 24 * 60 * 60,
        path=REFRESH_COOKIE_PATH,
    )


# Remove the refresh cookie. Logout uses this and does not touch the database.
def clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(
        key=REFRESH_COOKIE_NAME,
        path=REFRESH_COOKIE_PATH,
        domain=settings.cookie_domain or None,
    )


# Count this try. 429 when the username is already at the cap.
def _enforce_login_rate_limit(username: str) -> None:
    now = datetime.now(timezone.utc)
    attempts = _login_attempts[normalize_username(username)]
    while attempts and now - attempts[0] > LOGIN_RATE_WINDOW:
        attempts.popleft()
    if len(attempts) >= LOGIN_RATE_LIMIT:
        raise LoginFailed(
            status.HTTP_429_TOO_MANY_REQUESTS,
            GENERIC_RATE_LIMIT_ERROR,
            reason="rate_limited",
        )
    attempts.append(now)


# Return the account, or raise LoginFailed. Unknown users still run one
# hash check against a dummy so timing does not show whether the name exists.
def authenticate_account(
    db: Session,
    *,
    username: str,
    password: str,
) -> Account:
    normalized = normalize_username(username)
    account = db.query(Account).filter(Account.username == normalized).first() if normalized else None

    # Exactly one hash verification on every path keeps response times uniform.
    too_long = len(password) > MAX_LOGIN_PASSWORD_LENGTH
    candidate_hash = account.password_hash if account is not None and not too_long else _DUMMY_PASSWORD_HASH
    password_ok = verify_password(password[:MAX_LOGIN_PASSWORD_LENGTH], candidate_hash)

    if account is None:
        reason = "unknown_user"
    elif too_long or not password_ok:
        reason = "wrong_password"
    elif not account.is_active:
        reason = "inactive_account"
    elif account.role not in VALID_ROLES:
        reason = "invalid_role"
    else:
        return account
    raise LoginFailed(status.HTTP_401_UNAUTHORIZED, GENERIC_AUTH_ERROR, reason=reason)


# Rate-limit, check the password, stamp last_login_at, and issue both tokens.
def login_account(
    db: Session,
    *,
    username: str,
    password: str,
    response: Response,
) -> tuple[str, AccountPublic]:
    _enforce_login_rate_limit(username)
    account = authenticate_account(db, username=username, password=password)
    account.last_login_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(account)

    access_token = create_access_token(account_id=account.id, role=account.role)
    refresh_token = create_refresh_token(account_id=account.id, role=account.role)
    _set_refresh_cookie(response, refresh_token)
    return access_token, _serialize_account(account)


# New access token if the refresh cookie still matches an active account.
# The role in the token must still match the row. A new refresh cookie is set.
def refresh_session(
    db: Session,
    *,
    refresh_token: str,
    response: Response,
) -> tuple[str, AccountPublic]:
    try:
        payload = decode_refresh_token(refresh_token)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=GENERIC_AUTH_ERROR,
        ) from exc

    account_id = int(payload["sub"])
    account = db.query(Account).filter(Account.id == account_id).first()
    if (
        account is None
        or not account.is_active
        or account.role not in VALID_ROLES
        or account.role != payload.get("role")
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=GENERIC_AUTH_ERROR,
        )

    access_token = create_access_token(account_id=account.id, role=account.role)
    new_refresh = create_refresh_token(account_id=account.id, role=account.role)
    _set_refresh_cookie(response, new_refresh)
    return access_token, _serialize_account(account)


# Insert a staff or admin account. A duplicate username gets a vague 400
# so the message does not say that the name is already taken.
def create_account(
    db: Session,
    *,
    username: str,
    password: str,
    full_name: str,
    role: str,
) -> AccountPublic:
    if role not in VALID_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role.",
        )
    try:
        normalized = validate_username(username)
        validate_password_strength(password)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    existing = db.query(Account).filter(Account.username == normalized).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to create account with the provided details.",
        )

    account = Account(
        username=normalized,
        password_hash=hash_password(password),
        full_name=full_name.strip(),
        role=role,
        is_active=True,
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return _serialize_account(account)
