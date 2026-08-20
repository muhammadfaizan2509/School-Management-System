from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean, Date, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False, default="student")  # admin, teacher, student, parent
    full_name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    avatar = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    student_profile = relationship("StudentDetail", back_populates="user", uselist=False, foreign_keys="[StudentDetail.user_id]", cascade="all, delete-orphan")
    teacher_profile = relationship("TeacherDetail", back_populates="user", uselist=False, foreign_keys="[TeacherDetail.user_id]", cascade="all, delete-orphan")
    parent_students = relationship("StudentDetail", back_populates="parent", foreign_keys="[StudentDetail.parent_id]")
    
    attendances = relationship("Attendance", back_populates="student", foreign_keys="[Attendance.student_id]", cascade="all, delete-orphan")
    grades = relationship("Grade", back_populates="student", foreign_keys="[Grade.student_id]", cascade="all, delete-orphan")
    fee_invoices = relationship("FeeInvoice", back_populates="student", foreign_keys="[FeeInvoice.student_id]", cascade="all, delete-orphan")
    notices_posted = relationship("Notice", back_populates="posted_by", foreign_keys="[Notice.posted_by_id]", cascade="all, delete-orphan")


class Class(Base):
    __tablename__ = "classes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)  # e.g., "Grade 10"
    grade_level = Column(Integer, nullable=False) # e.g., 10
    section = Column(String, nullable=False) # e.g., "A"
    room_number = Column(String, nullable=True)
    class_teacher_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Relationships
    class_teacher = relationship("User", foreign_keys=[class_teacher_id])
    students = relationship("StudentDetail", back_populates="school_class")
    subjects = relationship("Subject", back_populates="school_class", cascade="all, delete-orphan")
    exams = relationship("Exam", back_populates="school_class", cascade="all, delete-orphan")


class StudentDetail(Base):
    __tablename__ = "student_details"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    roll_number = Column(String, unique=True, index=True, nullable=False)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=True)
    parent_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    date_of_birth = Column(String, nullable=True)
    gender = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    guardian_contact = Column(String, nullable=True)

    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="student_profile")
    parent = relationship("User", foreign_keys=[parent_id], back_populates="parent_students")
    school_class = relationship("Class", back_populates="students")


class TeacherDetail(Base):
    __tablename__ = "teacher_details"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    employee_id = Column(String, unique=True, index=True, nullable=False)
    qualification = Column(String, nullable=True)
    specialization = Column(String, nullable=True)
    joining_date = Column(String, nullable=True)

    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="teacher_profile")


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False) # e.g., "Mathematics"
    code = Column(String, nullable=False) # e.g., "MATH-101"
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Relationships
    school_class = relationship("Class", back_populates="subjects")
    teacher = relationship("User")
    exams = relationship("Exam", back_populates="subject", cascade="all, delete-orphan")


class Attendance(Base):
    __tablename__ = "attendances"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    date = Column(String, nullable=False) # YYYY-MM-DD
    status = Column(String, nullable=False) # present, absent, late, excused
    remarks = Column(String, nullable=True)

    # Relationships
    student = relationship("User", foreign_keys=[student_id], back_populates="attendances")
    school_class = relationship("Class")


class Exam(Base):
    __tablename__ = "exams"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False) # e.g. "Midterm Exam 2026"
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    exam_date = Column(String, nullable=False)
    max_marks = Column(Float, default=100.0)

    # Relationships
    school_class = relationship("Class", back_populates="exams")
    subject = relationship("Subject", back_populates="exams")
    grades = relationship("Grade", back_populates="exam", cascade="all, delete-orphan")


class Grade(Base):
    __tablename__ = "grades"

    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    marks_obtained = Column(Float, nullable=False)
    grade_letter = Column(String, nullable=True) # A+, A, B, C, F
    remarks = Column(String, nullable=True)

    # Relationships
    exam = relationship("Exam", back_populates="grades")
    student = relationship("User", foreign_keys=[student_id], back_populates="grades")


class FeeInvoice(Base):
    __tablename__ = "fee_invoices"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False) # e.g. "Fall 2026 Tuition Fee"
    amount = Column(Float, nullable=False)
    due_date = Column(String, nullable=False)
    status = Column(String, default="pending") # paid, pending, overdue
    paid_date = Column(String, nullable=True)

    # Relationships
    student = relationship("User", foreign_keys=[student_id], back_populates="fee_invoices")


class Notice(Base):
    __tablename__ = "notices"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    target_role = Column(String, default="all") # all, student, teacher, parent
    priority = Column(String, default="normal") # normal, high, urgent
    posted_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    posted_by = relationship("User", foreign_keys=[posted_by_id], back_populates="notices_posted")


class PasswordResetRequest(Base):
    __tablename__ = "password_reset_requests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    reason = Column(String, nullable=True)
    status = Column(String, default="pending")  # pending, fulfilled, rejected
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", foreign_keys=[user_id])

