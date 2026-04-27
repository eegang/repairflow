from fastapi import APIRouter, Depends

from app.db.database import get_db_facade
from app.db.facade import DatabaseFacade
from app.core.dependencies import get_current_user
from app.domain.models import Role, User
from app.domain.schemas import UserOut

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[UserOut])
async def get_users(
    current_user: User = Depends(get_current_user),
    db: DatabaseFacade = Depends(get_db_facade),
):
    if current_user.role == Role.technician:
        return await db.list_users(only_user_id=current_user.id)
    return await db.list_users()


@router.get("/technicians", response_model=list[UserOut])
async def get_technicians(
    current_user: User = Depends(get_current_user),
    db: DatabaseFacade = Depends(get_db_facade),
):
    return await db.list_active_technicians()

