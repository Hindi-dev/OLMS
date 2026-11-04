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

@router.post("/import-eml", response_model=DakRecordResponse)
async def import_dak_from_eml(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Imports an email (.eml / .msg) file directly into Inward Dak with attachments."""
    if not file.filename.lower().endswith(('.eml', '.msg', '.txt')):
        raise HTTPException(status_code=400, detail="कृपया .eml अथवा .msg प्रारूप की ईमेल फ़ाइल चुनें।")
    
    contents = await file.read()
    try:
        msg = email.message_from_bytes(contents)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"ईमेल फ़ाइल पढ़ने में त्रुटि: {str(e)}")
        
    raw_subject = msg.get("Subject", "ईमेल से आयातित डाक")
    subject = decode_mime_header(raw_subject) or file.filename
    
    from_header = msg.get("From", "")
    real_name, sender_email = parseaddr(from_header)
    sender_display = decode_mime_header(real_name) or sender_email or "सरकारी प्रेषक"
    sender_dept = infer_department_from_email(sender_email)
    
    date_header = msg.get("Date")
    letter_date_val = date.today()
    if date_header:
        try:
            parsed_dt = parsedate_to_datetime(date_header)
            if parsed_dt:
                letter_date_val = parsed_dt.date()
        except Exception:
            pass
            
    priority = "Normal"
    if any(w in subject.lower() for w in ["अति आवश्यक", "तत्काल", "urgent", "immediate", "top priority", "समय-सीमा"]):
        priority = "Urgent"
        
    body_parts = []
    attachments_to_save = []
    
    if msg.is_multipart():
        for part in msg.walk():
            ctype = part.get_content_type()
            cdisp = str(part.get("Content-Disposition", ""))
            fname = part.get_filename()
            if fname or "attachment" in cdisp.lower():
                clean_name = decode_mime_header(fname) or "संलग्नक"
                clean_name = sanitize_filename(clean_name)
                payload = part.get_payload(decode=True)
                if payload:
                    attachments_to_save.append((clean_name, payload, ctype))
            elif ctype == "text/plain" and "attachment" not in cdisp.lower():
                charset = part.get_content_charset() or "utf-8"
                try:
                    payload = part.get_payload(decode=True)
                    if payload:
                        body_parts.append(payload.decode(charset, errors="replace"))
                except Exception:
                    pass
    else:
        charset = msg.get_content_charset() or "utf-8"
        try:
            payload = msg.get_payload(decode=True)
            if payload:
                body_parts.append(payload.decode(charset, errors="replace"))
        except Exception:
            pass
            
    full_body = "\n".join(body_parts).strip()
    body_snippet = (full_body[:400] + "...") if len(full_body) > 400 else full_body
    notes = f"मूल प्रेषक: {sender_display} <{sender_email}>\nआयातित फ़ाइल: {file.filename}\n"
    if body_snippet:
        notes += f"\nईमेल सारांश:\n{body_snippet}\n"
    notes += "\n[स्रोत: .eml ईमेल फ़ाइल आयात]"
    
    dak_no = get_next_dak_number(db)
    dak = DakRecord(
        dak_unique_no=dak_no,
        receipt_date=date.today(),
        letter_no=f"EML/{date.today().strftime('%Y%m%d')}",
        letter_date=letter_date_val,
        sender_name=sender_display,
        sender_department=sender_dept,
        sender_region="A",
        subject_hi=subject,
        subject_en=None,
        category="General",
        priority=priority,
        current_status="Pending",
        assigned_to="ईमेल आयात",
        summary_notes=notes
    )
    db.add(dak)
    db.flush()
    
    for fname, fpayload, ftype in attachments_to_save:
        stored_name = f"eml_dak_{dak.id}_{fname}"
        file_path = UPLOAD_DIR / stored_name
        with open(file_path, "wb") as f_out:
            f_out.write(fpayload)
            
        att = DakAttachment(
            dak_id=dak.id,
            original_filename=fname,
            stored_filepath=str(file_path),
            file_type=ftype,
            file_size_bytes=len(fpayload)
        )
        db.add(att)
        
    db.commit()
    db.refresh(dak)
    return dak
