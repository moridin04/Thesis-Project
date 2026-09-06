from typing import Annotated

from fastapi import APIRouter, Depends

from app.dependencies.auth import require_active_user
from app.models.user import User
from app.schemas.auth import UserPublic

router = APIRouter(prefix="/auth", tags=["auth-profile"])


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
