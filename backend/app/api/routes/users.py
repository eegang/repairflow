from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.core.dependencies import get_current_user
from app.domain.models import Role, User
from app.domain.schemas import UserOut

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[UserOut])
async def get_users(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(User).order_by(User.created_at.desc())

    if current_user.role == Role.technician:
        query = query.where(User.id == current_user.id)

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/technicians", response_model=list[UserOut])
async def get_technicians(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User)
        .where(User.role == Role.technician, User.is_active.is_(True))
        .order_by(User.full_name.asc())
    )
    return result.scalars().all()

