from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.security import validate_password_strength, validate_username


class LoginRequest(BaseModel):
    # Only emptiness is checked here; format and length rules would leak via 422 details.
    username: str = Field(min_length=1)
    password: str = Field(min_length=1)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class AccountPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    full_name: str
    role: str
    is_active: bool
    last_login_at: Optional[datetime] = None


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    account: AccountPublic


class MessageResponse(BaseModel):
    message: str


class AccountCreateRequest(BaseModel):
    username: str
    full_name: str = Field(min_length=1, max_length=255)
    password: str
    role: str = Field(pattern="^(staff|admin)$")

    @field_validator("username")
    @classmethod
    def check_username(cls, value: str) -> str:
        return validate_username(value)

    @field_validator("password")
    @classmethod
    def check_password(cls, value: str) -> str:
        return validate_password_strength(value)


class AccountStatusUpdate(BaseModel):
    is_active: bool


class AccountRoleUpdate(BaseModel):
    role: str = Field(pattern="^(staff|admin)$")
