# Response shape for the older Administrator model.
# It is not what the live admin routes return; those use AccountPublic.
# Kept so the email-based model in models/administrator.py still has
# a matching schema. The password hash is not included.

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, EmailStr


class AdministratorPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    full_name: str
    role: str
    is_active: bool
