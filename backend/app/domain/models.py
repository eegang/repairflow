from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Enum, Integer, Text
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime
import enum
import uuid


def generate_uuid():
    return str(uuid.uuid4())


Base = declarative_base()


class Role(enum.Enum):
    client = "client"
    manager = "manager"
    technician = "technician"


class Status(enum.Enum):
    new = "new"
    in_progress = "in_progress"
    paused = "paused"
    done = "done"


class NotificationType(enum.Enum):
    request_created = "request_created"
    technician_assigned = "technician_assigned"
    status_changed = "status_changed"
    comment_added = "comment_added"
    system = "system"


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, nullable=False, index=True)
    full_name = Column(String, nullable=False)
    company_name = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    password = Column(String, nullable=False)
    role = Column(Enum(Role), default=Role.client)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    audit_logs = relationship("AuditLog", back_populates="performer")
    comments = relationship("Comment", back_populates="author")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    assigned_requests = relationship(
        "RepairRequest",
        back_populates="technician",
        foreign_keys="RepairRequest.assigned_to",
    )
    owned_requests = relationship(
        "RepairRequest",
        back_populates="client",
        foreign_keys="RepairRequest.client_id",
    )


class RepairRequest(Base):
    __tablename__ = "repair_requests"

    id = Column(String, primary_key=True, default=generate_uuid)
    client_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    client_name = Column(String, nullable=True)
    machine_name = Column(String, nullable=False)
    machine_type = Column(String, nullable=False)
    serial_number = Column(String, nullable=True)
    description = Column(Text, nullable=False)
    contact_person = Column(String, nullable=False)
    status = Column(Enum(Status), default=Status.new, index=True)
    assigned_to = Column(String, ForeignKey("users.id"), nullable=True, index=True)
    assigned_technician_name = Column(String, nullable=True)
    internal_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    client = relationship("User", back_populates="owned_requests", foreign_keys=[client_id])
    technician = relationship("User", back_populates="assigned_requests", foreign_keys=[assigned_to])
    comments = relationship("Comment", back_populates="request", cascade="all, delete-orphan")
    attachments = relationship("Attachment", back_populates="request", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="request", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="request")


class Comment(Base):
    __tablename__ = "comments"

    id = Column(String, primary_key=True, default=generate_uuid)
    request_id = Column(String, ForeignKey("repair_requests.id", ondelete="CASCADE"), nullable=False, index=True)
    author_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    body = Column(Text, nullable=False)
    is_internal = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    author = relationship("User", back_populates="comments")
    request = relationship("RepairRequest", back_populates="comments")


class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(String, primary_key=True, default=generate_uuid)
    request_id = Column(String, ForeignKey("repair_requests.id", ondelete="CASCADE"), nullable=False, index=True)
    file_name = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)
    url = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    request = relationship("RepairRequest", back_populates="attachments")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    request_id = Column(String, ForeignKey("repair_requests.id", ondelete="CASCADE"), nullable=False, index=True)
    action = Column(String, nullable=False)
    old_status = Column(String, nullable=True)
    new_status = Column(String, nullable=True)
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    comment = Column(Text, nullable=True)
    performed_by = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    request = relationship("RepairRequest", back_populates="audit_logs")
    performer = relationship("User", back_populates="audit_logs")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(Enum(NotificationType), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    request_id = Column(String, ForeignKey("repair_requests.id"), nullable=True, index=True)
    is_read = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    user = relationship("User", back_populates="notifications")
    request = relationship("RepairRequest", back_populates="notifications")

