import shutil
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.policy_document import PolicyDocument
from backend.app.schemas.policy_document import (
    PolicyDocumentResponse, PolicySearchMatch
)
from backend.app.services.policy_extractor import (
    extract_policy_document_text,
    search_policy_references
)
from backend.app.config import UPLOAD_DIR

router = APIRouter(prefix="/api/policy-docs", tags=["Official Language Policy References"])

POLICY_STORAGE_DIR = UPLOAD_DIR / "policies"
POLICY_STORAGE_DIR.mkdir(parents=True, exist_ok=True)

@router.get("/", response_model=List[PolicyDocumentResponse])
def get_policy_documents(
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(PolicyDocument)
    if category:
        query = query.filter(PolicyDocument.policy_category == category)
    if search:
        s_fmt = f"%{search}%"
        query = query.filter(
            (PolicyDocument.title.ilike(s_fmt)) |
            (PolicyDocument.circular_no.ilike(s_fmt)) |
            (PolicyDocument.issuing_authority.ilike(s_fmt)) |
            (PolicyDocument.summary_notes.ilike(s_fmt))
        )
    return query.order_by(PolicyDocument.id.desc()).all()

@router.post("/upload", response_model=PolicyDocumentResponse)
async def upload_policy_document(
    title: str = Form(...),
    circular_no: Optional[str] = Form(None),
    issuing_authority: Optional[str] = Form("गृह मंत्रालय, राजभाषा विभाग"),
    issue_date: Optional[str] = Form(None),
    policy_category: Optional[str] = Form("General Order"),
    summary_notes: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    ext = Path(file.filename).suffix.lower()
    if ext not in (".pdf", ".docx", ".doc", ".txt"):
        raise HTTPException(status_code=400, detail="Only PDF, DOCX, or TXT policy documents are supported.")

    clean_name = f"policy_{int(Path(file.filename).stem.__hash__())}_{file.filename}"
    file_path = POLICY_STORAGE_DIR / clean_name
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        extraction = extract_policy_document_text(file_path)
    except Exception as e:
        if file_path.exists():
            file_path.unlink()
        raise HTTPException(status_code=500, detail=f"Text extraction failed: {str(e)}")

    parsed_date = None
    if issue_date and issue_date.strip():
        try:
            from datetime import date
            parts = issue_date.strip().split("-")
            parsed_date = date(int(parts[0]), int(parts[1]), int(parts[2]))
        except Exception:
            pass

    doc = PolicyDocument(
        title=title,
        circular_no=circular_no or None,
        issuing_authority=issuing_authority or "गृह मंत्रालय, राजभाषा विभाग",
        issue_date=parsed_date,
        policy_category=policy_category or "General Order",
        original_filename=file.filename,
        stored_filepath=str(file_path),
        file_type=ext.replace(".", "").upper(),
        file_size_bytes=file_path.stat().st_size,
        page_count=extraction["page_count"],
        extracted_text=extraction["combined_tagged_text"],
        summary_notes=summary_notes or None
    )

    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc

@router.get("/search/ready-reference", response_model=List[PolicySearchMatch])
def search_ready_reference(
    query: str = Query(..., min_length=2),
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    docs_query = db.query(PolicyDocument)
    if category:
        docs_query = docs_query.filter(PolicyDocument.policy_category == category)
    docs = docs_query.all()
    
    matches = search_policy_references(query, docs)
    return matches

@router.get("/{id}")
def get_policy_document_detail(id: int, db: Session = Depends(get_db)):
    doc = db.query(PolicyDocument).filter(PolicyDocument.id == id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Policy document not found")
    
    return {
        "id": doc.id,
        "title": doc.title,
        "circular_no": doc.circular_no,
        "issuing_authority": doc.issuing_authority,
        "issue_date": str(doc.issue_date) if doc.issue_date else None,
        "policy_category": doc.policy_category,
        "original_filename": doc.original_filename,
        "page_count": doc.page_count,
        "summary_notes": doc.summary_notes,
        "extracted_text": doc.extracted_text,
        "created_at": doc.created_at
    }

@router.get("/{id}/download")
def download_policy_file(id: int, db: Session = Depends(get_db)):
    doc = db.query(PolicyDocument).filter(PolicyDocument.id == id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Policy document not found")
    
    p = Path(doc.stored_filepath)
    if not p.exists():
        raise HTTPException(status_code=404, detail="Underlying document file not found on disk")
        
    return FileResponse(
        path=str(p),
        filename=doc.original_filename,
        media_type="application/octet-stream"
    )

@router.delete("/{id}")
def delete_policy_document(id: int, db: Session = Depends(get_db)):
    doc = db.query(PolicyDocument).filter(PolicyDocument.id == id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Policy document not found")
    
    # Try deleting file on disk
    try:
        p = Path(doc.stored_filepath)
        if p.exists():
            p.unlink()
    except Exception:
        pass

    db.delete(doc)
    db.commit()
    return {"message": "Policy document deleted successfully"}
