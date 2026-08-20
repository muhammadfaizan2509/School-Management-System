from fastapi import APIRouter, Depends, HTTPException, status, Query, File, UploadFile
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import uuid
import shutil
from app.database import get_db
from app.auth import get_current_user, require_role, get_password_hash, verify_password
from app import models, schemas

router = APIRouter(prefix="/api/users", tags=["Users"])

@router.get("", response_model=List[schemas.UserResponse])
def get_users(
    role: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.User)
    if role:
        query = query.filter(models.User.role == role)
    return query.all()

@router.get("/students", response_model=List[schemas.StudentProfileResponse])
def get_all_students(
    class_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.StudentDetail)
    if class_id:
        query = query.filter(models.StudentDetail.class_id == class_id)
    
    student_details = query.all()
    results = []
    for st in student_details:
        results.append({
            "id": st.id,
            "user_id": st.user_id,
            "roll_number": st.roll_number,
            "class_id": st.class_id,
            "class_name": f"{st.school_class.name} - {st.school_class.section}" if st.school_class else "Unassigned",
            "section": st.school_class.section if st.school_class else "-",
            "parent_name": st.parent.full_name if st.parent else "N/A",
            "date_of_birth": st.date_of_birth,
            "gender": st.gender,
            "address": st.address,
            "guardian_contact": st.guardian_contact or st.user.phone,
            "user_info": st.user
        })
    return results

