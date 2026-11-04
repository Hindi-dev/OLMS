from typing import List, Optional
from pathlib import Path
import shutil
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.database import get_db
from backend.app.models.employee import Employee
from backend.app.models.training import TrainingCourse, TrainingNomination
from backend.app.schemas.employee import EmployeeCreate, EmployeeUpdate, EmployeeResponse
from backend.app.schemas.training import (
    TrainingCourseCreate, TrainingCourseResponse,
    TrainingNominationCreate, TrainingNominationUpdate, TrainingNominationResponse
)
from backend.app.services.roster_importer import (
    generate_employee_template_excel,
    import_employees_from_file
)
from backend.app.config import TEMPLATE_DIR, UPLOAD_DIR

router = APIRouter(prefix="/api/training", tags=["Hindi Training Roster Management"])

@router.get("/employees/template")
def download_employee_template():
    template_file = TEMPLATE_DIR / "rajbhasha_employee_roster_template.xlsx"
    generate_employee_template_excel(template_file)
    return FileResponse(
        path=str(template_file),
        filename="rajbhasha_employee_roster_template.xlsx",
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )

@router.post("/employees/bulk-import")
async def bulk_import_employees(file: UploadFile = File(...), db: Session = Depends(get_db)):
    ext = Path(file.filename).suffix.lower()
    if ext not in ('.xlsx', '.xls', '.csv'):
        raise HTTPException(status_code=400, detail="Only Excel (.xlsx) or CSV (.csv) files are supported.")
    
    temp_path = UPLOAD_DIR / f"temp_import_{file.filename}"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        result = import_employees_from_file(temp_path, db)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")
    finally:
        if temp_path.exists():
            temp_path.unlink()

DEFAULT_COURSES = [
    {"course_code": "PRABODH", "name_hi": "प्रबोध (Prabodh)", "name_en": "Prabodh Course", "duration_months": 6, "description": "प्रारंभिक हिंदी पाठ्यक्रम (Category D कर्मचारियों के लिए)"},
    {"course_code": "PRAVEEN", "name_hi": "प्रवीण (Praveen)", "name_en": "Praveen Course", "duration_months": 6, "description": "मध्यम हिंदी पाठ्यक्रम (Category C एवं उत्तीर्ण प्रबोध कर्मचारियों के लिए)"},
    {"course_code": "PRAGYA", "name_hi": "प्राज्ञ (Pragya)", "name_en": "Pragya Course", "duration_months": 6, "description": "उच्च हिंदी पाठ्यक्रम (Category B एवं उत्तीर्ण प्रवीण कर्मचारियों के लिए)"},
    {"course_code": "TYPING", "name_hi": "हिंदी टंकण (Hindi Typing)", "name_en": "Hindi Typing", "duration_months": 6, "description": "कनिष्ठ लिपिकों एवं टंककों के लिए अनिवार्य कंप्यूटर टंकण"},
    {"course_code": "STENO", "name_hi": "हिंदी आशुलिपि (Hindi Stenography)", "name_en": "Hindi Stenography", "duration_months": 12, "description": "अंग्रेजी आशुलिपिकों के लिए हिंदी स्टेनो प्रशिक्षण"}
]

@router.get("/courses", response_model=List[TrainingCourseResponse])
def get_courses(db: Session = Depends(get_db)):
    # Auto-seed standard courses if empty
    existing = db.query(TrainingCourse).all()
    if not existing:
        for c in DEFAULT_COURSES:
            db.add(TrainingCourse(**c))
        db.commit()
        existing = db.query(TrainingCourse).all()
    return existing

@router.get("/employees", response_model=List[EmployeeResponse])
def get_employees(
    category: Optional[str] = None, # A, B, C, D
    department: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Employee).filter(Employee.is_active == True)
    if category:
        query = query.filter(Employee.employee_category == category.upper())
    if department:
        query = query.filter(Employee.department == department)
    if search:
        s_fmt = f"%{search}%"
        query = query.filter(
            (Employee.name_hi.ilike(s_fmt)) |
            (Employee.name_en.ilike(s_fmt)) |
            (Employee.emp_code.ilike(s_fmt))
        )
    return query.order_by(Employee.name_hi.asc()).all()

