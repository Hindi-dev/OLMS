from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional, List
from datetime import date, datetime

class PolicyDocumentBase(BaseModel):
    title: str
    circular_no: Optional[str] = None
    issuing_authority: Optional[str] = "गृह मंत्रालय, राजभाषा विभाग"
    issue_date: Optional[date] = None
    policy_category: Optional[str] = "General Order"
    summary_notes: Optional[str] = None

    @field_validator('issue_date', mode='before')
    @classmethod
    def empty_str_to_none_policy(cls, v):
        if v == "" or (isinstance(v, str) and not v.strip()):
            return None
        return v

class PolicyDocumentCreate(PolicyDocumentBase):
    pass

class PolicyDocumentResponse(PolicyDocumentBase):
    id: int
    original_filename: str
    stored_filepath: str
    file_type: str
    file_size_bytes: int
    page_count: int
    summary_notes: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class PolicySearchMatch(BaseModel):
    document_id: int
    document_title: str
    circular_no: Optional[str] = None
    issuing_authority: str
    issue_date: Optional[date] = None
    policy_category: str
    page_number: int
    matched_snippet: str
    relevance_score: int
