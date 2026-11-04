import os
import fitz  # PyMuPDF
from pathlib import Path
from pdf2docx import Converter
from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from backend.app.services.krutidev import is_devanagari

def get_pdf_info(pdf_path: str | Path) -> dict:
    """
    Analyzes PDF pages, text density, and presence of Devanagari script.
    """
    doc = fitz.open(str(pdf_path))
    total_pages = len(doc)
    has_text = False
    has_devanagari = False
    sample_text = ""

    for i in range(min(5, total_pages)):
        page_text = doc[i].get_text()
        if page_text.strip():
            has_text = True
            sample_text += page_text[:500] + "\n"
            if is_devanagari(page_text):
                has_devanagari = True

    doc.close()
    return {
        "page_count": total_pages,
        "is_digital_text": has_text,
        "has_devanagari": has_devanagari,
        "sample_preview": sample_text[:800]
    }

def convert_pdf_to_docx(pdf_path: str | Path, output_docx_path: str | Path) -> dict:
    """
    Converts PDF to editable DOCX format.
    First attempts high-fidelity layout conversion with pdf2docx.
    If pdf2docx fails or the document is purely text/tables, uses PyMuPDF + python-docx fallback.
    """
    pdf_str = str(pdf_path)
    docx_str = str(output_docx_path)
    
    info = get_pdf_info(pdf_str)
    conversion_method = "pdf2docx-layout"
    
    try:
        cv = Converter(pdf_str)
        # Convert all pages with full layout parsing
        cv.convert(docx_str, start=0, end=None)
        cv.close()
    except Exception as e:
        # Fallback to direct structured PyMuPDF -> python-docx extraction
        conversion_method = "pymupdf-structured-fallback"
        doc = fitz.open(pdf_str)
        word_doc = Document()
        
        # Configure standard A4 margins
        sections = word_doc.sections
        for section in sections:
            section.top_margin = Inches(0.8)
            section.bottom_margin = Inches(0.8)
            section.left_margin = Inches(0.8)
            section.right_margin = Inches(0.8)

        for page_num in range(len(doc)):
            page = doc[page_num]
            text = page.get_text("text")
            
            p = word_doc.add_paragraph()
            p_run = p.add_run(f"--- पृष्ठ {page_num + 1} / Page {page_num + 1} ---")
            p_run.font.italic = True
            p_run.font.size = Pt(9)
            p_run.font.color.rgb = RGBColor(128, 128, 128)
            
            for line in text.split("\n"):
                line_str = line.strip()
                if line_str:
                    para = word_doc.add_paragraph(line_str)
                    para.style.font.name = "Mangal" if is_devanagari(line_str) else "Calibri"
                    para.style.font.size = Pt(11)
            
            if page_num < len(doc) - 1:
                word_doc.add_page_break()
                
        word_doc.save(docx_str)
        doc.close()

    file_size = os.path.getsize(docx_str) if os.path.exists(docx_str) else 0

    return {
        "success": os.path.exists(docx_str),
        "output_file": docx_str,
        "method_used": conversion_method,
        "page_count": info["page_count"],
        "has_devanagari": info["has_devanagari"],
        "output_size_bytes": file_size
    }
