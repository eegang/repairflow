from fastapi import APIRouter, Depends, HTTPException, status

from app.db.database import get_db_facade
from app.db.facade import DatabaseFacade
from app.core.dependencies import get_current_user
from app.domain.models import Notification, User
from app.domain.schemas import NotificationOut

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=list[NotificationOut])
async def get_notifications(
    current_user: User = Depends(get_current_user),
    db: DatabaseFacade = Depends(get_db_facade),
):
    return await db.get_notifications_for_user(current_user.id)


@router.get("/unread-count", response_model=int)
async def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: DatabaseFacade = Depends(get_db_facade),
):
    return await db.count_unread_notifications(current_user.id)


@router.post("/{notification_id}/read", response_model=NotificationOut)
async def mark_notification_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: DatabaseFacade = Depends(get_db_facade),
):
    notification = await db.get_notification_for_user(notification_id, current_user.id)
    if notification is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")

    notification.is_read = True
    await db.commit()
    await db.refresh(notification)
    return notification


@router.post("/read-all")
async def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: DatabaseFacade = Depends(get_db_facade),
):
    await db.mark_all_notifications_read(current_user.id)
    await db.commit()
    return {"success": True}

