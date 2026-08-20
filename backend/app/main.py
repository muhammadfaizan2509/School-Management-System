from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime

from app.config import settings
from app.database import engine, Base, get_db
from app.seed import seed_database
from app import models, schemas
from app.auth import get_current_user
from app.routers import (
    auth_router,
    users_router,
    classes_router,
    attendance_router,
    grades_router,
    fees_router,
    notices_router
)

# Initialize database tables
Base.metadata.create_all(bind=engine)

# Seed database on startup
db = Session(bind=engine)
try:
    seed_database(db)
finally:
    db.close()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="RESTful API Backend for School Management System"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import os
from fastapi.staticfiles import StaticFiles

# Ensure upload directory exists
os.makedirs("uploads/avatars", exist_ok=True)

# Include Routers
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.include_router(auth_router.router)
app.include_router(users_router.router)
app.include_router(classes_router.router)
app.include_router(attendance_router.router)
app.include_router(grades_router.router)
app.include_router(fees_router.router)
app.include_router(notices_router.router)

@app.get("/")
def read_root():
    return {
        "system": settings.PROJECT_NAME,
        "status": "online",
        "version": settings.PROJECT_VERSION,
        "docs_url": "/docs"
    }

@app.get("/api/dashboard/metrics", response_model=schemas.DashboardMetrics)
def get_dashboard_metrics(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role == "admin":
        total_students = db.query(models.User).filter(models.User.role == "student").count()
        total_teachers = db.query(models.User).filter(models.User.role == "teacher").count()
        total_classes = db.query(models.Class).count()
        total_subjects = db.query(models.Subject).count()

        today_str = datetime.now().strftime("%Y-%m-%d")
        today_atts = db.query(models.Attendance).filter(models.Attendance.date == today_str).all()
        if today_atts:
            present = sum(1 for a in today_atts if a.status in ["present", "late"])
            att_pct = round((present / len(today_atts)) * 100, 1)
        else:
            att_pct = 94.2

        pending_fees = db.query(models.FeeInvoice).filter(models.FeeInvoice.status.in_(["pending", "overdue"])).all()
        pending_sum = sum(inv.amount for inv in pending_fees)

        collected_fees = db.query(models.FeeInvoice).filter(models.FeeInvoice.status == "paid").all()
        collected_sum = sum(inv.amount for inv in collected_fees)

        active_notices_count = db.query(models.Notice).count()

        return {
            "role": "admin",
            "total_students": total_students,
            "total_teachers": total_teachers,
            "total_classes": total_classes,
            "total_subjects": total_subjects,
            "today_attendance_percentage": att_pct,
            "pending_fees_amount": pending_sum,
            "collected_fees_amount": collected_sum,
            "active_notices": active_notices_count
        }

    elif current_user.role in ["student", "parent"]:
        target_student_user_id = current_user.id
        if current_user.role == "parent":
            st_det = db.query(models.StudentDetail).filter(models.StudentDetail.parent_id == current_user.id).first()
            if not st_det:
                st_det = db.query(models.StudentDetail).first()
            target_student_user_id = st_det.user_id if st_det else current_user.id

        st_detail = db.query(models.StudentDetail).filter(models.StudentDetail.user_id == target_student_user_id).first()
        st_user = db.query(models.User).filter(models.User.id == target_student_user_id).first()

        # Attendance calculation
        atts = db.query(models.Attendance).filter(models.Attendance.student_id == target_student_user_id).all()
        if atts:
            pres = sum(1 for a in atts if a.status in ["present", "late"])
            my_att_pct = round((pres / len(atts)) * 100, 1)
        else:
            my_att_pct = 100.0

        # Fees calculation
        invoices = db.query(models.FeeInvoice).filter(models.FeeInvoice.student_id == target_student_user_id).all()
        my_pending = sum(i.amount for i in invoices if i.status in ["pending", "overdue"])
        my_paid = sum(i.amount for i in invoices if i.status == "paid")

        # Grades calculation
        grades = db.query(models.Grade).filter(models.Grade.student_id == target_student_user_id).all()
        total_exams = len(grades)
        if grades:
            avg_score = sum(g.marks_obtained / (g.exam.max_marks if g.exam else 100.0) for g in grades) / total_exams
            my_gpa = round(avg_score * 4.0, 2)
        else:
            my_gpa = 3.8

        active_notices_count = db.query(models.Notice).count()

        return {
            "role": current_user.role,
            "user_full_name": st_user.full_name if st_user else current_user.full_name,
            "roll_number": st_detail.roll_number if st_detail else f"STU-{target_student_user_id}",
            "class_name": f"{st_detail.school_class.name} - {st_detail.school_class.section}" if (st_detail and st_detail.school_class) else "Unassigned",
            "my_attendance_percentage": my_att_pct,
            "my_gpa": my_gpa,
            "my_pending_fees": my_pending,
            "my_paid_fees": my_paid,
            "total_exams": total_exams,
            "active_notices": active_notices_count
        }

    else:
        # Teacher role
        # Count classes teacher is assigned to
        t_classes = db.query(models.Class).filter(models.Class.class_teacher_id == current_user.id).all()
        class_ids = [c.id for c in t_classes]
        if class_ids:
            st_count = db.query(models.StudentDetail).filter(models.StudentDetail.class_id.in_(class_ids)).count()
            atts = db.query(models.Attendance).filter(models.Attendance.class_id.in_(class_ids)).all()
            if atts:
                pres = sum(1 for a in atts if a.status in ["present", "late"])
                att_pct = round((pres / len(atts)) * 100, 1)
            else:
                att_pct = 95.0
        else:
            st_count = db.query(models.StudentDetail).count()
            att_pct = 94.5

        active_notices_count = db.query(models.Notice).count()

        return {
            "role": "teacher",
            "my_classes_count": len(t_classes) if t_classes else db.query(models.Class).count(),
            "my_students_taught": st_count,
            "today_attendance_percentage": att_pct,
            "active_notices": active_notices_count
        }

