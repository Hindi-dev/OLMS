import csv
from pathlib import Path
from datetime import datetime, date
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from sqlalchemy.orm import Session
from backend.app.models.employee import Employee
from backend.app.config import TEMPLATE_DIR

CATEGORY_MAP = {
    'क': 'A', 'ख': 'B', 'ग': 'C', 'घ': 'D',
    'A': 'A', 'B': 'B', 'C': 'C', 'D': 'D',
    'CAT A': 'A', 'CAT B': 'B', 'CAT C': 'C', 'CAT D': 'D',
    'CATEGORY A': 'A', 'CATEGORY B': 'B', 'CATEGORY C': 'C', 'CATEGORY D': 'D'
}

KNOWLEDGE_MAP = {
    'कार्यसाधक': 'Proficient',
    'कार्यसाधक ज्ञान': 'Proficient',
    'proficient': 'Proficient',
    'कामकाजी': 'Working',
    'कामकाजी ज्ञान': 'Working',
    'working': 'Working',
    'कोई नहीं': 'None',
    'none': 'None',
    'प्रशिक्षण अपेक्षित': 'None'
}

def generate_employee_template_excel(output_path: str | Path) -> str:
    """
    Generates a standardized Excel template for bulk importing employees.
    """
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "कर्मचारी रोस्टर डेटा"

    # Define Header Style
    header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    header_fill = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    navy_fill = PatternFill(start_color="102A54", end_color="102A54", fill_type="solid")
    align_center = Alignment(horizontal="center", vertical="center", wrap_text=True)

    headers = [
        ("emp_code*", "कर्मचारी कोड / Emp Code (अनिवार्य)"),
        ("name_hi*", "नाम (हिंदी में / Devanagari) (अनिवार्य)"),
        ("name_en*", "Name (English) (अनिवार्य)"),
        ("designation*", "पदनाम / Designation (अनिवार्य)"),
        ("department*", "विभाग / Department (अनिवार्य)"),
        ("employee_category*", "वर्ग / Category: A, B, C, D अथवा क, ख, ग, घ"),
        ("mother_tongue", "मातृभाषा / Mother Tongue"),
        ("hindi_knowledge_level", "हिंदी ज्ञान: Proficient, Working, None"),
        ("is_typist", "टंकक (Typist): Yes / No"),
        ("is_stenographer", "आशुलिपिक (Steno): Yes / No"),
        ("date_of_joining", "कार्यभार ग्रहण तिथि (YYYY-MM-DD)")
    ]

    for col_num, (code, title) in enumerate(headers, 1):
        cell = ws.cell(row=1, column=col_num)
        cell.value = f"{code}\n{title}"
        cell.font = Font(name="Calibri", size=10, bold=True, color="FFFFFF")
        cell.fill = navy_fill
        cell.alignment = align_center

    # Sample rows
    sample_data = [
        ("EMP-2001", "रमेश कुमार", "Ramesh Kumar", "वरिष्ठ लिपिक", "प्रशासन", "क", "Hindi", "Proficient", "No", "No", "2018-05-10"),
        ("EMP-2002", "मनप्रीत कौर", "Manpreet Kaur", "लेखा सहायक", "वित्त", "ख", "Punjabi", "Working", "No", "No", "2020-08-15"),
        ("EMP-2003", "प्रणब मुखर्जी", "Pranab Mukherjee", "कनिष्ठ अभियंता", "इंजीनियरिंग", "ग", "Bengali", "Working", "No", "No", "2021-11-01"),
        ("EMP-2004", "के. मुरुगन", "K. Murugan", "कार्यालय अधीक्षक", "कार्मिक", "घ", "Tamil", "None", "No", "No", "2019-02-20"),
        ("EMP-2005", "सपना जोशी", "Sapna Joshi", "टंकक सह लिपिक", "राजभाषा", "क", "Hindi", "Proficient", "Yes", "No", "2022-07-01")
    ]

    for row_idx, row_values in enumerate(sample_data, start=2):
        for col_idx, val in enumerate(row_values, start=1):
            cell = ws.cell(row=row_idx, column=col_idx, value=val)
            cell.alignment = Alignment(vertical="center")

    # Set column widths
    for col in ws.columns:
        max_len = max(len(str(cell.value or '')) for cell in col)
        col_letter = get_column_letter(col[0].column)
        ws.column_dimensions[col_letter].width = max(max_len + 3, 16)

    ws.row_dimensions[1].height = 42

    filepath = Path(output_path)
    wb.save(str(filepath))
    return str(filepath)

