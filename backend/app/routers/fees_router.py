from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app.auth import get_current_user, require_role
from app import models, schemas

router = APIRouter(prefix="/api/fees", tags=["Fee Management"])

@router.get("", response_model=List[schemas.FeeInvoiceResponse])
def get_fee_invoices(
    student_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.FeeInvoice)

    if current_user.role == "student":
        query = query.filter(models.FeeInvoice.student_id == current_user.id)
    elif current_user.role == "parent":
        st_details = db.query(models.StudentDetail).filter(models.StudentDetail.parent_id == current_user.id).all()
        student_user_ids = [st.user_id for st in st_details]
        if not student_user_ids:
            # Fallback if no specific parent link, return invoices of first student
            first_st = db.query(models.StudentDetail).first()
            student_user_ids = [first_st.user_id] if first_st else []
        query = query.filter(models.FeeInvoice.student_id.in_(student_user_ids))
    elif student_id:
        query = query.filter(models.FeeInvoice.student_id == student_id)

    if status_filter:
        query = query.filter(models.FeeInvoice.status == status_filter)
    
    invoices = query.order_by(models.FeeInvoice.due_date.desc()).all()
    res = []
    for inv in invoices:
        st_detail = db.query(models.StudentDetail).filter(models.StudentDetail.user_id == inv.student_id).first()
        res.append({
            "id": inv.id,
            "student_id": inv.student_id,
            "student_name": inv.student.full_name if inv.student else "Unknown",
            "roll_number": st_detail.roll_number if st_detail else f"STU-{inv.student_id}",
            "class_name": f"{st_detail.school_class.name} - {st_detail.school_class.section}" if (st_detail and st_detail.school_class) else "N/A",
            "title": inv.title,
            "amount": inv.amount,
            "due_date": inv.due_date,
            "status": inv.status,
            "paid_date": inv.paid_date
        })
    return res

@router.post("", response_model=schemas.FeeInvoiceResponse)
def create_fee_invoice(
    invoice_in: schemas.FeeInvoiceCreate,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(require_role(["admin"]))
):
    new_inv = models.FeeInvoice(
        student_id=invoice_in.student_id,
        title=invoice_in.title,
        amount=invoice_in.amount,
        due_date=invoice_in.due_date,
        status="pending"
    )
    db.add(new_inv)
    db.commit()
    db.refresh(new_inv)

    st_detail = db.query(models.StudentDetail).filter(models.StudentDetail.user_id == new_inv.student_id).first()
    return {
        "id": new_inv.id,
        "student_id": new_inv.student_id,
        "student_name": new_inv.student.full_name if new_inv.student else "Unknown",
        "roll_number": st_detail.roll_number if st_detail else f"STU-{new_inv.student_id}",
        "class_name": f"{st_detail.school_class.name} - {st_detail.school_class.section}" if (st_detail and st_detail.school_class) else "N/A",
        "title": new_inv.title,
        "amount": new_inv.amount,
        "due_date": new_inv.due_date,
        "status": new_inv.status,
        "paid_date": new_inv.paid_date
    }

@router.put("/{invoice_id}", response_model=schemas.FeeInvoiceResponse)
def update_fee_invoice(
    invoice_id: int,
    invoice_update: schemas.FeeInvoiceUpdate,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(require_role(["admin"]))
):
    inv = db.query(models.FeeInvoice).filter(models.FeeInvoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")

    if invoice_update.student_id is not None:
        inv.student_id = invoice_update.student_id
    if invoice_update.title is not None:
        inv.title = invoice_update.title.strip()
    if invoice_update.amount is not None:
        inv.amount = invoice_update.amount
    if invoice_update.due_date is not None:
        inv.due_date = invoice_update.due_date.strip()
    if invoice_update.status is not None:
        inv.status = invoice_update.status.strip()
        if invoice_update.status == "paid" and not inv.paid_date:
            inv.paid_date = datetime.now().strftime("%Y-%m-%d")
        elif invoice_update.status != "paid":
            inv.paid_date = None

    db.commit()
    db.refresh(inv)

    st_detail = db.query(models.StudentDetail).filter(models.StudentDetail.user_id == inv.student_id).first()
    return {
        "id": inv.id,
        "student_id": inv.student_id,
        "student_name": inv.student.full_name if inv.student else "Unknown",
        "roll_number": st_detail.roll_number if st_detail else f"STU-{inv.student_id}",
        "class_name": f"{st_detail.school_class.name} - {st_detail.school_class.section}" if (st_detail and st_detail.school_class) else "N/A",
        "title": inv.title,
        "amount": inv.amount,
        "due_date": inv.due_date,
        "status": inv.status,
        "paid_date": inv.paid_date
    }

@router.delete("/{invoice_id}")
def delete_fee_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(require_role(["admin"]))
):
    inv = db.query(models.FeeInvoice).filter(models.FeeInvoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")

    db.delete(inv)
    db.commit()
    return {"message": "Fee invoice deleted successfully", "invoice_id": invoice_id}

@router.put("/{invoice_id}/pay")
def pay_fee_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators are authorized to process fee payments."
        )

    inv = db.query(models.FeeInvoice).filter(models.FeeInvoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    inv.status = "paid"
    inv.paid_date = datetime.now().strftime("%Y-%m-%d")
    db.commit()
    return {"message": "Invoice marked as PAID", "invoice_id": inv.id, "status": "paid", "paid_date": inv.paid_date}


@router.get("/my-invoices", response_model=List[schemas.FeeInvoiceResponse])
def get_my_invoices(
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

    invoices = db.query(models.FeeInvoice).filter(models.FeeInvoice.student_id == target_student_id).all()
    res = []
    for inv in invoices:
        st_detail = db.query(models.StudentDetail).filter(models.StudentDetail.user_id == inv.student_id).first()
        res.append({
            "id": inv.id,
            "student_id": inv.student_id,
            "student_name": inv.student.full_name if inv.student else "Unknown",
            "roll_number": st_detail.roll_number if st_detail else f"STU-{inv.student_id}",
            "class_name": f"{st_detail.school_class.name} - {st_detail.school_class.section}" if (st_detail and st_detail.school_class) else "N/A",
            "title": inv.title,
            "amount": inv.amount,
            "due_date": inv.due_date,
            "status": inv.status,
            "paid_date": inv.paid_date
        })
    return res
