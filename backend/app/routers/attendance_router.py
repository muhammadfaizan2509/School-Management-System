from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.auth import get_current_user, require_role
from app import models, schemas

router = APIRouter(prefix="/api/attendance", tags=["Attendance"])

@router.get("", response_model=List[schemas.AttendanceResponse])
def get_attendance(
    class_id: Optional[int] = None,
    date: Optional[str] = None,
    student_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.Attendance)
    if class_id:
        query = query.filter(models.Attendance.class_id == class_id)
    if date:
        query = query.filter(models.Attendance.date == date)
    if student_id:
        query = query.filter(models.Attendance.student_id == student_id)
    
    logs = query.order_by(models.Attendance.date.desc()).all()
    res = []
    for a in logs:
        st_detail = db.query(models.StudentDetail).filter(models.StudentDetail.user_id == a.student_id).first()
        res.append({
            "id": a.id,
            "student_id": a.student_id,
            "student_name": a.student.full_name if a.student else "Unknown",
            "roll_number": st_detail.roll_number if st_detail else f"STU-{a.student_id}",
            "class_id": a.class_id,
            "date": a.date,
            "status": a.status,
            "remarks": a.remarks
        })
    return res

@router.post("/bulk")
def record_bulk_attendance(
    payload: schemas.BulkAttendanceCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["admin", "teacher"]))
):
    # Upsert attendance records for class & date
    for item in payload.records:
        existing = db.query(models.Attendance).filter(
            models.Attendance.student_id == item.student_id,
            models.Attendance.class_id == payload.class_id,
            models.Attendance.date == payload.date
        ).first()

        if existing:
            existing.status = item.status
            existing.remarks = item.remarks
        else:
            new_att = models.Attendance(
                student_id=item.student_id,
                class_id=payload.class_id,
                date=payload.date,
                status=item.status,
                remarks=item.remarks
            )
            db.add(new_att)

    db.commit()
    return {"message": f"Successfully updated attendance for {len(payload.records)} students on {payload.date}"}

@router.get("/my-attendance")
def get_my_attendance(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    target_student_id = current_user.id
    if current_user.role == "parent":
        st_detail = db.query(models.StudentDetail).filter(models.StudentDetail.parent_id == current_user.id).first()
        if st_detail:
            target_student_id = st_detail.user_id
    elif current_user.role != "student":
        st_detail = db.query(models.StudentDetail).first()
        if st_detail:
            target_student_id = st_detail.user_id

    logs = db.query(models.Attendance).filter(
        models.Attendance.student_id == target_student_id
    ).order_by(models.Attendance.date.desc()).all()

    total = len(logs)
    present_cnt = sum(1 for a in logs if a.status == "present")
    absent_cnt = sum(1 for a in logs if a.status == "absent")
    late_cnt = sum(1 for a in logs if a.status == "late")
    excused_cnt = sum(1 for a in logs if a.status == "excused")
    pct = round((present_cnt + (late_cnt * 0.5)) / total * 100, 1) if total > 0 else 100.0

    formatted_records = [
        {
            "id": a.id,
            "date": a.date,
            "status": a.status,
            "remarks": a.remarks
        }
        for a in logs
    ]

    return {
        "student_id": target_student_id,
        "total_days": total,
        "present_days": present_cnt,
        "absent_days": absent_cnt,
        "late_days": late_cnt,
        "excused_days": excused_cnt,
        "attendance_percentage": pct,
        "history": formatted_records
    }
