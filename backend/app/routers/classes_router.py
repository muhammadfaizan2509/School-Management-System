from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.auth import get_current_user, require_role
from app import models, schemas

router = APIRouter(prefix="/api", tags=["Classes & Subjects"])

@router.get("/classes", response_model=List[schemas.ClassResponse])
def get_classes(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    classes = db.query(models.Class).all()
    res = []
    for c in classes:
        res.append({
            "id": c.id,
            "name": c.name,
            "grade_level": c.grade_level,
            "section": c.section,
            "room_number": c.room_number,
            "class_teacher_id": c.class_teacher_id,
            "class_teacher_name": c.class_teacher.full_name if c.class_teacher else "Unassigned",
            "student_count": len(c.students),
            "subject_count": len(c.subjects)
        })
    return res

@router.post("/classes", response_model=schemas.ClassResponse)
def create_class(
    class_in: schemas.ClassCreate,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(require_role(["admin"]))
):
    new_class = models.Class(
        name=class_in.name,
        grade_level=class_in.grade_level,
        section=class_in.section,
        room_number=class_in.room_number,
        class_teacher_id=class_in.class_teacher_id
    )
    db.add(new_class)
    db.commit()
    db.refresh(new_class)
    return {
        "id": new_class.id,
        "name": new_class.name,
        "grade_level": new_class.grade_level,
        "section": new_class.section,
        "room_number": new_class.room_number,
        "class_teacher_id": new_class.class_teacher_id,
        "class_teacher_name": new_class.class_teacher.full_name if new_class.class_teacher else "Unassigned",
        "student_count": 0,
        "subject_count": 0
    }

@router.get("/subjects", response_model=List[schemas.SubjectResponse])
def get_subjects(
    class_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.Subject)
    if class_id:
        query = query.filter(models.Subject.class_id == class_id)
    subjects = query.all()
    res = []
    for s in subjects:
        res.append({
            "id": s.id,
            "name": s.name,
            "code": s.code,
            "class_id": s.class_id,
            "class_name": f"{s.school_class.name} - {s.school_class.section}" if s.school_class else "N/A",
            "teacher_id": s.teacher_id,
            "teacher_name": s.teacher.full_name if s.teacher else "Unassigned"
        })
    return res

@router.post("/subjects", response_model=schemas.SubjectResponse)
def create_subject(
    subj_in: schemas.SubjectCreate,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(require_role(["admin", "teacher"]))
):
    new_subj = models.Subject(
        name=subj_in.name,
        code=subj_in.code,
        class_id=subj_in.class_id,
        teacher_id=subj_in.teacher_id
    )
    db.add(new_subj)
    db.commit()
    db.refresh(new_subj)
    return {
        "id": new_subj.id,
        "name": new_subj.name,
        "code": new_subj.code,
        "class_id": new_subj.class_id,
        "class_name": f"{new_subj.school_class.name} - {new_subj.school_class.section}" if new_subj.school_class else "N/A",
        "teacher_id": new_subj.teacher_id,
        "teacher_name": new_subj.teacher.full_name if new_subj.teacher else "Unassigned"
    }
