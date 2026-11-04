from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Boolean, Date, DateTime
from sqlalchemy.orm import relationship
from backend.app.database import Base

class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    emp_code = Column(String(50), unique=True, index=True, nullable=False)
    name_hi = Column(String(150), nullable=False) # e.g. राजेश कुमार
    name_en = Column(String(150), nullable=False) # e.g. Rajesh Kumar
    designation = Column(String(150), nullable=False)
    department = Column(String(150), nullable=False)
    
    # Official Language Category per Presidential Orders
    # A = क (Hindi native/matriculation), B = ख, C = ग, D = घ
    employee_category = Column(String(10), nullable=False, default="A")
    mother_tongue = Column(String(80), nullable=True)
    
    # Highest qualification in Hindi (e.g. Matriculation, Inter, Degree, None)
    hindi_qualification = Column(String(100), default="Matriculation")
    hindi_knowledge_level = Column(String(50), default="Proficient") # Proficient (कार्यसाधक ज्ञान), Working (कामकाजी ज्ञान), None
    
    is_typist = Column(Boolean, default=False)
    is_stenographer = Column(Boolean, default=False)
    date_of_joining = Column(Date, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    nominations = relationship("TrainingNomination", back_populates="employee", cascade="all, delete-orphan")
