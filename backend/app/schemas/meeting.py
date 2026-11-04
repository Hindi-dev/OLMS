from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional, List
from datetime import date, datetime

class ActionTakenReportBase(BaseModel):
    report_date: Optional[date] = None
    action_taken_summary: str
    current_status: Optional[str] = "Ongoing"
    reporting_officer: Optional[str] = None

    @field_validator('report_date', mode='before')
    @classmethod
    def empty_str_to_none_atr(cls, v):
        if v == "" or (isinstance(v, str) and not v.strip()):
            return None
        return v

class ActionTakenReportCreate(ActionTakenReportBase):
    resolution_id: int

class ActionTakenReportResponse(ActionTakenReportBase):
    id: int
    resolution_id: int
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class MeetingResolutionBase(BaseModel):
    resolution_number: str
    decision_text_hi: str
    responsible_officer: str
    responsible_department: str
    target_date: Optional[date] = None
    resolution_status: Optional[str] = "Open"

    @field_validator('target_date', mode='before')
    @classmethod
    def empty_str_to_none_res(cls, v):
        if v == "" or (isinstance(v, str) and not v.strip()):
            return None
        return v

class MeetingResolutionCreate(MeetingResolutionBase):
    pass

class MeetingResolutionResponse(MeetingResolutionBase):
    id: int
    agenda_id: int
    atrs: List[ActionTakenReportResponse] = []
    model_config = ConfigDict(from_attributes=True)


class MeetingAgendaBase(BaseModel):
    item_number: int
    title_hi: str
    title_en: Optional[str] = None
    discussion_summary: Optional[str] = None

class MeetingAgendaCreate(MeetingAgendaBase):
    resolutions: List[MeetingResolutionCreate] = []

class MeetingAgendaResponse(MeetingAgendaBase):
    id: int
    meeting_id: int
    resolutions: List[MeetingResolutionResponse] = []
    model_config = ConfigDict(from_attributes=True)


class OlicMeetingBase(BaseModel):
    meeting_type: Optional[str] = "OLIC"
    meeting_number: Optional[str] = None
    quarter: str
    financial_year: str
    meeting_date: Optional[date] = None
    venue: Optional[str] = None
    chairperson_name: str
    chairperson_designation: str
    attendees_list: Optional[str] = None

    @field_validator('meeting_date', mode='before')
    @classmethod
    def empty_str_to_none_meet(cls, v):
        if v == "" or (isinstance(v, str) and not v.strip()):
            return None
        return v

class OlicMeetingCreate(OlicMeetingBase):
    agenda_items: List[MeetingAgendaCreate] = []

class OlicMeetingResponse(OlicMeetingBase):
    id: int
    minutes_filepath: Optional[str] = None
    created_at: datetime
    agenda_items: List[MeetingAgendaResponse] = []
    model_config = ConfigDict(from_attributes=True)
