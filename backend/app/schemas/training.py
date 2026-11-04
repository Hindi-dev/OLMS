from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional
from datetime import date, datetime
from backend.app.schemas.employee import EmployeeResponse

class TrainingCourseBase(BaseModel):
    course_code: str
    name_hi: str
    name_en: str
    description: Optional[str] = None
    duration_months: Optional[int] = 6

class TrainingCourseCreate(TrainingCourseBase):
    pass

class TrainingCourseResponse(TrainingCourseBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class TrainingNominationBase(BaseModel):
    employee_id: int
    course_id: int
    status: Optional[str] = "Pending Nomination"
    batch_number: Optional[str] = None
    training_center: Optional[str] = None
    nomination_date: Optional[date] = None
    start_date: Optional[date] = None
    completion_date: Optional[date] = None
    result_grade: Optional[str] = None
    cash_award_eligible: Optional[str] = None
    remarks: Optional[str] = None

    @field_validator('nomination_date', 'start_date', 'completion_date', mode='before')
    @classmethod
    def empty_str_to_none_nom(cls, v):
        if v == "" or (isinstance(v, str) and not v.strip()):
            return None
        return v

class TrainingNominationCreate(TrainingNominationBase):
    pass

class TrainingNominationUpdate(BaseModel):
    status: Optional[str] = None
    batch_number: Optional[str] = None
    training_center: Optional[str] = None
    nomination_date: Optional[date] = None
    start_date: Optional[date] = None
    completion_date: Optional[date] = None
    result_grade: Optional[str] = None
    cash_award_eligible: Optional[str] = None
    remarks: Optional[str] = None

    @field_validator('nomination_date', 'start_date', 'completion_date', mode='before')
    @classmethod
    def empty_str_to_none_nom_up(cls, v):
        if v == "" or (isinstance(v, str) and not v.strip()):
            return None
        return v

class TrainingNominationResponse(TrainingNominationBase):
    id: int
    created_at: datetime
    updated_at: datetime
    employee: Optional[EmployeeResponse] = None
    course: Optional[TrainingCourseResponse] = None
    model_config = ConfigDict(from_attributes=True)
