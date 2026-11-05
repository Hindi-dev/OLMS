import os
from pathlib import Path

try:
    import fitz  # PyMuPDF
except Exception:
    fitz = None

try:
    from pdf2docx import Converter
except Exception:
    Converter = None

import pypdf
from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from backend.app.services.krutidev import is_devanagari

def get_pdf_info(pdf_path: str | Path) -> dict:
    """
    Analyzes PDF pages, text density, and presence of Devanagari script.
    """
    pdf_str = str(pdf_path)
    total_pages = 0
    has_text = False
    has_devanagari = False
    sample_text = ""

    if fitz:
        try:
            doc = fitz.open(pdf_str)
            total_pages = len(doc)
            for i in range(min(5, total_pages)):
                page_text = doc[i].get_text()
                if page_text.strip():
                    has_text = True
                    sample_text += page_text[:500] + "\n"
                    if is_devanagari(page_text):
                        has_devanagari = True
            doc.close()
        except Exception:
            total_pages = 0

    if not total_pages:
        try:
            reader = pypdf.PdfReader(pdf_str)
            total_pages = len(reader.pages)
            for i in range(min(5, total_pages)):
                page_text = reader.pages[i].extract_text() or ""
                if page_text.strip():
                    has_text = True
                    sample_text += page_text[:500] + "\n"
                    if is_devanagari(page_text):
                        has_devanagari = True
        except Exception:
            pass

    return {
        "page_count": total_pages,
        "is_digital_text": has_text,
        "has_devanagari": has_devanagari,
        "sample_preview": sample_text[:800]
    }

def convert_pdf_to_docx(pdf_path: str | Path, output_docx_path: str | Path) -> dict:
    """
    Converts PDF to editable DOCX format.
    First attempts high-fidelity layout conversion with pdf2docx if available.
    If pdf2docx fails or is unavailable, uses structured pypdf + python-docx extraction.
    """
    pdf_str = str(pdf_path)
    docx_str = str(output_docx_path)
    
    info = get_pdf_info(pdf_str)
    conversion_method = "pdf2docx-layout"
    converted = False
    
    if Converter:
        try:
            cv = Converter(pdf_str)
            cv.convert(docx_str, start=0, end=None)
            cv.close()
            converted = os.path.exists(docx_str) and os.path.getsize(docx_str) > 0
        except Exception:
            converted = False

    if not converted:
        conversion_method = "structured-unicode-pypdf"
        reader = pypdf.PdfReader(pdf_str)
        word_doc = Document()
        
        # Configure standard A4 margins
        sections = word_doc.sections
        for section in sections:
            section.top_margin = Inches(0.8)
            section.bottom_margin = Inches(0.8)
            section.left_margin = Inches(0.8)
            section.right_margin = Inches(0.8)

        total = len(reader.pages)
        for page_num, page in enumerate(reader.pages):
            text = page.extract_text() or ""
            
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
            
            if page_num < total - 1:
                word_doc.add_page_break()
                
        word_doc.save(docx_str)

    file_size = os.path.getsize(docx_str) if os.path.exists(docx_str) else 0

    return {
        "success": os.path.exists(docx_str),
        "output_file": docx_str,
        "method_used": conversion_method,
        "page_count": info["page_count"],
        "has_devanagari": info["has_devanagari"],
        "output_size_bytes": file_size
    }
