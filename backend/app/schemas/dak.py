from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional, List
from datetime import date, datetime

class DakActionBase(BaseModel):
    action_date: Optional[date] = None
    action_taken_by: str
    action_details: str
    status_after_action: str

    @field_validator('action_date', mode='before')
    @classmethod
    def empty_str_to_none_action(cls, v):
        if v == "" or (isinstance(v, str) and not v.strip()):
            return None
        return v

class DakActionCreate(DakActionBase):
    pass

class DakActionResponse(DakActionBase):
    id: int
    dak_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class DakAttachmentResponse(BaseModel):
    id: int
    original_filename: str
    stored_filepath: str
    file_type: Optional[str] = None
    file_size_bytes: Optional[int] = None
    uploaded_at: datetime
    model_config = ConfigDict(from_attributes=True)


class DakRecordBase(BaseModel):
    dak_unique_no: Optional[str] = None
    receipt_date: Optional[date] = None
    letter_no: Optional[str] = None
    letter_date: Optional[date] = None
    sender_name: Optional[str] = None
    sender_department: Optional[str] = None
    sender_region: Optional[str] = "A"
    subject_hi: str
    subject_en: Optional[str] = None
    category: Optional[str] = "General"
    priority: Optional[str] = "Normal"
    target_date: Optional[date] = None
    current_status: Optional[str] = "Pending"
    assigned_to: Optional[str] = None
    summary_notes: Optional[str] = None

    @field_validator('receipt_date', 'letter_date', 'target_date', mode='before')
    @classmethod
    def empty_str_to_none(cls, v):
        if v == "" or (isinstance(v, str) and not v.strip()):
            return None
        return v

class DakRecordCreate(DakRecordBase):
    pass

class DakRecordUpdate(BaseModel):
    receipt_date: Optional[date] = None
    letter_no: Optional[str] = None
    letter_date: Optional[date] = None
    sender_name: Optional[str] = None
    sender_department: Optional[str] = None
    sender_region: Optional[str] = None
    subject_hi: Optional[str] = None
    subject_en: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    target_date: Optional[date] = None
    current_status: Optional[str] = None
    assigned_to: Optional[str] = None
    summary_notes: Optional[str] = None

    @field_validator('receipt_date', 'letter_date', 'target_date', mode='before')
    @classmethod
    def empty_str_to_none_update(cls, v):
        if v == "" or (isinstance(v, str) and not v.strip()):
            return None
        return v

class DakRecordResponse(DakRecordBase):
    id: int
    created_at: datetime
    updated_at: datetime
    actions: List[DakActionResponse] = []
    attachments: List[DakAttachmentResponse] = []
    model_config = ConfigDict(from_attributes=True)
