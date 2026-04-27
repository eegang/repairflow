from fastapi import APIRouter, Depends, HTTPException, status

from app.db.database import get_db_facade
from app.db.facade import DatabaseFacade
from app.core.dependencies import get_current_user
from app.domain.models import Comment, User
from app.domain.schemas import CommentCreate, CommentOut
from app.services.services import (
    create_audit_log,
    ensure_request_access,
    get_request_or_404,
    notify_comment_participants,
)

router = APIRouter(prefix="/requests/{request_id}/comments", tags=["comments"])


@router.get("", response_model=list[CommentOut])
async def get_comments(
    request_id: str,
    current_user: User = Depends(get_current_user),
    db: DatabaseFacade = Depends(get_db_facade),
):
    request = await get_request_or_404(db, request_id)
    ensure_request_access(current_user, request)
    comments = await db.get_comments_for_request(
        request_id,
        include_internal=current_user.role.value != "client",
    )

    return [
        CommentOut(
            id=comment.id,
            request_id=comment.request_id,
            author=comment.author,
            body=comment.body,
            is_internal=comment.is_internal,
            created_at=comment.created_at,
        )
        for comment in comments
    ]


@router.post("", response_model=CommentOut, status_code=status.HTTP_201_CREATED)
async def create_comment(
    request_id: str,
    comment_data: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: DatabaseFacade = Depends(get_db_facade),
):
    request = await get_request_or_404(db, request_id)
    ensure_request_access(current_user, request)

    if comment_data.request_id != request_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Request ID mismatch")

    new_comment = Comment(
        request_id=request_id,
        author_id=current_user.id,
        body=comment_data.body,
        is_internal=bool(comment_data.is_internal and current_user.role.value != "client"),
    )
    db.add(new_comment)
    await db.flush()

    await create_audit_log(
        db,
        request_id=request_id,
        action="comment_added",
        performed_by=current_user.id,
    )
    await notify_comment_participants(
        db,
        request=request,
        author=current_user,
        is_internal=new_comment.is_internal,
    )

    await db.commit()
    await db.refresh(new_comment)
    await db.refresh(new_comment, attribute_names=["author"])

    return CommentOut(
        id=new_comment.id,
        request_id=new_comment.request_id,
        author=new_comment.author,
        body=new_comment.body,
        is_internal=new_comment.is_internal,
        created_at=new_comment.created_at,
    )