@router.post("/employees", response_model=EmployeeResponse)
def create_employee(emp_in: EmployeeCreate, db: Session = Depends(get_db)):
    existing = db.query(Employee).filter(Employee.emp_code == emp_in.emp_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Employee code already exists")
    
    emp = Employee(**emp_in.model_dump())
    db.add(emp)
    db.commit()
    db.refresh(emp)
    return emp

@router.put("/employees/{id}", response_model=EmployeeResponse)
def update_employee(id: int, emp_up: EmployeeUpdate, db: Session = Depends(get_db)):
    emp = db.query(Employee).filter(Employee.id == id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    for f, v in emp_up.model_dump(exclude_unset=True).items():
        setattr(emp, f, v)
        
    db.commit()
    db.refresh(emp)
    return emp

@router.delete("/employees/{id}")
def delete_employee(id: int, db: Session = Depends(get_db)):
    emp = db.query(Employee).filter(Employee.id == id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    db.delete(emp)
    db.commit()
    return {"message": "Employee deleted successfully"}

@router.get("/nominations", response_model=List[TrainingNominationResponse])
def get_nominations(
    course_code: Optional[str] = None,
    status: Optional[str] = None,
    batch: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(TrainingNomination).join(TrainingCourse)
    if course_code:
        query = query.filter(TrainingCourse.course_code == course_code.upper())
    if status:
        query = query.filter(TrainingNomination.status == status)
    if batch:
        query = query.filter(TrainingNomination.batch_number == batch)
    return query.order_by(TrainingNomination.id.desc()).all()

@router.post("/nominations", response_model=TrainingNominationResponse)
def create_nomination(nom_in: TrainingNominationCreate, db: Session = Depends(get_db)):
    emp = db.query(Employee).filter(Employee.id == nom_in.employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
        
    course = db.query(TrainingCourse).filter(TrainingCourse.id == nom_in.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Training course not found")

    nomination = TrainingNomination(**nom_in.model_dump())
    db.add(nomination)
    db.commit()
    db.refresh(nomination)
    return nomination

@router.put("/nominations/{id}", response_model=TrainingNominationResponse)
def update_nomination(id: int, nom_up: TrainingNominationUpdate, db: Session = Depends(get_db)):
    nom = db.query(TrainingNomination).filter(TrainingNomination.id == id).first()
    if not nom:
        raise HTTPException(status_code=404, detail="Nomination not found")
        
    for f, v in nom_up.model_dump(exclude_unset=True).items():
        setattr(nom, f, v)
        
    db.commit()
    db.refresh(nom)
    return nom

@router.get("/roster-summary")
def get_roster_summary(db: Session = Depends(get_db)):
    total_emp = db.query(func.count(Employee.id)).filter(Employee.is_active == True).scalar() or 0
    cat_a = db.query(func.count(Employee.id)).filter(Employee.is_active == True, Employee.employee_category == "A").scalar() or 0
    cat_b = db.query(func.count(Employee.id)).filter(Employee.is_active == True, Employee.employee_category == "B").scalar() or 0
    cat_c = db.query(func.count(Employee.id)).filter(Employee.is_active == True, Employee.employee_category == "C").scalar() or 0
    cat_d = db.query(func.count(Employee.id)).filter(Employee.is_active == True, Employee.employee_category == "D").scalar() or 0

    pending_nominations = db.query(func.count(TrainingNomination.id)).filter(TrainingNomination.status == "Pending Nomination").scalar() or 0
    under_training = db.query(func.count(TrainingNomination.id)).filter(TrainingNomination.status == "Under Training").scalar() or 0
    passed = db.query(func.count(TrainingNomination.id)).filter(TrainingNomination.status == "Passed").scalar() or 0

    return {
        "total_employees": total_emp,
        "by_category": {
            "A": cat_a,
            "B": cat_b,
            "C": cat_c,
            "D": cat_d
        },
        "nomination_stats": {
            "pending": pending_nominations,
            "under_training": under_training,
            "passed": passed
        }
    }
