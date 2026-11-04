from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional
from datetime import date, datetime

class EmployeeBase(BaseModel):
    emp_code: str
    name_hi: str
    name_en: str
    designation: str
    department: str
    employee_category: str = "A" # A, B, C, D (क, ख, ग, घ)
    mother_tongue: Optional[str] = None
    hindi_qualification: Optional[str] = "Matriculation"
    hindi_knowledge_level: Optional[str] = "Proficient"
    is_typist: Optional[bool] = False
    is_stenographer: Optional[bool] = False
    date_of_joining: Optional[date] = None
    is_active: Optional[bool] = True

    @field_validator('date_of_joining', mode='before')
    @classmethod
    def empty_str_to_none_emp(cls, v):
        if v == "" or (isinstance(v, str) and not v.strip()):
            return None
        return v

class EmployeeCreate(EmployeeBase):
    pass

class EmployeeUpdate(BaseModel):
    name_hi: Optional[str] = None
    name_en: Optional[str] = None
    designation: Optional[str] = None
    department: Optional[str] = None
    employee_category: Optional[str] = None
    mother_tongue: Optional[str] = None
    hindi_qualification: Optional[str] = None
    hindi_knowledge_level: Optional[str] = None
    is_typist: Optional[bool] = None
    is_stenographer: Optional[bool] = None
    date_of_joining: Optional[date] = None
    is_active: Optional[bool] = None

    @field_validator('date_of_joining', mode='before')
    @classmethod
    def empty_str_to_none_emp_up(cls, v):
        if v == "" or (isinstance(v, str) and not v.strip()):
            return None
        return v

class EmployeeResponse(EmployeeBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
