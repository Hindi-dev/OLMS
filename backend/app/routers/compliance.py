from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.compliance import QprSubmission, QprSection33Item
from backend.app.schemas.compliance import (
    QprSubmissionCreate, QprSubmissionResponse
)
from backend.app.services.compliance_calc import (
    calculate_qpr_metrics,
    ANNUAL_PROGRAMME_TARGETS,
    SECTION_3_3_STANDARD_CATEGORIES
)

router = APIRouter(prefix="/api/compliance", tags=["Official Language Compliance & Policy Assistant"])

RAJBHASHA_POLICY_KNOWLEDGE_BASE = [
    {
        "id": "act-1963-sec3-3",
        "title_hi": "राजभाषा अधिनियम 1963 की धारा 3(3)",
        "title_en": "Section 3(3) of the Official Languages Act, 1963",
        "description_hi": "संकल्प, सामान्य आदेश, नियम, अधिसूचनाएं, प्रशासनिक या अन्य रिपोर्ट, प्रेस विज्ञप्तियां, संविदाएं, करार, लाइसेंस, परमिट, निविदा सूचनाएं एवं प्रारूप अनिवार्य रूप से द्विभाषी (हिंदी एवं अंग्रेजी) में ही जारी किए जाएंगे।",
        "mandate": "100% द्विभाषी (Bilingual) - कोई भी छूट अनुमन्य नहीं है।",
        "legal_consequence": "अंग्रेजी में अकेले जारी करना वैधानिक उल्लंघन (Statutory Violation) माना जाता है।"
    },
    {
        "id": "rules-1976-rule5",
        "title_hi": "राजभाषा नियम 1976 का नियम 5 (हिंदी में प्राप्त पत्रों के उत्तर)",
        "title_en": "Rule 5 of the Official Languages Rules, 1976",
        "description_hi": "हिंदी में प्राप्त किसी भी पत्र, आवेदन या अभ्यावेदन का उत्तर केवल और केवल हिंदी में ही दिया जाएगा।",
        "mandate": "100% हिंदी में उत्तर देना अनिवार्य है।"
    },
    {
        "id": "rules-1976-regions",
        "title_hi": "राजभाषा नियम 1976 के अंतर्गत क्षेत्रों का वर्गीकरण (क, ख, ग क्षेत्र)",
        "title_en": "Categorization of Regions under OL Rules, 1976",
        "description_hi": "क क्षेत्र: बिहार, हरियाणा, हिमाचल प्रदेश, मध्य प्रदेश, छत्तीसगढ़, झारखंड, राजस्थान, उत्तर प्रदेश, उत्तराखंड, राष्ट्रीय राजधानी क्षेत्र दिल्ली, अंडमान और निकोबार द्वीप समूह।\nख क्षेत्र: गुजरात, महाराष्ट्र, पंजाब, चंडीगढ़, दमन और दीव, दादरा और नगर हवेली।\nग क्षेत्र: अन्य सभी राज्य एवं संघ राज्य क्षेत्र।",
        "mandate": "पत्राचार लक्ष्य: क क्षेत्र को 100%, ख क्षेत्र को 90%, ग क्षेत्र को 55%।"
    },
    {
        "id": "rules-1976-rule10-4",
        "title_hi": "राजभाषा नियम 1976 का नियम 10(4) एवं 8(4)",
        "title_en": "Rule 10(4) & Rule 8(4) - Notified Offices & Individual Work in Hindi",
        "description_hi": "जिस कार्यालय के 80% या उससे अधिक कर्मचारी हिंदी का कार्यसाधक ज्ञान प्राप्त कर चुके हैं, उसे राजपत्र में अधिसूचित (Notified) किया जाता है। ऐसे कार्यालयों में कर्मचारियों को हिंदी में ही प्रारूपण और टिप्पण (Drafting and Notetaking) करने का व्यक्तिगत आदेश दिया जा सकता है।"
    },
    {
        "id": "annual-programme",
        "title_hi": "गृह मंत्रालय (राजभाषा विभाग) का वार्षिक कार्यक्रम",
        "title_en": "Annual Programme by Ministry of Home Affairs",
        "description_hi": "प्रत्येक वित्तीय वर्ष में केंद्र सरकार के कार्यालयों, उपक्रमों एवं बैंकों के लिए संघ के राजकीय प्रयोजनों के लिए हिंदी के प्रगामी प्रयोग हेतु लक्ष्य निर्धारित किए जाते हैं।"
    }
]

