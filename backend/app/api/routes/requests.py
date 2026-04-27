import json
import math

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select

from app.db.database import get_db_facade
from app.db.facade import DatabaseFacade
from app.core.dependencies import get_current_user
from app.domain.models import AuditLog, Comment, NotificationType, RepairRequest, Role, Status, User
from app.domain.schemas import (
    PaginatedResponse,
    PaginationMeta,
    RequestAssign,
    RequestCreate,
    RequestDetail,
    RequestOut,
    RequestStatusUpdate,
    RequestUpdate,
    StatusEnum,
    StatusStats,
)
from app.services.services import (
    count_statuses,
    create_audit_log,
    create_notification,
    ensure_request_access,
    get_request_or_404,
    validate_status_transition,
)

router = APIRouter(prefix="/requests", tags=["requests"])
@router.get("", response_model=PaginatedResponse)
async def get_requests(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: StatusEnum | None = None,
    search: str | None = None,
    sort: str = Query("created_at"),
    order: str = Query("desc", pattern="^(asc|desc)$"),
    client_id: str | None = None,
    assigned_to: str | None = None,
    current_user: User = Depends(get_current_user),
    db: DatabaseFacade = Depends(get_db_facade),
):
    query = select(RepairRequest)
    count_query = select(func.count(RepairRequest.id))

    if current_user.role == Role.client:
        query = query.where(RepairRequest.client_id == current_user.id)
        count_query = count_query.where(RepairRequest.client_id == current_user.id)
    elif current_user.role == Role.technician:
        query = query.where(RepairRequest.assigned_to == current_user.id)
        count_query = count_query.where(RepairRequest.assigned_to == current_user.id)
    else:
        if client_id:
            query = query.where(RepairRequest.client_id == client_id)
            count_query = count_query.where(RepairRequest.client_id == client_id)
        if assigned_to:
            query = query.where(RepairRequest.assigned_to == assigned_to)
            count_query = count_query.where(RepairRequest.assigned_to == assigned_to)

    if status:
        query = query.where(RepairRequest.status == Status(status.value))
        count_query = count_query.where(RepairRequest.status == Status(status.value))

    if search:
        search_filter = or_(
            RepairRequest.machine_name.ilike(f"%{search}%"),
            RepairRequest.description.ilike(f"%{search}%"),
            RepairRequest.serial_number.ilike(f"%{search}%"),
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    sort_column = getattr(RepairRequest, sort, RepairRequest.created_at)
    order_by = sort_column.asc() if order == "asc" else sort_column.desc()
    query = query.order_by(order_by).offset((page - 1) * limit).limit(limit)

    result = await db.execute(query)
    requests = result.scalars().all()

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    return PaginatedResponse(
        data=[RequestOut.model_validate(item) for item in requests],
        meta=PaginationMeta(
            page=page,
            limit=limit,
            total=total,
            pages=math.ceil(total / limit) if total else 0,
        ),
    )


@router.get("/stats", response_model=StatusStats)
async def get_request_stats(
    filter_id: str | None = None,
    filter_type: str | None = Query(None, pattern="^(client|technician)$"),
    current_user: User = Depends(get_current_user),
    db: DatabaseFacade = Depends(get_db_facade),
):
    query = select(RepairRequest.status, func.count(RepairRequest.id)).group_by(RepairRequest.status)

    if current_user.role == Role.client:
        query = query.where(RepairRequest.client_id == current_user.id)
    elif current_user.role == Role.technician:
        query = query.where(RepairRequest.assigned_to == current_user.id)
    elif filter_type == "client" and filter_id:
        query = query.where(RepairRequest.client_id == filter_id)
    elif filter_type == "technician" and filter_id:
        query = query.where(RepairRequest.assigned_to == filter_id)

    result = await db.execute(query)
    grouped = [(row[0].value if hasattr(row[0], "value") else row[0], row[1]) for row in result.all()]
    return StatusStats(**count_statuses(grouped))


@router.get("/{request_id}", response_model=RequestDetail)
async def get_request(
    request_id: str,
    current_user: User = Depends(get_current_user),
    db: DatabaseFacade = Depends(get_db_facade),
):
    request = await db.get_request_detail_by_id(request_id)

    if request is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")

    ensure_request_access(current_user, request)
    return RequestDetail(
        id=request.id,
        client_id=request.client_id,
        client_name=request.client_name,
        machine_name=request.machine_name,
        machine_type=request.machine_type,
        serial_number=request.serial_number,
        description=request.description,
        contact_person=request.contact_person,
        status=request.status,
        assigned_to=request.assigned_to,
        assigned_technician_name=request.assigned_technician_name,
        internal_notes=request.internal_notes,
        created_at=request.created_at,
        updated_at=request.updated_at,
        attachments=request.attachments,
        comments=[
            {
                "id": comment.id,
                "request_id": comment.request_id,
                "author": comment.author,
                "body": comment.body,
                "is_internal": comment.is_internal,
                "created_at": comment.created_at,
            }
            for comment in request.comments
        ],
        audit_logs=[
            {
                "id": log.id,
                "request_id": log.request_id,
                "actor": log.performer,
                "action": log.action,
                "old_status": log.old_status,
                "new_status": log.new_status,
                "old_value": log.old_value,
                "new_value": log.new_value,
                "comment": log.comment,
                "created_at": log.created_at,
            }
            for log in request.audit_logs
        ],
    )


@router.post("", response_model=RequestOut, status_code=status.HTTP_201_CREATED)
async def create_request(
    request_data: RequestCreate,
    current_user: User = Depends(get_current_user),
    db: DatabaseFacade = Depends(get_db_facade),
):
    new_request = RepairRequest(
        client_id=current_user.id,
        client_name=current_user.full_name,
        machine_name=request_data.machine_name,
        machine_type=request_data.machine_type,
        serial_number=request_data.serial_number,
        description=request_data.description,
        contact_person=request_data.contact_person,
        status=Status.new,
    )

    db.add(new_request)
    await db.flush()

    for manager in await db.get_active_managers():
        await create_notification(
            db,
            user_id=manager.id,
            type_=NotificationType.request_created,
            title="New request",
            message=f"{current_user.full_name} created request '{new_request.machine_name}'",
            request_id=new_request.id,
        )

    await db.commit()
    await db.refresh(new_request)
    return new_request


@router.patch("/{request_id}", response_model=RequestOut)
async def update_request(
    request_id: str,
    update_data: RequestUpdate,
    current_user: User = Depends(get_current_user),
    db: DatabaseFacade = Depends(get_db_facade),
):
    request = await get_request_or_404(db, request_id)
    ensure_request_access(current_user, request)

    if current_user.role == Role.client:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Clients cannot update requests")

    update_dict = update_data.model_dump(exclude_unset=True)
    if "status" in update_dict and update_dict["status"] is not None:
        update_dict["status"] = Status(update_dict["status"])

    old_values = {
        key: getattr(request, key)
        for key in update_dict.keys()
        if hasattr(request, key)
    }
    for field, value in update_dict.items():
        setattr(request, field, value)

    if update_dict:
        await create_audit_log(
            db,
            request_id=request.id,
            action="request_updated",
            performed_by=current_user.id,
            old_value=json.dumps({k: str(v) for k, v in old_values.items()}, ensure_ascii=False),
            new_value=json.dumps({k: str(getattr(request, k)) for k in update_dict.keys()}, ensure_ascii=False),
        )

    await db.commit()
    await db.refresh(request)
    return request


@router.post("/{request_id}/assign", response_model=RequestOut)
async def assign_technician(
    request_id: str,
    payload: RequestAssign,
    current_user: User = Depends(get_current_user),
    db: DatabaseFacade = Depends(get_db_facade),
):
    if current_user.role != Role.manager:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only managers can assign technicians")

    request = await get_request_or_404(db, request_id)

    technician = await db.get_active_technician_by_id(payload.technician_id)
    if technician is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Technician not found")

    previous_assignee = request.assigned_to
    request.assigned_to = technician.id
    request.assigned_technician_name = technician.full_name
    request.status = Status.in_progress

    await create_audit_log(
        db,
        request_id=request.id,
        action="assigned",
        performed_by=current_user.id,
        old_value=json.dumps({"assigned_to": previous_assignee}, ensure_ascii=False),
        new_value=json.dumps({"assigned_to": technician.id, "status": "in_progress"}, ensure_ascii=False),
    )
    await create_notification(
        db,
        user_id=technician.id,
        type_=NotificationType.technician_assigned,
        title="You were assigned to a request",
        message=f"You were assigned to '{request.machine_name}'",
        request_id=request.id,
    )

    await db.commit()
    await db.refresh(request)
    return request


@router.post("/{request_id}/status", response_model=RequestOut)
async def update_request_status(
    request_id: str,
    payload: RequestStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: DatabaseFacade = Depends(get_db_facade),
):
    request = await get_request_or_404(db, request_id)
    ensure_request_access(current_user, request)

    next_status = payload.status.value
    current_status = request.status.value if hasattr(request.status, "value") else str(request.status)
    validate_status_transition(current_status, next_status, payload.comment)

    request.status = Status(next_status)
    await create_audit_log(
        db,
        request_id=request.id,
        action="status_change",
        performed_by=current_user.id,
        old_status=current_status,
        new_status=next_status,
        comment=payload.comment,
    )
    await create_notification(
        db,
        user_id=request.client_id,
        type_=NotificationType.status_changed,
        title="Request status changed",
        message=f"Request '{request.machine_name}' moved to '{next_status}'",
        request_id=request.id,
    )

    await db.commit()
    await db.refresh(request)
    return request

