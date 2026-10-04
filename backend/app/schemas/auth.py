# Request and response bodies for login and for creating accounts.
# Login only checks that the fields are non-empty. Format rules run
# later, inside the auth route, so a 422 here cannot describe them.
# Password and username checks for new accounts call security.py.
# The login route is routers/auth.py.

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.security import validate_password_strength, validate_username


class LoginRequest(BaseModel):
    # Only emptiness is checked here; format and length rules would leak via 422 details.
    username: str = Field(min_length=1)
    password: str = Field(min_length=1)


# What we return after a token is issued. token_type is always "bearer".
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# Account fields the client may see. The hash stays on the server.
class AccountPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    full_name: str
    role: str
    is_active: bool
    last_login_at: Optional[datetime] = None


# Login success: the access token plus the account it belongs to.
class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    account: AccountPublic


# A one-line message, used when we do not want to return an account.
class MessageResponse(BaseModel):
    message: str


# Body for creating a staff or admin account. Role cannot be anything else.
class AccountCreateRequest(BaseModel):
    username: str
    full_name: str = Field(min_length=1, max_length=255)
    password: str
    role: str = Field(pattern="^(staff|admin)$")

    # Reuse the same username rules as security.py, then store the normalized form.
    @field_validator("username")
    @classmethod
    def check_username(cls, value: str) -> str:
        return validate_username(value)

    # Length only (12 to 128). We do not add extra character-class rules here.
    @field_validator("password")
    @classmethod
    def check_password(cls, value: str) -> str:
        return validate_password_strength(value)


# Turn an account on or off. This does not delete it.
class AccountStatusUpdate(BaseModel):
    is_active: bool


# Change staff <-> admin. The pattern rejects any other role string.
class AccountRoleUpdate(BaseModel):
    role: str = Field(pattern="^(staff|admin)$")
