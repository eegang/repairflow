from __future__ import annotations

from sqlalchemy import Select, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domain.models import Attachment, AuditLog, Comment, Notification, RepairRequest, Role, User


class DatabaseFacade:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def execute(self, statement: Select):
        return await self.session.execute(statement)

    def add(self, entity: object) -> None:
        self.session.add(entity)

    async def flush(self) -> None:
        await self.session.flush()

    async def commit(self) -> None:
        await self.session.commit()

    async def refresh(self, entity: object, attribute_names: list[str] | None = None) -> None:
        await self.session.refresh(entity, attribute_names=attribute_names)

    async def get_user_by_id(self, user_id: str) -> User | None:
        result = await self.session.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def get_user_by_email(self, email: str) -> User | None:
        result = await self.session.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def get_active_managers(self) -> list[User]:
        result = await self.session.execute(
            select(User).where(User.role == Role.manager, User.is_active.is_(True))
        )
        return result.scalars().all()

    async def get_active_technician_by_id(self, technician_id: str) -> User | None:
        result = await self.session.execute(
            select(User).where(
                User.id == technician_id,
                User.role == Role.technician,
                User.is_active.is_(True),
            )
        )
        return result.scalar_one_or_none()

    async def get_request_by_id(self, request_id: str) -> RepairRequest | None:
        result = await self.session.execute(select(RepairRequest).where(RepairRequest.id == request_id))
        return result.scalar_one_or_none()

    async def get_request_detail_by_id(self, request_id: str) -> RepairRequest | None:
        result = await self.session.execute(
            select(RepairRequest)
            .where(RepairRequest.id == request_id)
            .options(
                selectinload(RepairRequest.attachments),
                selectinload(RepairRequest.comments).selectinload(Comment.author),
                selectinload(RepairRequest.audit_logs).selectinload(AuditLog.performer),
            )
        )
        return result.scalar_one_or_none()

    async def get_comments_for_request(self, request_id: str, include_internal: bool) -> list[Comment]:
        query = (
            select(Comment)
            .where(Comment.request_id == request_id)
            .options(selectinload(Comment.author))
            .order_by(Comment.created_at)
        )
        if not include_internal:
            query = query.where(Comment.is_internal.is_(False))

        result = await self.session.execute(query)
        return result.scalars().all()

    async def get_attachments_for_request(self, request_id: str) -> list[Attachment]:
        result = await self.session.execute(
            select(Attachment).where(Attachment.request_id == request_id).order_by(Attachment.created_at)
        )
        return result.scalars().all()

    async def get_audit_logs_for_request(self, request_id: str) -> list[AuditLog]:
        result = await self.session.execute(
            select(AuditLog)
            .where(AuditLog.request_id == request_id)
            .options(selectinload(AuditLog.performer))
            .order_by(AuditLog.created_at.desc())
        )
        return result.scalars().all()

    async def get_notifications_for_user(self, user_id: str) -> list[Notification]:
        result = await self.session.execute(
            select(Notification).where(Notification.user_id == user_id).order_by(Notification.created_at.desc())
        )
        return result.scalars().all()

    async def count_unread_notifications(self, user_id: str) -> int:
        result = await self.session.execute(
            select(func.count(Notification.id)).where(
                Notification.user_id == user_id,
                Notification.is_read.is_(False),
            )
        )
        return int(result.scalar() or 0)

    async def get_notification_for_user(self, notification_id: str, user_id: str) -> Notification | None:
        result = await self.session.execute(
            select(Notification).where(
                Notification.id == notification_id,
                Notification.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    async def mark_all_notifications_read(self, user_id: str) -> None:
        await self.session.execute(
            update(Notification)
            .where(Notification.user_id == user_id, Notification.is_read.is_(False))
            .values(is_read=True)
        )

    async def list_users(self, *, only_user_id: str | None = None) -> list[User]:
        query = select(User).order_by(User.created_at.desc())
        if only_user_id:
            query = query.where(User.id == only_user_id)

        result = await self.session.execute(query)
        return result.scalars().all()

    async def list_active_technicians(self) -> list[User]:
        result = await self.session.execute(
            select(User)
            .where(User.role == Role.technician, User.is_active.is_(True))
            .order_by(User.full_name.asc())
        )
        return result.scalars().all()
