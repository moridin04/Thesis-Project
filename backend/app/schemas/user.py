# Response shape for the email-based User model.
# The live account responses use schemas/auth.py AccountPublic instead.
# Password hash is left out. routers/user.py is the only caller, and
# that router is not mounted in main.py.

from pydantic import BaseModel, ConfigDict, EmailStr


class UserPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    full_name: str
    role: str
    is_active: bool
