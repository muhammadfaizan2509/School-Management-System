from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    user_id: int
    full_name: str
    username: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

# User Schemas
class UserLogin(BaseModel):
    username: str
    password: str

class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    role: str
    phone: Optional[str] = None
    avatar: Optional[str] = None
    is_active: Optional[bool] = True

class UserCreate(UserBase):
    password: str
    roll_number: Optional[str] = None
    class_id: Optional[int] = None
    employee_id: Optional[str] = None
    qualification: Optional[str] = None
    specialization: Optional[str] = None
    parent_id: Optional[int] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    address: Optional[str] = None

class UserUpdateSelf(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    avatar: Optional[str] = None
    date_of_birth: Optional[str] = None
    address: Optional[str] = None

class UserUpdateAdmin(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    avatar: Optional[str] = None
    is_active: Optional[bool] = None
    roll_number: Optional[str] = None
    class_id: Optional[int] = None
    employee_id: Optional[str] = None
    qualification: Optional[str] = None
    specialization: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    address: Optional[str] = None

class PasswordChange(BaseModel):
    old_password: str
    new_password: str

class PasswordResetAdmin(BaseModel):
    new_password: str

class PasswordResetRequestCreate(BaseModel):
    reason: Optional[str] = None

class PasswordResetRequestResponse(BaseModel):
    id: int
    user_id: int
    username: str
    full_name: str
    role: str
    reason: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class UserResponse(UserBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Student Detail Response
class StudentProfileResponse(BaseModel):
    id: int
    user_id: int
    roll_number: str
    class_id: Optional[int] = None
    class_name: Optional[str] = None
    section: Optional[str] = None
    parent_name: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    guardian_contact: Optional[str] = None
    user_info: UserResponse

    class Config:
        from_attributes = True

# Class & Subject Schemas
class ClassCreate(BaseModel):
    name: str
    grade_level: int
    section: str
    room_number: Optional[str] = None
    class_teacher_id: Optional[int] = None

class ClassResponse(BaseModel):
    id: int
    name: str
    grade_level: int
    section: str
    room_number: Optional[str] = None
    class_teacher_id: Optional[int] = None
    class_teacher_name: Optional[str] = None
    student_count: int = 0
    subject_count: int = 0

    class Config:
        from_attributes = True

class SubjectCreate(BaseModel):
    name: str
    code: str
    class_id: int
    teacher_id: Optional[int] = None

class SubjectResponse(BaseModel):
    id: int
    name: str
    code: str
    class_id: int
    class_name: Optional[str] = None
    teacher_id: Optional[int] = None
    teacher_name: Optional[str] = None

    class Config:
        from_attributes = True

# Attendance Schemas
class AttendanceCreate(BaseModel):
    student_id: int
    class_id: int
    date: str
    status: str
    remarks: Optional[str] = None

class BulkAttendanceItem(BaseModel):
    student_id: int
    status: str
    remarks: Optional[str] = None

class BulkAttendanceCreate(BaseModel):
    class_id: int
    date: str
    records: List[BulkAttendanceItem]

class AttendanceResponse(BaseModel):
    id: int
    student_id: int
    student_name: str
    roll_number: str
    class_id: int
    date: str
    status: str
    remarks: Optional[str] = None

    class Config:
        from_attributes = True

# Exam & Grade Schemas
class ExamCreate(BaseModel):
    title: str
    class_id: int
    subject_id: int
    exam_date: str
    max_marks: float = 100.0

class ExamResponse(BaseModel):
    id: int
    title: str
    class_id: int
    class_name: str
    subject_id: int
    subject_name: str
    exam_date: str
    max_marks: float

    class Config:
        from_attributes = True

class GradeCreate(BaseModel):
    exam_id: int
    student_id: int
    marks_obtained: float
    remarks: Optional[str] = None

class GradeResponse(BaseModel):
    id: int
    exam_id: int
    exam_title: str
    subject_name: str
    student_id: int
    student_name: str
    roll_number: str
    marks_obtained: float
    max_marks: float
    percentage: float
    grade_letter: str
    remarks: Optional[str] = None

    class Config:
        from_attributes = True

# Fee Invoice Schemas
class FeeInvoiceCreate(BaseModel):
    student_id: int
    title: str
    amount: float
    due_date: str

class FeeInvoiceUpdate(BaseModel):
    student_id: Optional[int] = None
    title: Optional[str] = None
    amount: Optional[float] = None
    due_date: Optional[str] = None
    status: Optional[str] = None

class FeeInvoiceResponse(BaseModel):
    id: int
    student_id: int
    student_name: str
    roll_number: str
    class_name: Optional[str] = None
    title: str
    amount: float
    due_date: str
    status: str
    paid_date: Optional[str] = None

    class Config:
        from_attributes = True

# Notice Schemas
class NoticeCreate(BaseModel):
    title: str
    content: str
    target_role: str = "all"
    priority: str = "normal"

class NoticeResponse(BaseModel):
    id: int
    title: str
    content: str
    target_role: str
    priority: str
    posted_by_id: int
    posted_by_name: str
    created_at: datetime

    class Config:
        from_attributes = True

# Dashboard Metrics Response Schema (supports role-based dashboards)
class DashboardMetrics(BaseModel):
    role: str
    # Admin overall metrics
    total_students: Optional[int] = 0
    total_teachers: Optional[int] = 0
    total_classes: Optional[int] = 0
    total_subjects: Optional[int] = 0
    today_attendance_percentage: Optional[float] = 0.0
    pending_fees_amount: Optional[float] = 0.0
    collected_fees_amount: Optional[float] = 0.0
    active_notices: Optional[int] = 0

    # User-specific metrics (student, parent, teacher)
    user_full_name: Optional[str] = None
    roll_number: Optional[str] = None
    class_name: Optional[str] = None
    my_attendance_percentage: Optional[float] = 0.0
    my_gpa: Optional[float] = 0.0
    my_pending_fees: Optional[float] = 0.0
    my_paid_fees: Optional[float] = 0.0
    total_exams: Optional[int] = 0
    my_classes_count: Optional[int] = 0
    my_students_taught: Optional[int] = 0

