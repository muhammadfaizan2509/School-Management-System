from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.auth import get_current_user, require_role
from app import models, schemas

router = APIRouter(prefix="/api/notices", tags=["Notices & Announcements"])

@router.get("", response_model=List[schemas.NoticeResponse])
def get_notices(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.Notice)
    if current_user.role != "admin":
        query = query.filter(
            (models.Notice.target_role == "all") | (models.Notice.target_role == current_user.role)
        )
    notices = query.order_by(models.Notice.created_at.desc()).all()
    res = []
    for n in notices:
        res.append({
            "id": n.id,
            "title": n.title,
            "content": n.content,
            "target_role": n.target_role,
            "priority": n.priority,
            "posted_by_id": n.posted_by_id,
            "posted_by_name": n.posted_by.full_name if n.posted_by else "School Admin",
            "created_at": n.created_at
        })
    return res

@router.post("", response_model=schemas.NoticeResponse)
def create_notice(
    notice_in: schemas.NoticeCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["admin", "teacher"]))
):
    new_n = models.Notice(
        title=notice_in.title,
        content=notice_in.content,
        target_role=notice_in.target_role,
        priority=notice_in.priority,
        posted_by_id=current_user.id
    )
    db.add(new_n)
    db.commit()
    db.refresh(new_n)
    return {
        "id": new_n.id,
        "title": new_n.title,
        "content": new_n.content,
        "target_role": new_n.target_role,
        "priority": new_n.priority,
        "posted_by_id": new_n.posted_by_id,
        "posted_by_name": current_user.full_name,
        "created_at": new_n.created_at
    }

@router.delete("/{notice_id}")
def delete_notice(
    notice_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["admin"]))
):
    notice = db.query(models.Notice).filter(models.Notice.id == notice_id).first()
    if not notice:
        raise HTTPException(status_code=404, detail="Notice not found")
    db.delete(notice)
    db.commit()
    return {"message": "Notice deleted successfully"}
