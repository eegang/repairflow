import json
import os
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.db.database import get_db_facade
from app.db.facade import DatabaseFacade
from app.core.dependencies import get_current_user
from app.domain.models import Attachment, AuditLog, User
from app.domain.schemas import AttachmentOut, AuditLogOut
from app.services.services import create_audit_log, ensure_request_access, get_request_or_404

router = APIRouter(prefix="/requests/{request_id}", tags=["uploads", "audit"])

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


@router.post("/upload", response_model=AttachmentOut, status_code=status.HTTP_201_CREATED)
async def upload_file(
    request_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: DatabaseFacade = Depends(get_db_facade),
):
    request = await get_request_or_404(db, request_id)
    ensure_request_access(current_user, request)

    file_extension = os.path.splitext(file.filename)[1] if file.filename else ".bin"
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = UPLOAD_DIR / unique_filename

    content = await file.read()
    with open(file_path, "wb") as output:
        output.write(content)

    attachment = Attachment(
        request_id=request_id,
        file_name=file.filename or "unknown",
        file_type=file.content_type or "application/octet-stream",
        file_size=len(content),
        url=f"/uploads/{unique_filename}",
    )
    db.add(attachment)
    await db.flush()

    await create_audit_log(
        db,
        request_id=request_id,
        action="attachment_uploaded",
        performed_by=current_user.id,
        new_value=json.dumps({"file_name": attachment.file_name, "url": attachment.url}, ensure_ascii=False),
    )

    await db.commit()
    await db.refresh(attachment)
    return attachment


@router.get("/attachments", response_model=list[AttachmentOut])
async def get_attachments(
    request_id: str,
    current_user: User = Depends(get_current_user),
    db: DatabaseFacade = Depends(get_db_facade),
):
    request = await get_request_or_404(db, request_id)
    ensure_request_access(current_user, request)
    return await db.get_attachments_for_request(request_id)


@router.get("/audit", response_model=list[AuditLogOut])
async def get_audit_log(
    request_id: str,
    current_user: User = Depends(get_current_user),
    db: DatabaseFacade = Depends(get_db_facade),
):
    request = await get_request_or_404(db, request_id)
    ensure_request_access(current_user, request)
    logs = await db.get_audit_logs_for_request(request_id)

    return [
        AuditLogOut(
            id=log.id,
            request_id=log.request_id,
            actor=log.performer,
            action=log.action,
            old_status=log.old_status,
            new_status=log.new_status,
            old_value=log.old_value,
            new_value=log.new_value,
            comment=log.comment,
            created_at=log.created_at,
        )
        for log in logs
    ]


@router.get("/uploads/{filename}")
async def serve_file(filename: str):
    file_path = UPLOAD_DIR / filename

    if not file_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")

    from fastapi.responses import FileResponse

    return FileResponse(file_path, filename=filename)

