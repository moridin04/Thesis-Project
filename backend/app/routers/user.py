# GET /auth/me for the email-based User model.
# It depends on require_active_user. That name is not defined in
# dependencies/auth.py, and main.py does not mount this router.
# Live sessions use Account through routers/auth.py, same /auth prefix.
# The body is UserPublic. The password hash is left off.

from typing import Annotated

from fastapi import APIRouter, Depends

from app.dependencies.auth import require_active_user
from app.models.user import User
from app.schemas.auth import UserPublic

router = APIRouter(prefix="/auth", tags=["auth-profile"])


# Return id, email, name, role, and is_active for the signed-in user.
# role is the enum value as a plain string.
@router.get("/me", response_model=UserPublic)
def read_current_user(
    current_user: Annotated[User, Depends(require_active_user)],
) -> UserPublic:
    return UserPublic(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role.value,
        is_active=current_user.is_active,
    )
