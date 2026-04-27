from __future__ import annotations

from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.facade import DatabaseFacade
from app.domain.models import AuditLog, Notification, NotificationType, RepairRequest, Role, User


STATUS_TRANSITIONS: dict[str, list[str]] = {
    "new": ["in_progress"],
    "in_progress": ["paused", "done"],
    "paused": ["in_progress"],
    "done": [],
}


async def get_request_or_404(db: AsyncSession | DatabaseFacade, request_id: str) -> RepairRequest:
    if isinstance(db, DatabaseFacade):
        request = await db.get_request_by_id(request_id)
    else:
        result = await db.execute(select(RepairRequest).where(RepairRequest.id == request_id))
        request = result.scalar_one_or_none()
    if request is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    return request


def ensure_request_access(current_user: User, request: RepairRequest) -> None:
    role = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)

    if role == "client" and request.client_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    if role == "technician" and request.assigned_to != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")


async def create_notification(
    db: AsyncSession,
    *,
    user_id: str,
    type_: NotificationType,
    title: str,
    message: str,
    request_id: str | None = None,
) -> Notification:
    notification = Notification(
        user_id=user_id,
        type=type_,
        title=title,
        message=message,
        request_id=request_id,
    )
    db.add(notification)
    await db.flush()
    return notification


async def create_audit_log(
    db: AsyncSession,
    *,
    request_id: str,
    action: str,
    performed_by: str,
    old_status: str | None = None,
    new_status: str | None = None,
    old_value: str | None = None,
    new_value: str | None = None,
    comment: str | None = None,
) -> AuditLog:
    log = AuditLog(
        request_id=request_id,
        action=action,
        performed_by=performed_by,
        old_status=old_status,
        new_status=new_status,
        old_value=old_value,
        new_value=new_value,
        comment=comment,
    )
    db.add(log)
    await db.flush()
    return log


def validate_status_transition(current_status: str, new_status: str, comment: str | None = None) -> None:
    allowed = STATUS_TRANSITIONS.get(current_status, [])
    if new_status not in allowed:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status transition")

    if new_status == "paused" and not comment:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Pause comment is required")


async def notify_comment_participants(
    db: AsyncSession,
    *,
    request: RepairRequest,
    author: User,
    is_internal: bool,
) -> None:
    if is_internal:
        return

    participant_ids: set[str] = {request.client_id}
    if request.assigned_to:
        participant_ids.add(request.assigned_to)

    managers_result = await db.execute(select(User.id).where(User.role == Role.manager))
    participant_ids.update(managers_result.scalars().all())
    participant_ids.discard(author.id)

    for participant_id in participant_ids:
        await create_notification(
            db,
            user_id=participant_id,
            type_=NotificationType.comment_added,
            title="New comment",
            message=f"{author.full_name} added a comment to request '{request.machine_name}'",
            request_id=request.id,
        )


def count_statuses(items: list[tuple[str, int]]) -> dict[str, int]:
    counters = {"new": 0, "in_progress": 0, "paused": 0, "done": 0}
    for status_value, total in items:
        counters[status_value] = total
    return counters


def enum_value(value: Any) -> Any:
    return value.value if hasattr(value, "value") else value

