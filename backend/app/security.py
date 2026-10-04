# Passwords, usernames, and JWT access/refresh tokens.
# Routers never hash or decode tokens themselves; they call these
# helpers. Login errors use one generic sentence so we do not reveal
# whether the username or the password was wrong.
# Settings (secrets and lifetimes) come from config.py.

from __future__ import annotations

import re
from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import uuid4

import jwt
from pwdlib import PasswordHash

from app.config import get_settings

settings = get_settings()
# recommended() picks the hasher pwdlib suggests. We store only its output.
password_hasher = PasswordHash.recommended()

# Refresh token cookie. Path limits it to the auth routes.
REFRESH_COOKIE_NAME = "agos_refresh_token"
REFRESH_COOKIE_PATH = "/api/auth"
# Same text for a bad username and a bad password.
GENERIC_AUTH_ERROR = "Invalid username or password."
GENERIC_RATE_LIMIT_ERROR = "Too many attempts. Please try again later."
ROLE_STAFF = "staff"
ROLE_ADMIN = "admin"
VALID_ROLES = {ROLE_STAFF, ROLE_ADMIN}

# 3 to 32 chars: one starting character, then 2 to 31 more.
USERNAME_PATTERN = re.compile(r"^[a-z0-9][a-z0-9._-]{2,31}$")


# Strip and lowercase so "Ada" and "ada" are the same username.
def normalize_username(username: str) -> str:
    return username.strip().lower()


# Returns the normalized username, or raises ValueError if it is an
# email, has a space, or fails USERNAME_PATTERN.
def validate_username(username: str) -> str:
    normalized = normalize_username(username)
    if "@" in normalized or " " in username.strip():
        raise ValueError("Invalid username format.")
    if not USERNAME_PATTERN.match(normalized):
        raise ValueError(
            "Username must be 3-32 characters, start with a letter or number, "
            "and contain only lowercase letters, numbers, underscores, periods, or hyphens."
        )
    return normalized


# Length check only: 12 to 128 characters. No extra complexity rules.
def validate_password_strength(password: str) -> str:
    if len(password) < 12 or len(password) > 128:
        raise ValueError("Password must be between 12 and 128 characters.")
    return password


# One-way hash for the accounts.password_hash column.
def hash_password(password: str) -> str:
    return password_hasher.hash(password)


# True when the typed password matches the stored hash.
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return password_hasher.verify(plain_password, hashed_password)


# Shared token builder. Access and refresh use different secrets so one
# cannot be presented as the other. jti makes each token unique; we do
# not look it up later to revoke tokens.
def _create_token(
    *,
    subject: str,
    role: str,
    token_type: str,
    secret: str,
    expires_delta: timedelta,
) -> str:
    now = datetime.now(timezone.utc)
    payload: dict[str, Any] = {
        "sub": subject,
        "role": role,
        "type": token_type,
        "iat": now,
        "exp": now + expires_delta,
        "jti": str(uuid4()),
    }
    return jwt.encode(payload, secret, algorithm="HS256")


# Short-lived token the client sends as Authorization: Bearer.
def create_access_token(*, account_id: int, role: str) -> str:
    return _create_token(
        subject=str(account_id),
        role=role,
        token_type="access",
        secret=settings.jwt_access_secret,
        expires_delta=timedelta(minutes=settings.access_token_expire_minutes),
    )


# Longer token, stored in the refresh cookie, used only to mint a new access token.
def create_refresh_token(*, account_id: int, role: str) -> str:
    return _create_token(
        subject=str(account_id),
        role=role,
        token_type="refresh",
        secret=settings.jwt_refresh_secret,
        expires_delta=timedelta(days=settings.refresh_token_expire_days),
    )


# Decode a Bearer token. Rejects refresh tokens and unknown roles.
def decode_access_token(token: str) -> dict[str, Any]:
    payload = jwt.decode(
        token,
        settings.jwt_access_secret,
        algorithms=["HS256"],
    )
    if payload.get("type") != "access":
        raise jwt.InvalidTokenError("Invalid access token type.")
    if payload.get("role") not in VALID_ROLES:
        raise jwt.InvalidTokenError("Invalid role claim.")
    return payload


# Decode the refresh cookie. Rejects access tokens and unknown roles.
def decode_refresh_token(token: str) -> dict[str, Any]:
    payload = jwt.decode(
        token,
        settings.jwt_refresh_secret,
        algorithms=["HS256"],
    )
    if payload.get("type") != "refresh":
        raise jwt.InvalidTokenError("Invalid refresh token type.")
    if payload.get("role") not in VALID_ROLES:
        raise jwt.InvalidTokenError("Invalid role claim.")
    return payload
