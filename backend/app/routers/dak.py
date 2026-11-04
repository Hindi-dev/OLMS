from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.database import get_db
from backend.app.models.dak import DakRecord, DakAction, DakAttachment
from backend.app.schemas.dak import (
    DakRecordCreate, DakRecordUpdate, DakRecordResponse,
    DakActionCreate, DakActionResponse, DakAttachmentResponse
)
from backend.app.config import UPLOAD_DIR
from backend.app.services.email_sync import (
    decode_mime_header, sanitize_filename, infer_department_from_email, get_next_dak_number
)
import email
from email.utils import parseaddr, parsedate_to_datetime
import shutil

router = APIRouter(prefix="/api/dak", tags=["Inward Dak & Task Tracker"])

@router.get("/", response_model=List[DakRecordResponse])
def get_all_dak(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(DakRecord)
    if status:
        query = query.filter(DakRecord.current_status == status)
    if priority:
        query = query.filter(DakRecord.priority == priority)
    if category:
        query = query.filter(DakRecord.category == category)
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            (DakRecord.subject_hi.ilike(search_fmt)) |
            (DakRecord.subject_en.ilike(search_fmt)) |
            (DakRecord.dak_unique_no.ilike(search_fmt)) |
            (DakRecord.sender_name.ilike(search_fmt))
        )
    return query.order_by(DakRecord.receipt_date.desc(), DakRecord.id.desc()).all()

@router.get("/stats/summary")
def get_dak_summary(db: Session = Depends(get_db)):
    total = db.query(func.count(DakRecord.id)).scalar() or 0
    pending = db.query(func.count(DakRecord.id)).filter(DakRecord.current_status == "Pending").scalar() or 0
    in_progress = db.query(func.count(DakRecord.id)).filter(DakRecord.current_status == "In Progress").scalar() or 0
    disposed = db.query(func.count(DakRecord.id)).filter(DakRecord.current_status.in_(["Disposed", "Dispatched"])).scalar() or 0
    urgent = db.query(func.count(DakRecord.id)).filter(
        DakRecord.priority.in_(["Urgent", "Immediate", "Top Priority"]),
        ~DakRecord.current_status.in_(["Disposed", "Dispatched"])
    ).scalar() or 0

    return {
        "total": total,
        "pending": pending,
        "in_progress": in_progress,
        "disposed": disposed,
        "urgent_unresolved": urgent
    }

@router.post("/", response_model=DakRecordResponse)
def create_dak(dak_in: DakRecordCreate, db: Session = Depends(get_db)):
    # Auto-generate unique Dak number if not provided
    if not dak_in.dak_unique_no:
        current_year = date.today().year
        count = db.query(func.count(DakRecord.id)).scalar() or 0
        dak_in.dak_unique_no = f"DAK/{current_year}/{count + 1:04d}"

    dak = DakRecord(**dak_in.model_dump())
    db.add(dak)
    db.commit()
    db.refresh(dak)
    return dak

@router.get("/{id}", response_model=DakRecordResponse)
def get_dak(id: int, db: Session = Depends(get_db)):
    dak = db.query(DakRecord).filter(DakRecord.id == id).first()
    if not dak:
        raise HTTPException(status_code=404, detail="Dak record not found")
    return dak

@router.put("/{id}", response_model=DakRecordResponse)
def update_dak(id: int, dak_up: DakRecordUpdate, db: Session = Depends(get_db)):
    dak = db.query(DakRecord).filter(DakRecord.id == id).first()
    if not dak:
        raise HTTPException(status_code=404, detail="Dak record not found")
    
    update_data = dak_up.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(dak, field, value)
        
    db.commit()
    db.refresh(dak)
    return dak

@router.delete("/{id}")
def delete_dak(id: int, db: Session = Depends(get_db)):
    dak = db.query(DakRecord).filter(DakRecord.id == id).first()
    if not dak:
        raise HTTPException(status_code=404, detail="Dak record not found")
    db.delete(dak)
    db.commit()
    return {"message": "Dak record deleted successfully"}

@router.post("/{id}/actions", response_model=DakActionResponse)
def add_dak_action(id: int, action_in: DakActionCreate, db: Session = Depends(get_db)):
    dak = db.query(DakRecord).filter(DakRecord.id == id).first()
    if not dak:
        raise HTTPException(status_code=404, detail="Dak record not found")
    
    action = DakAction(dak_id=id, **action_in.model_dump())
    dak.current_status = action_in.status_after_action
    
    db.add(action)
    db.commit()
    db.refresh(action)
    return action

@router.post("/{id}/attachments", response_model=DakAttachmentResponse)
def upload_dak_attachment(id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    dak = db.query(DakRecord).filter(DakRecord.id == id).first()
    if not dak:
        raise HTTPException(status_code=404, detail="Dak record not found")
    
    clean_filename = f"dak_{id}_{file.filename}"
    file_path = UPLOAD_DIR / clean_filename
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    attachment = DakAttachment(
        dak_id=id,
        original_filename=file.filename,
        stored_filepath=str(file_path),
        file_type=file.content_type,
        file_size_bytes=file_path.stat().st_size
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)
    return attachment
