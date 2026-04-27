from pydantic import BaseModel, EmailStr
from typing import Optional, Any
from datetime import datetime
from enum import Enum


class RoleEnum(str, Enum):
    client = "client"
    manager = "manager"
    technician = "technician"


class StatusEnum(str, Enum):
    new = "new"
    in_progress = "in_progress"
    paused = "paused"
    done = "done"


# --- User schemas ---

class UserOut(BaseModel):
    id: str
    email: str
    full_name: str
    company_name: Optional[str] = None
    phone: Optional[str] = None
    role: RoleEnum
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    company_name: Optional[str] = None
    phone: Optional[str] = None
    role: RoleEnum = RoleEnum.client


# --- Auth schemas ---

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    user: UserOut
    token: str


# --- Request schemas ---

class RequestOut(BaseModel):
    id: str
    client_id: str
    client_name: Optional[str] = None
    machine_name: str
    machine_type: str
    serial_number: Optional[str] = None
    description: str
    contact_person: str
    status: StatusEnum
    assigned_to: Optional[str] = None
    assigned_technician_name: Optional[str] = None
    internal_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class RequestDetail(RequestOut):
    attachments: list["AttachmentOut"] = []
    comments: list["CommentOut"] = []
    audit_logs: list["AuditLogOut"] = []


class RequestCreate(BaseModel):
    client_id: str
    machine_name: str
    machine_type: str
    serial_number: Optional[str] = None
    description: str
    contact_person: str


class RequestUpdate(BaseModel):
    status: Optional[StatusEnum] = None
    assigned_to: Optional[str] = None
    assigned_technician_name: Optional[str] = None
    internal_notes: Optional[str] = None


class RequestAssign(BaseModel):
    technician_id: str


class RequestStatusUpdate(BaseModel):
    status: StatusEnum
    comment: Optional[str] = None


# --- Comment schemas ---

class CommentAuthor(BaseModel):
    id: str
    full_name: str
    role: RoleEnum

    model_config = {"from_attributes": True}


class CommentOut(BaseModel):
    id: str
    request_id: str
    author: CommentAuthor
    body: str
    is_internal: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class CommentCreate(BaseModel):
    request_id: str
    body: str
    is_internal: bool = False


# --- Attachment schemas ---

class AttachmentOut(BaseModel):
    id: str
    request_id: str
    file_name: str
    file_type: str
    file_size: int
    url: str
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Audit schemas ---

class AuditActor(BaseModel):
    full_name: str
    role: RoleEnum

    model_config = {"from_attributes": True}


class AuditLogOut(BaseModel):
    id: str
    request_id: str
    actor: AuditActor
    action: str
    old_status: Optional[str] = None
    new_status: Optional[str] = None
    old_value: Optional[Any] = None
    new_value: Optional[Any] = None
    comment: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class NotificationTypeEnum(str, Enum):
    request_created = "request_created"
    technician_assigned = "technician_assigned"
    status_changed = "status_changed"
    comment_added = "comment_added"
    system = "system"


class NotificationOut(BaseModel):
    id: str
    user_id: str
    type: NotificationTypeEnum
    title: str
    message: str
    request_id: Optional[str] = None
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class StatusStats(BaseModel):
    new: int
    in_progress: int
    paused: int
    done: int


# --- Pagination ---

class PaginationMeta(BaseModel):
    page: int
    limit: int
    total: int
    pages: int


class PaginatedResponse(BaseModel):
    data: list
    meta: PaginationMeta


RequestDetail.model_rebuild()

