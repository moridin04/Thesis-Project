# Response shape for an account, without the password hash.
# Used when the API sends an account back to the client.
# The matching table is models/account.py. A similar class also
# exists in schemas/auth.py for the login response.

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


# from_attributes lets us build this straight from an Account row.
class AccountPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    full_name: str
    role: str
    is_active: bool
    last_login_at: Optional[datetime] = None
