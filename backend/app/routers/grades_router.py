from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.auth import get_current_user, require_role
from app import models, schemas

router = APIRouter(prefix="/api", tags=["Exams & Grades"])

@router.get("/exams", response_model=List[schemas.ExamResponse])
def get_exams(
    class_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.Exam)
    if class_id:
        query = query.filter(models.Exam.class_id == class_id)
    exams = query.all()
    res = []
    for e in exams:
        res.append({
            "id": e.id,
            "title": e.title,
            "class_id": e.class_id,
            "class_name": f"{e.school_class.name} - {e.school_class.section}" if e.school_class else "N/A",
            "subject_id": e.subject_id,
            "subject_name": e.subject.name if e.subject else "N/A",
            "exam_date": e.exam_date,
            "max_marks": e.max_marks
        })
    return res

@router.post("/exams", response_model=schemas.ExamResponse)
def create_exam(
    exam_in: schemas.ExamCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role(["admin", "teacher"]))
):
    new_exam = models.Exam(
        title=exam_in.title,
        class_id=exam_in.class_id,
        subject_id=exam_in.subject_id,
        exam_date=exam_in.exam_date,
        max_marks=exam_in.max_marks
    )
    db.add(new_exam)
    db.commit()
    db.refresh(new_exam)
    return {
        "id": new_exam.id,
        "title": new_exam.title,
        "class_id": new_exam.class_id,
        "class_name": f"{new_exam.school_class.name} - {new_exam.school_class.section}" if new_exam.school_class else "N/A",
        "subject_id": new_exam.subject_id,
        "subject_name": new_exam.subject.name if new_exam.subject else "N/A",
        "exam_date": new_exam.exam_date,
        "max_marks": new_exam.max_marks
    }

@router.get("/grades", response_model=List[schemas.GradeResponse])
def get_grades(
    exam_id: Optional[int] = None,
    student_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.Grade)
    if exam_id:
        query = query.filter(models.Grade.exam_id == exam_id)
    if student_id:
        query = query.filter(models.Grade.student_id == student_id)
    
    grades = query.all()
    res = []
    for g in grades:
        st_detail = db.query(models.StudentDetail).filter(models.StudentDetail.user_id == g.student_id).first()
        max_m = g.exam.max_marks if g.exam else 100.0
        pct = round((g.marks_obtained / max_m) * 100, 1)
        res.append({
            "id": g.id,
            "exam_id": g.exam_id,
            "exam_title": g.exam.title if g.exam else "N/A",
            "subject_name": g.exam.subject.name if (g.exam and g.exam.subject) else "N/A",
            "student_id": g.student_id,
            "student_name": g.student.full_name if g.student else "Unknown",
            "roll_number": st_detail.roll_number if st_detail else f"STU-{g.student_id}",
            "marks_obtained": g.marks_obtained,
            "max_marks": max_m,
            "percentage": pct,
            "grade_letter": g.grade_letter or get_letter_grade(pct),
            "remarks": g.remarks
        })
    return res

@router.post("/grades", response_model=schemas.GradeResponse)
def create_or_update_grade(
    grade_in: schemas.GradeCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(require_role(["admin", "teacher"]))
):
    exam = db.query(models.Exam).filter(models.Exam.id == grade_in.exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    pct = (grade_in.marks_obtained / exam.max_marks) * 100.0
    grade_let = get_letter_grade(pct)

    existing = db.query(models.Grade).filter(
        models.Grade.exam_id == grade_in.exam_id,
        models.Grade.student_id == grade_in.student_id
    ).first()

    if existing:
        existing.marks_obtained = grade_in.marks_obtained
        existing.grade_letter = grade_let
        existing.remarks = grade_in.remarks
        db.commit()
        db.refresh(existing)
        target_g = existing
    else:
        new_g = models.Grade(
            exam_id=grade_in.exam_id,
            student_id=grade_in.student_id,
            marks_obtained=grade_in.marks_obtained,
            grade_letter=grade_let,
            remarks=grade_in.remarks
        )
        db.add(new_g)
        db.commit()
        db.refresh(new_g)
        target_g = new_g

    st_detail = db.query(models.StudentDetail).filter(models.StudentDetail.user_id == target_g.student_id).first()
    return {
        "id": target_g.id,
        "exam_id": target_g.exam_id,
        "exam_title": exam.title,
        "subject_name": exam.subject.name if exam.subject else "N/A",
        "student_id": target_g.student_id,
        "student_name": target_g.student.full_name if target_g.student else "Unknown",
        "roll_number": st_detail.roll_number if st_detail else f"STU-{target_g.student_id}",
        "marks_obtained": target_g.marks_obtained,
        "max_marks": exam.max_marks,
        "percentage": round(pct, 1),
        "grade_letter": grade_let,
        "remarks": target_g.remarks
    }

@router.get("/grades/my-grades")
def get_my_grades(
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

    grades = db.query(models.Grade).filter(models.Grade.student_id == target_student_id).all()
    
    total_points = 0.0
    count = 0
    formatted_grades = []

    for g in grades:
        max_m = g.exam.max_marks if g.exam else 100.0
        pct = round((g.marks_obtained / max_m) * 100, 1)
        gpa_val = percentage_to_gpa(pct)
        total_points += gpa_val
        count += 1

        formatted_grades.append({
            "id": g.id,
            "exam_title": g.exam.title if g.exam else "N/A",
            "subject_name": g.exam.subject.name if (g.exam and g.exam.subject) else "N/A",
            "exam_date": g.exam.exam_date if g.exam else "N/A",
            "marks_obtained": g.marks_obtained,
            "max_marks": max_m,
            "percentage": pct,
            "grade_letter": g.grade_letter or get_letter_grade(pct),
            "gpa": gpa_val,
            "remarks": g.remarks
        })

    cumulative_gpa = round(total_points / count, 2) if count > 0 else 4.0

    return {
        "student_id": target_student_id,
        "cumulative_gpa": cumulative_gpa,
        "total_exams": count,
        "report_card": formatted_grades
    }

def get_letter_grade(percentage: float) -> str:
    if percentage >= 90: return "A+"
    elif percentage >= 85: return "A"
    elif percentage >= 80: return "A-"
    elif percentage >= 75: return "B+"
    elif percentage >= 70: return "B"
    elif percentage >= 65: return "C+"
    elif percentage >= 60: return "C"
    elif percentage >= 50: return "D"
    else: return "F"

def percentage_to_gpa(pct: float) -> float:
    if pct >= 90: return 4.0
    elif pct >= 85: return 3.8
    elif pct >= 80: return 3.5
    elif pct >= 75: return 3.2
    elif pct >= 70: return 3.0
    elif pct >= 65: return 2.5
    elif pct >= 60: return 2.0
    elif pct >= 50: return 1.5
    else: return 0.0