@router.get("/knowledge-base")
def get_knowledge_base():
    return RAJBHASHA_POLICY_KNOWLEDGE_BASE

@router.get("/targets")
def get_annual_targets():
    return ANNUAL_PROGRAMME_TARGETS

@router.get("/section3-3-categories")
def get_section3_3_categories():
    return SECTION_3_3_STANDARD_CATEGORIES

@router.get("/qpr", response_model=List[QprSubmissionResponse])
def get_qpr_submissions(db: Session = Depends(get_db)):
    return db.query(QprSubmission).order_by(QprSubmission.year.desc(), QprSubmission.quarter.desc()).all()

@router.post("/qpr", response_model=QprSubmissionResponse)
def submit_qpr(qpr_in: QprSubmissionCreate, db: Session = Depends(get_db)):
    qpr = QprSubmission(
        year=qpr_in.year,
        quarter=qpr_in.quarter,
        office_name=qpr_in.office_name,
        office_region=qpr_in.office_region,
        letters_to_region_a_hi=qpr_in.letters_to_region_a_hi,
        letters_to_region_a_total=qpr_in.letters_to_region_a_total,
        letters_to_region_b_hi=qpr_in.letters_to_region_b_hi,
        letters_to_region_b_total=qpr_in.letters_to_region_b_total,
        letters_to_region_c_hi=qpr_in.letters_to_region_c_hi,
        letters_to_region_c_total=qpr_in.letters_to_region_c_total,
        letters_received_hindi=qpr_in.letters_received_hindi,
        letters_replied_hindi=qpr_in.letters_replied_hindi,
        total_computers=qpr_in.total_computers,
        computers_with_hindi_facility=qpr_in.computers_with_hindi_facility,
        remarks=qpr_in.remarks
    )
    db.add(qpr)
    db.flush()

    for item in qpr_in.section3_3_items:
        tot = item.total_issued
        bi = item.bilingual_issued
        pct = (bi / tot * 100.0) if tot > 0 else 100.0
        sec_item = QprSection33Item(
            qpr_id=qpr.id,
            document_category=item.document_category,
            total_issued=tot,
            bilingual_issued=bi,
            only_english_issued=item.only_english_issued,
            compliance_percent=pct
        )
        db.add(sec_item)

    db.commit()
    db.refresh(qpr)
    return qpr

@router.get("/qpr/{id}/evaluate")
def evaluate_qpr(id: int, db: Session = Depends(get_db)):
    qpr = db.query(QprSubmission).filter(QprSubmission.id == id).first()
    if not qpr:
        raise HTTPException(status_code=404, detail="QPR submission not found")
    
    qpr_dict = {
        "office_region": qpr.office_region,
        "letters_to_region_a_hi": qpr.letters_to_region_a_hi,
        "letters_to_region_a_total": qpr.letters_to_region_a_total,
        "letters_to_region_b_hi": qpr.letters_to_region_b_hi,
        "letters_to_region_b_total": qpr.letters_to_region_b_total,
        "letters_to_region_c_hi": qpr.letters_to_region_c_hi,
        "letters_to_region_c_total": qpr.letters_to_region_c_total,
        "letters_received_hindi": qpr.letters_received_hindi,
        "letters_replied_hindi": qpr.letters_replied_hindi,
        "section3_3_items": [
            {
                "document_category": item.document_category,
                "total_issued": item.total_issued,
                "bilingual_issued": item.bilingual_issued,
                "only_english_issued": item.only_english_issued,
                "compliance_percent": item.compliance_percent
            } for item in qpr.section3_3_items
        ]
    }
    
    evaluation = calculate_qpr_metrics(qpr_dict)
    return {
        "qpr_id": qpr.id,
        "year": qpr.year,
        "quarter": qpr.quarter,
        "office_name": qpr.office_name,
        "evaluation": evaluation
    }
