from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.translation import GlossaryTerm, TranslationMemoryUnit
from backend.app.schemas.translation import (
    GlossaryTermCreate, GlossaryTermResponse,
    TranslationMemoryCreate, TranslationMemoryResponse
)
from backend.app.services.krutidev import krutidev_to_unicode

router = APIRouter(prefix="/api/translation", tags=["Translation Memory & Reference Archive"])

class KrutiDevConvertRequest(BaseModel):
    text: str

class KrutiDevConvertResponse(BaseModel):
    original_text: str
    unicode_text: str

STANDARD_GOVT_GLOSSARY = [
    {"english_term": "Action Taken Report", "hindi_term": "कार्रवाई की गई रिपोर्ट (एटीआर)", "alternate_terms": "अनुपालन रिपोर्ट", "domain": "Administration", "authority_source": "CSTT"},
    {"english_term": "Official Language Implementation Committee", "hindi_term": "राजभाषा कार्यान्वयन समिति", "alternate_terms": "राकास", "domain": "Administration", "authority_source": "MoHA"},
    {"english_term": "Quarterly Progress Report", "hindi_term": "तिमाही प्रगति रिपोर्ट (क्यूपीआर)", "alternate_terms": "त्रैमासिक रिपोर्ट", "domain": "Administration", "authority_source": "MoHA"},
    {"english_term": "Prescribed format", "hindi_term": "निर्धारित प्रारूप", "alternate_terms": "विहित प्रपत्र", "domain": "Administration", "authority_source": "CSTT"},
    {"english_term": "Competent Authority", "hindi_term": "सक्षम प्राधिकारी", "alternate_terms": "सक्षम अधिकारी", "domain": "Administration", "authority_source": "CSTT"},
    {"english_term": "Sanction Order", "hindi_term": "स्वीकृति आदेश", "alternate_terms": "मंजूरी आदेश", "domain": "Finance", "authority_source": "Finance Ministry"},
    {"english_term": "Office Memorandum", "hindi_term": "कार्यालय ज्ञापन", "alternate_terms": "का.ज्ञा.", "domain": "Administration", "authority_source": "DoPT"},
    {"english_term": "General Orders", "hindi_term": "सामान्य आदेश", "alternate_terms": "धारा 3(3) के अंतर्गत", "domain": "Legal/Rajbhasha", "authority_source": "MoHA"},
    {"english_term": "Town Official Language Implementation Committee", "hindi_term": "नगर राजभाषा कार्यान्वयन समिति", "alternate_terms": "नराकास / TOLIC", "domain": "Administration", "authority_source": "MoHA"},
    {"english_term": "Disciplinary Proceedings", "hindi_term": "अनुशासनात्मक कार्यवाही", "alternate_terms": "विभागीय जांच", "domain": "Administration", "authority_source": "CSTT"},
    {"english_term": "Rolling Stock", "hindi_term": "चल स्टॉक", "alternate_terms": "रेल इंजन एवं डिब्बे", "domain": "Railway", "authority_source": "Railway Board"},
    {"english_term": "Interlocking System", "hindi_term": "अंतर्पाशन प्रणाली", "alternate_terms": "सिग्नल इंटरलॉकिंग", "domain": "Railway", "authority_source": "Railway Board"},
    {"english_term": "Casual Leave", "hindi_term": "आकस्मिक अवकाश", "alternate_terms": "सीएल", "domain": "Administration", "authority_source": "DoPT"},
    {"english_term": "Earned Leave", "hindi_term": "अर्जित अवकाश", "alternate_terms": "ईएल", "domain": "Administration", "authority_source": "DoPT"}
]

@router.get("/glossary", response_model=List[GlossaryTermResponse])
def get_glossary(
    search: Optional[str] = None,
    domain: Optional[str] = None,
    db: Session = Depends(get_db)
):
    # Auto-seed standard glossary if empty
    count = db.query(GlossaryTerm).count()
    if count == 0:
        for item in STANDARD_GOVT_GLOSSARY:
            db.add(GlossaryTerm(**item))
        db.commit()

    query = db.query(GlossaryTerm)
    if domain:
        query = query.filter(GlossaryTerm.domain == domain)
    if search:
        s_fmt = f"%{search}%"
        query = query.filter(
            (GlossaryTerm.english_term.ilike(s_fmt)) |
            (GlossaryTerm.hindi_term.ilike(s_fmt)) |
            (GlossaryTerm.alternate_terms.ilike(s_fmt))
        )
    return query.order_by(GlossaryTerm.english_term.asc()).all()

@router.post("/glossary", response_model=GlossaryTermResponse)
def add_glossary_term(term_in: GlossaryTermCreate, db: Session = Depends(get_db)):
    term = GlossaryTerm(**term_in.model_dump())
    db.add(term)
    db.commit()
    db.refresh(term)
    return term

@router.get("/memory", response_model=List[TranslationMemoryResponse])
def get_translation_memory(
    search: Optional[str] = None,
    domain: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(TranslationMemoryUnit)
    if domain:
        query = query.filter(TranslationMemoryUnit.domain == domain)
    if search:
        s_fmt = f"%{search}%"
        query = query.filter(
            (TranslationMemoryUnit.source_text.ilike(s_fmt)) |
            (TranslationMemoryUnit.target_text.ilike(s_fmt)) |
            (TranslationMemoryUnit.context_notes.ilike(s_fmt))
        )
    return query.order_by(TranslationMemoryUnit.usage_count.desc(), TranslationMemoryUnit.id.desc()).all()

@router.post("/memory", response_model=TranslationMemoryResponse)
def add_translation_memory(tm_in: TranslationMemoryCreate, db: Session = Depends(get_db)):
    tm = TranslationMemoryUnit(**tm_in.model_dump())
    db.add(tm)
    db.commit()
    db.refresh(tm)
    return tm

@router.post("/krutidev-to-unicode", response_model=KrutiDevConvertResponse)
def convert_kruti_to_unicode(payload: KrutiDevConvertRequest):
    converted = krutidev_to_unicode(payload.text)
    return {
        "original_text": payload.text,
        "unicode_text": converted
    }
