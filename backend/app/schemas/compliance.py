from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class QprSection33ItemBase(BaseModel):
    document_category: str
    total_issued: int = 0
    bilingual_issued: int = 0
    only_english_issued: int = 0
    compliance_percent: Optional[float] = 100.0

class QprSection33ItemCreate(QprSection33ItemBase):
    pass

class QprSection33ItemResponse(QprSection33ItemBase):
    id: int
    qpr_id: int
    model_config = ConfigDict(from_attributes=True)


class QprSubmissionBase(BaseModel):
    year: int
    quarter: str
    office_name: str
    office_region: Optional[str] = "A"
    letters_to_region_a_hi: Optional[int] = 0
    letters_to_region_a_total: Optional[int] = 0
    letters_to_region_b_hi: Optional[int] = 0
    letters_to_region_b_total: Optional[int] = 0
    letters_to_region_c_hi: Optional[int] = 0
    letters_to_region_c_total: Optional[int] = 0
    letters_received_hindi: Optional[int] = 0
    letters_replied_hindi: Optional[int] = 0
    total_computers: Optional[int] = 0
    computers_with_hindi_facility: Optional[int] = 0
    remarks: Optional[str] = None

class QprSubmissionCreate(QprSubmissionBase):
    section3_3_items: List[QprSection33ItemCreate] = []

class QprSubmissionResponse(QprSubmissionBase):
    id: int
    created_at: datetime
    section3_3_items: List[QprSection33ItemResponse] = []
    model_config = ConfigDict(from_attributes=True)