@router.get("/student-profile/me", response_model=schemas.StudentProfileResponse)
def get_my_student_profile(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role == "student":
        st_detail = db.query(models.StudentDetail).filter(models.StudentDetail.user_id == current_user.id).first()
    elif current_user.role == "parent":
        st_detail = db.query(models.StudentDetail).filter(models.StudentDetail.parent_id == current_user.id).first()
        if not st_detail:
            st_detail = db.query(models.StudentDetail).first()
    else:
        st_detail = db.query(models.StudentDetail).first()
    
    if not st_detail:
        raise HTTPException(status_code=404, detail="Student profile record not found")

    return {
        "id": st_detail.id,
        "user_id": st_detail.user_id,
        "roll_number": st_detail.roll_number,
        "class_id": st_detail.class_id,
        "class_name": f"{st_detail.school_class.name} - {st_detail.school_class.section}" if st_detail.school_class else "Unassigned",
        "section": st_detail.school_class.section if st_detail.school_class else "-",
        "parent_name": st_detail.parent.full_name if st_detail.parent else "N/A",
        "date_of_birth": st_detail.date_of_birth,
        "gender": st_detail.gender,
        "address": st_detail.address,
        "guardian_contact": st_detail.guardian_contact or st_detail.user.phone,
        "user_info": st_detail.user
    }

def generate_unique_roll_number(db: Session) -> str:
    idx = 101
    while True:
        candidate = f"STU-{idx}"
        exists = db.query(models.StudentDetail).filter(models.StudentDetail.roll_number == candidate).first()
        if not exists:
            return candidate
        idx += 1

def generate_unique_employee_id(db: Session) -> str:
    idx = 101
    while True:
        candidate = f"EMP-{idx}"
        exists = db.query(models.TeacherDetail).filter(models.TeacherDetail.employee_id == candidate).first()
        if not exists:
            return candidate
        idx += 1

@router.post("", response_model=schemas.UserResponse)
def create_user(
    user_in: schemas.UserCreate,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(require_role(["admin"]))
):
    # Validate Username uniqueness
    existing_username = db.query(models.User).filter(models.User.username == user_in.username).first()
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    # Validate Email uniqueness
    existing_email = db.query(models.User).filter(models.User.email == user_in.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email address already registered")

    # Clean optional string fields
    clean_roll_number = user_in.roll_number.strip() if user_in.roll_number and user_in.roll_number.strip() else None
    clean_employee_id = user_in.employee_id.strip() if user_in.employee_id and user_in.employee_id.strip() else None
    clean_dob = user_in.date_of_birth.strip() if user_in.date_of_birth and user_in.date_of_birth.strip() else None
    clean_address = user_in.address.strip() if user_in.address and user_in.address.strip() else None
    clean_phone = user_in.phone.strip() if user_in.phone and user_in.phone.strip() else None

    # Role specific validation & defaults
    if user_in.role == "student":
        if clean_roll_number:
            existing_roll = db.query(models.StudentDetail).filter(models.StudentDetail.roll_number == clean_roll_number).first()
            if existing_roll:
                raise HTTPException(status_code=400, detail=f"Roll number '{clean_roll_number}' is already assigned to another student")
        else:
            clean_roll_number = generate_unique_roll_number(db)

    elif user_in.role == "teacher":
        if clean_employee_id:
            existing_emp = db.query(models.TeacherDetail).filter(models.TeacherDetail.employee_id == clean_employee_id).first()
            if existing_emp:
                raise HTTPException(status_code=400, detail=f"Employee ID '{clean_employee_id}' is already assigned to another teacher")
        else:
            clean_employee_id = generate_unique_employee_id(db)

    try:
        new_user = models.User(
            username=user_in.username,
            email=user_in.email,
            password_hash=get_password_hash(user_in.password),
            role=user_in.role,
            full_name=user_in.full_name,
            phone=clean_phone,
            avatar=f"https://api.dicebear.com/7.x/avataaars/svg?seed={user_in.username}",
            is_active=True
        )
        db.add(new_user)
        db.flush()  # Populates new_user.id within the transaction without committing yet

        if user_in.role == "student":
            st_detail = models.StudentDetail(
                user_id=new_user.id,
                roll_number=clean_roll_number,
                class_id=user_in.class_id,
                parent_id=user_in.parent_id,
                date_of_birth=clean_dob,
                gender=user_in.gender,
                address=clean_address,
                guardian_contact=clean_phone
            )
            db.add(st_detail)

        elif user_in.role == "teacher":
            t_detail = models.TeacherDetail(
                user_id=new_user.id,
                employee_id=clean_employee_id,
                qualification=user_in.qualification,
                specialization=user_in.specialization,
                joining_date="2026-01-01"
            )
            db.add(t_detail)

        db.commit()
        db.refresh(new_user)
        return new_user

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create user account: {str(e)}")

@router.put("/me", response_model=schemas.UserResponse)
def update_own_profile(
    user_update: schemas.UserUpdateSelf,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if user_update.full_name is not None:
        current_user.full_name = user_update.full_name.strip()
    if user_update.email is not None:
        new_email = user_update.email.strip()
        if new_email != current_user.email:
            existing = db.query(models.User).filter(models.User.email == new_email).first()
            if existing:
                raise HTTPException(status_code=400, detail="Email address is already in use")
            current_user.email = new_email
    if user_update.phone is not None:
        current_user.phone = user_update.phone.strip()
    if user_update.avatar is not None:
        current_user.avatar = user_update.avatar.strip()

    if current_user.role == "student":
        st_detail = db.query(models.StudentDetail).filter(models.StudentDetail.user_id == current_user.id).first()
        if st_detail:
            if user_update.date_of_birth is not None:
                st_detail.date_of_birth = user_update.date_of_birth.strip()
            if user_update.address is not None:
                st_detail.address = user_update.address.strip()
            if user_update.phone is not None:
                st_detail.guardian_contact = user_update.phone.strip()

    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/upload-avatar")
def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files (JPG, PNG, WEBP, GIF, SVG) are supported")

    ext = os.path.splitext(file.filename)[1].lower() if file.filename else ".png"
    if ext not in [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"]:
        ext = ".png"

    filename = f"avatar_{current_user.id}_{uuid.uuid4().hex[:8]}{ext}"
    upload_dir = os.path.join("uploads", "avatars")
    os.makedirs(upload_dir, exist_ok=True)
    filepath = os.path.join(upload_dir, filename)

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    avatar_url = f"http://127.0.0.1:8000/uploads/avatars/{filename}"
    current_user.avatar = avatar_url
    db.commit()
    db.refresh(current_user)

    return {"avatar_url": avatar_url, "filename": filename}

@router.post("/{user_id}/upload-avatar")
def upload_user_avatar(
    user_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(require_role(["admin"]))
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are supported")

    ext = os.path.splitext(file.filename)[1].lower() if file.filename else ".png"
    if ext not in [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"]:
        ext = ".png"

    filename = f"avatar_{user_id}_{uuid.uuid4().hex[:8]}{ext}"
    upload_dir = os.path.join("uploads", "avatars")
    os.makedirs(upload_dir, exist_ok=True)
    filepath = os.path.join(upload_dir, filename)

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    avatar_url = f"http://127.0.0.1:8000/uploads/avatars/{filename}"
    user.avatar = avatar_url
    db.commit()
    db.refresh(user)

    return {"avatar_url": avatar_url, "filename": filename, "user_id": user_id}

@router.post("/me/change-password")
def change_own_password(
    pwd_data: schemas.PasswordChange,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not verify_password(pwd_data.old_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(pwd_data.new_password) < 4:
        raise HTTPException(status_code=400, detail="New password must be at least 4 characters long")

    current_user.password_hash = get_password_hash(pwd_data.new_password)
    db.commit()
    return {"message": "Password changed successfully"}

@router.put("/{user_id}", response_model=schemas.UserResponse)
def admin_update_user(
    user_id: int,
    user_update: schemas.UserUpdateAdmin,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(require_role(["admin"]))
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user_update.full_name is not None:
        user.full_name = user_update.full_name.strip()
    if user_update.email is not None and user_update.email.strip() != user.email:
        existing = db.query(models.User).filter(models.User.email == user_update.email.strip()).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email address is already in use")
        user.email = user_update.email.strip()
    if user_update.phone is not None:
        user.phone = user_update.phone.strip()
    if user_update.avatar is not None:
        user.avatar = user_update.avatar.strip()
    if user_update.is_active is not None:
        user.is_active = user_update.is_active

    if user_update.role is not None:
        user.role = user_update.role

    if user.role == "student":
        st_detail = db.query(models.StudentDetail).filter(models.StudentDetail.user_id == user.id).first()
        if not st_detail:
            st_detail = models.StudentDetail(user_id=user.id, roll_number=f"STU-{user.id+100}")
            db.add(st_detail)

        if user_update.roll_number is not None:
            new_roll = user_update.roll_number.strip()
            if new_roll != st_detail.roll_number:
                existing_roll = db.query(models.StudentDetail).filter(models.StudentDetail.roll_number == new_roll).first()
                if existing_roll:
                    raise HTTPException(status_code=400, detail=f"Roll number '{new_roll}' is already in use")
                st_detail.roll_number = new_roll

        if user_update.class_id is not None:
            st_detail.class_id = user_update.class_id
        if user_update.date_of_birth is not None:
            st_detail.date_of_birth = user_update.date_of_birth.strip()
        if user_update.gender is not None:
            st_detail.gender = user_update.gender
        if user_update.address is not None:
            st_detail.address = user_update.address.strip()
        if user_update.phone is not None:
            st_detail.guardian_contact = user_update.phone.strip()

    elif user.role == "teacher":
        t_detail = db.query(models.TeacherDetail).filter(models.TeacherDetail.user_id == user.id).first()
        if not t_detail:
            t_detail = models.TeacherDetail(user_id=user.id, employee_id=f"EMP-{user.id+100}")
            db.add(t_detail)

        if user_update.employee_id is not None:
            new_emp = user_update.employee_id.strip()
            if new_emp != t_detail.employee_id:
                existing_emp = db.query(models.TeacherDetail).filter(models.TeacherDetail.employee_id == new_emp).first()
                if existing_emp:
                    raise HTTPException(status_code=400, detail=f"Employee ID '{new_emp}' is already in use")
                t_detail.employee_id = new_emp

        if user_update.qualification is not None:
            t_detail.qualification = user_update.qualification.strip()
        if user_update.specialization is not None:
            t_detail.specialization = user_update.specialization.strip()

    db.commit()
    db.refresh(user)
    return user

@router.post("/request-password-reset")
def request_password_reset(
    req_data: schemas.PasswordResetRequestCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Check if pending request exists
    existing = db.query(models.PasswordResetRequest).filter(
        models.PasswordResetRequest.user_id == current_user.id,
        models.PasswordResetRequest.status == "pending"
    ).first()

    if existing:
        return {"message": "Password reset request is already pending review by Administrator."}

    new_req = models.PasswordResetRequest(
        user_id=current_user.id,
        reason=req_data.reason or "User requested password reset from profile settings",
        status="pending"
    )
    db.add(new_req)
    db.commit()
    return {"message": "Password reset request submitted successfully to Administrator."}

@router.get("/password-reset-requests", response_model=List[schemas.PasswordResetRequestResponse])
def get_password_reset_requests(
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(require_role(["admin"]))
):
    requests = db.query(models.PasswordResetRequest).order_by(models.PasswordResetRequest.created_at.desc()).all()
    results = []
    for r in requests:
        results.append({
            "id": r.id,
            "user_id": r.user_id,
            "username": r.user.username if r.user else "Unknown",
            "full_name": r.user.full_name if r.user else "Unknown",
            "role": r.user.role if r.user else "Unknown",
            "reason": r.reason,
            "status": r.status,
            "created_at": r.created_at
        })
    return results

@router.post("/password-reset-requests/{request_id}/fulfill")
def fulfill_password_reset_request(
    request_id: int,
    pwd_data: schemas.PasswordResetAdmin,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(require_role(["admin"]))
):
    req = db.query(models.PasswordResetRequest).filter(models.PasswordResetRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Password reset request not found")

    user = db.query(models.User).filter(models.User.id == req.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found")

    if len(pwd_data.new_password) < 4:
        raise HTTPException(status_code=400, detail="New password must be at least 4 characters long")

    user.password_hash = get_password_hash(pwd_data.new_password)
    req.status = "fulfilled"
    db.commit()
    return {"message": f"Password for user '{user.username}' reset successfully and request marked fulfilled."}

@router.put("/{user_id}/reset-password")
def admin_reset_user_password(
    user_id: int,
    pwd_data: schemas.PasswordResetAdmin,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(require_role(["admin"]))
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if len(pwd_data.new_password) < 4:
        raise HTTPException(status_code=400, detail="Password must be at least 4 characters long")

    user.password_hash = get_password_hash(pwd_data.new_password)
    
    # Mark any pending reset request as fulfilled
    pending_reqs = db.query(models.PasswordResetRequest).filter(
        models.PasswordResetRequest.user_id == user_id,
        models.PasswordResetRequest.status == "pending"
    ).all()
    for pr in pending_reqs:
        pr.status = "fulfilled"

    db.commit()
    return {"message": f"Password for user '{user.username}' reset successfully"}

@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(require_role(["admin"]))
):
    if user_id == admin_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Safety constraint: You cannot delete your own logged-in administrator account."
        )

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found")

    try:
        # 1. Unlink teacher references in classes and subjects
        db.query(models.Class).filter(models.Class.class_teacher_id == user_id).update({"class_teacher_id": None})
        db.query(models.Subject).filter(models.Subject.teacher_id == user_id).update({"teacher_id": None})

        # 2. Unlink parent references in student_details
        db.query(models.StudentDetail).filter(models.StudentDetail.parent_id == user_id).update({"parent_id": None})

        # 3. Delete password reset requests for this user
        db.query(models.PasswordResetRequest).filter(models.PasswordResetRequest.user_id == user_id).delete()

        # 4. Delete the User record (ORM cascade automatically deletes student_profile, teacher_profile, attendances, grades, fee_invoices, notices_posted)
        db.delete(user)
        db.commit()
        return {"message": "User deleted successfully", "user_id": user_id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete user account: {str(e)}")