def import_employees_from_file(file_path: str | Path, db: Session) -> dict:
    """
    Parses and imports employees from an uploaded .xlsx or .csv file.
    """
    file_path = Path(file_path)
    ext = file_path.suffix.lower()
    
    rows_data = []

    if ext == '.csv':
        with open(file_path, mode='r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            for row in reader:
                rows_data.append(row)
    elif ext in ('.xlsx', '.xls'):
        wb = openpyxl.load_workbook(str(file_path), data_only=True)
        ws = wb.active
        # First row is headers
        headers = []
        for cell in ws[1]:
            val = str(cell.value or '').split('\n')[0].replace('*', '').strip().lower()
            headers.append(val)
        
        for row in ws.iter_rows(min_row=2, values_only=True):
            if not any(row):
                continue
            row_dict = {}
            for h, v in zip(headers, row):
                row_dict[h] = str(v).strip() if v is not None else ''
            rows_data.append(row_dict)
    else:
        raise ValueError("Unsupported file format. Please upload .xlsx or .csv")

    imported = 0
    updated = 0
    errors = []

    for idx, r in enumerate(rows_data, start=2):
        # Look up values by flexible key names
        emp_code = r.get('emp_code') or r.get('code') or r.get('कर्मचारी कोड')
        name_hi = r.get('name_hi') or r.get('नाम') or r.get('hindi_name')
        name_en = r.get('name_en') or r.get('english_name') or r.get('name')
        designation = r.get('designation') or r.get('पदनाम')
        department = r.get('department') or r.get('विभाग')

        if not emp_code or not name_hi or not designation:
            errors.append(f"पंक्ति (Row) {idx}: कर्मचारी कोड, नाम (हिंदी) एवं पदनाम अनिवार्य हैं।")
            continue

        raw_cat = str(r.get('employee_category') or r.get('category') or r.get('वर्ग') or 'A').strip().upper()
        category = CATEGORY_MAP.get(raw_cat, 'A')

        raw_know = str(r.get('hindi_knowledge_level') or r.get('knowledge') or r.get('ज्ञान') or 'Proficient').strip().lower()
        knowledge = KNOWLEDGE_MAP.get(raw_know, 'Proficient')

        is_typist = str(r.get('is_typist', '')).strip().lower() in ('yes', 'true', '1', 'हाँ', 'y')
        is_steno = str(r.get('is_stenographer', '')).strip().lower() in ('yes', 'true', '1', 'हाँ', 'y')

        doj_val = None
        raw_doj = str(r.get('date_of_joining', '')).strip()
        if raw_doj and raw_doj != 'None':
            try:
                # Handle YYYY-MM-DD or DD-MM-YYYY
                if '-' in raw_doj:
                    parts = raw_doj.split('-')
                    if len(parts[0]) == 4:
                        doj_val = date(int(parts[0]), int(parts[1]), int(parts[2]))
                    else:
                        doj_val = date(int(parts[2]), int(parts[1]), int(parts[0]))
            except Exception:
                pass

        # Check existing employee by emp_code
        emp = db.query(Employee).filter(Employee.emp_code == emp_code).first()
        if emp:
            # Update existing
            emp.name_hi = name_hi
            if name_en: emp.name_en = name_en
            emp.designation = designation
            if department: emp.department = department
            emp.employee_category = category
            emp.mother_tongue = r.get('mother_tongue') or emp.mother_tongue
            emp.hindi_knowledge_level = knowledge
            emp.is_typist = is_typist
            emp.is_stenographer = is_steno
            if doj_val: emp.date_of_joining = doj_val
            updated += 1
        else:
            # Create new
            new_emp = Employee(
                emp_code=emp_code,
                name_hi=name_hi,
                name_en=name_en or emp_code,
                designation=designation,
                department=department or "सामान्य",
                employee_category=category,
                mother_tongue=r.get('mother_tongue'),
                hindi_knowledge_level=knowledge,
                is_typist=is_typist,
                is_stenographer=is_steno,
                date_of_joining=doj_val,
                is_active=True
            )
            db.add(new_emp)
            imported += 1

    db.commit()

    return {
        "success": True,
        "total_rows_processed": len(rows_data),
        "imported_count": imported,
        "updated_count": updated,
        "error_count": len(errors),
        "errors": errors[:10] # Return first 10 errors
    }
