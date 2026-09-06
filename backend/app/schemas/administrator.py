from __future__ import annotations

from pydantic import BaseModel, ConfigDict, EmailStr


class AdministratorPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    full_name: str
    role: str
    is_active: bool
