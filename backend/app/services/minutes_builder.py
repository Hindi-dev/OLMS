from pathlib import Path
from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn
from backend.app.config import OUTPUT_DIR

def set_cell_background(cell, fill_hex="F2F2F2"):
    """Applies a subtle background color to table header cells."""
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tc_pr.append(shd)

def generate_olic_minutes_docx(meeting, agenda_items) -> str:
    """
    Generates a formal bilingual Minutes of Meeting (कार्यवृत्त) DOCX document
    adhering to Central Government Official Language Department formatting.
    """
    doc = Document()

    # Page Margins
    for sec in doc.sections:
        sec.top_margin = Inches(0.8)
        sec.bottom_margin = Inches(0.8)
        sec.left_margin = Inches(0.8)
        sec.right_margin = Inches(0.8)

    # Header / Title Block
    title_p = doc.add_paragraph()
    title_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_org = title_p.add_run("भारत सरकार / GOVERNMENT OF INDIA\n")
    run_org.font.name = "Mangal"
    run_org.font.size = Pt(13)
    run_org.font.bold = True

    meeting_name = "राजभाषा कार्यान्वयन समिति" if meeting.meeting_type == "OLIC" else "नगर राजभाषा कार्यान्वयन समिति (नराकास)"
    run_meeting = title_p.add_run(f"{meeting_name} की {meeting.quarter} ({meeting.financial_year}) बैठक का कार्यवृत्त\n")
    run_meeting.font.name = "Mangal"
    run_meeting.font.size = Pt(14)
    run_meeting.font.bold = True
    run_meeting.font.color.rgb = RGBColor(16, 44, 87) # Deep Government Navy Blue

    run_sub = title_p.add_run(f"MINUTES OF THE {meeting.meeting_type} MEETING FOR {meeting.quarter} ({meeting.financial_year})")
    run_sub.font.name = "Calibri"
    run_sub.font.size = Pt(11)
    run_sub.font.italic = True

    doc.add_paragraph() # Spacer

    # Meeting Meta Table
    meta_table = doc.add_table(rows=4, cols=2)
    meta_table.style = 'Table Grid'
    meta_table.autofit = True

    meta_rows = [
        ("बैठक की तिथि एवं समय / Date & Time:", f"{meeting.meeting_date}"),
        ("स्थान / Venue:", meeting.venue or "मुख्यालय सम्मेलन कक्ष / Conference Hall"),
        ("अध्यक्षता / Chaired by:", f"{meeting.chairperson_name}, {meeting.chairperson_designation}"),
        ("बैठक संख्या / Meeting Ref:", meeting.meeting_number or f"{meeting.meeting_type}/{meeting.quarter}/{meeting.financial_year}")
    ]

    for idx, (lbl, val) in enumerate(meta_rows):
        row = meta_table.rows[idx]
        cell_lbl, cell_val = row.cells[0], row.cells[1]
        
        p0 = cell_lbl.paragraphs[0]
        r0 = p0.add_run(lbl)
        r0.font.bold = True
        r0.font.size = Pt(10)
        set_cell_background(cell_lbl, "EBF3FA")
        
        p1 = cell_val.paragraphs[0]
        r1 = p1.add_run(val)
        r1.font.size = Pt(10)

    doc.add_paragraph() # Spacer

    # Section 1: Attendees
    h_attend = doc.add_heading(level=2)
    r_att = h_attend.add_run("१. उपस्थिति / List of Attendees")
    r_att.font.name = "Mangal"
    r_att.font.size = Pt(12)
    r_att.font.bold = True

    p_att = doc.add_paragraph()
    if meeting.attendees_list:
        p_att.add_run(meeting.attendees_list)
    else:
        p_att.add_run("समिति के सभी नामित सदस्य एवं विभिन्न अनुभागों के प्रमुख उपस्थित थे। (सूची संलग्न)")

    # Section 2: Agenda Items & Decisions (कार्यसूची मद एवं निर्णय)
    h_agenda = doc.add_heading(level=2)
    r_ag = h_agenda.add_run("२. कार्यसूची मदवार चर्चा एवं निर्णय / Agenda-wise Discussions & Decisions")
    r_ag.font.name = "Mangal"
    r_ag.font.size = Pt(12)
    r_ag.font.bold = True

    for item in agenda_items:
        p_item = doc.add_paragraph()
        run_item_title = p_item.add_run(f"मद संख्या {item.item_number}: {item.title_hi}")
        run_item_title.font.bold = True
        run_item_title.font.name = "Mangal"
        run_item_title.font.size = Pt(11)

        if item.title_en:
            p_item_en = doc.add_paragraph()
            r_en = p_item_en.add_run(f"(Item No. {item.item_number}: {item.title_en})")
            r_en.font.italic = True
            r_en.font.size = Pt(10)

        if item.discussion_summary:
            p_disc = doc.add_paragraph()
            p_disc.add_run(f"विचार-विमर्श: {item.discussion_summary}")

        if item.resolutions:
            p_dec_lbl = doc.add_paragraph()
            r_dec = p_dec_lbl.add_run("निर्णय / Resolution(s):")
            r_dec.font.bold = True
            r_dec.font.underline = True

            for res in item.resolutions:
                p_res = doc.add_paragraph(style='List Bullet')
                p_res.add_run(f"{res.decision_text_hi} ")
                r_meta = p_res.add_run(f"(उत्तरदायी अधिकारी/विभाग: {res.responsible_officer}, {res.responsible_department} | लक्ष्य तिथि: {res.target_date or 'शीघ्र'})")
                r_meta.font.italic = True
                r_meta.font.size = Pt(9.5)

    # Section 3: Signature Block
    doc.add_paragraph("\n\n")
    sig_p = doc.add_paragraph()
    sig_p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    sig_run = sig_p.add_run(f"हस्ताक्षर / Signature\n({meeting.chairperson_name})\n{meeting.chairperson_designation}\nअध्यक्ष, {meeting_name}")
    sig_run.font.name = "Mangal"
    sig_run.font.size = Pt(11)
    sig_run.font.bold = True

    output_filename = f"Minutes_{meeting.meeting_type}_{meeting.financial_year}_{meeting.quarter}_{meeting.id}.docx"
    filepath = OUTPUT_DIR / output_filename
    doc.save(str(filepath))
    return str(filepath)
