import os
import sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

import fitz
from pathlib import Path
from backend.app.services.converter import convert_pdf_to_docx, get_pdf_info
from backend.app.services.krutidev import krutidev_to_unicode, is_devanagari
from backend.app.services.minutes_builder import generate_olic_minutes_docx
from backend.app.services.compliance_calc import calculate_qpr_metrics
from backend.app.database import SessionLocal
from backend.app.models.meeting import OlicMeeting
from backend.app.config import DATA_DIR, OUTPUT_DIR

def run_tests():
    print("=== 1. Testing Kruti Dev to Unicode Converter ===")
    sample_kruti = "Hkkjr ljdkj"  # In Kruti Dev, this is 'भारत सरकार'
    converted = krutidev_to_unicode(sample_kruti)
    print(f"Kruti Dev input: {sample_kruti} -> Unicode: {converted}")
    assert is_devanagari(converted), "Devanagari detection failed!"
    print("✓ Kruti Dev conversion and Devanagari detection passed.\n")

    print("=== 2. Creating & Converting Sample Bilingual Official PDF ===")
    sample_pdf_path = DATA_DIR / "sample_official_order.pdf"
    doc = fitz.open()
    page = doc.new_page(width=595, height=842) # A4 size

    # Insert text into PDF
    text_content = (
        "भारत सरकार / GOVERNMENT OF INDIA\n"
        "रेल मंत्रालय / MINISTRY OF RAILWAYS\n\n"
        "कार्यालय ज्ञापन / OFFICE MEMORANDUM\n"
        "विषय: राजभाषा नीति का अनुपालन एवं धारा 3(3) के अंतर्गत द्विभाषी दस्तावेज जारी करना।\n"
        "Subject: Compliance of Official Language Policy and issuing bilingual documents under Section 3(3).\n\n"
        "1. राजभाषा अधिनियम, 1963 की धारा 3(3) के तहत सभी सामान्य आदेश, परिपत्र एवं निविदाएं द्विभाषी रूप से जारी की जानी चाहिए।\n"
        "2. All concerned officers are requested to ensure strict compliance.\n"
    )
    # Using default font in fitz; fitz supports inserting text
    rect = fitz.Rect(50, 50, 545, 400)
    page.insert_textbox(rect, text_content, fontsize=12)
    doc.save(str(sample_pdf_path))
    doc.close()
    print(f"Sample PDF created at {sample_pdf_path}")

    # Inspect PDF
    info = get_pdf_info(sample_pdf_path)
    print(f"PDF Info: Pages={info['page_count']}, Has Devanagari={info['has_devanagari']}")

    # Convert PDF to DOCX
    output_docx = OUTPUT_DIR / "sample_official_order_converted.docx"
    result = convert_pdf_to_docx(sample_pdf_path, output_docx)
    print(f"Conversion Result: Success={result['success']}, Method={result['method_used']}, Size={result['output_size_bytes']} bytes")
    assert result['success'] and os.path.exists(output_docx), "PDF to DOCX conversion failed!"
    print("✓ PDF to DOCX conversion test passed.\n")

    print("=== 3. Testing Official OLIC Minutes DOCX Generation ===")
    db = SessionLocal()
    meeting = db.query(OlicMeeting).first()
    assert meeting is not None, "No meeting found in DB!"
    docx_minutes_path = generate_olic_minutes_docx(meeting, meeting.agenda_items)
    print(f"Minutes generated at: {docx_minutes_path}")
    assert os.path.exists(docx_minutes_path), "Minutes file not created!"
    print("✓ OLIC Minutes DOCX generation passed.\n")

    print("=== 4. Testing QPR Compliance Gap Calculator ===")
    test_qpr = {
        "office_region": "A",
        "letters_to_region_a_total": 500,
        "letters_to_region_a_hi": 480, # 96% -> Target is 100%
        "letters_to_region_b_total": 100,
        "letters_to_region_b_hi": 95,  # 95% -> Target is 90%
        "letters_received_hindi": 200,
        "letters_replied_hindi": 190,  # 95% -> Violation of Rule 5 (target 100%)
        "section3_3_items": [
            {"total_issued": 50, "bilingual_issued": 48, "only_english_issued": 2} # 2 violations!
        ]
    }
    metrics = calculate_qpr_metrics(test_qpr)
    print(f"Compliance flags detected: {len(metrics['flags'])}")
    for f in metrics['flags']:
        print(f" - [FLAG] {f}")
    assert len(metrics['flags']) >= 2, "Failed to flag violations!"
    print("✓ QPR Compliance calculator verified successfully.\n")

    db.close()
    print("ALL CORE BACKEND ENGINES AND SERVICES VERIFIED SUCCESSFULLY!")

if __name__ == "__main__":
    run_tests()
