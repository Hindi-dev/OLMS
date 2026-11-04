from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database import Base

class OlicMeeting(Base):
    __tablename__ = "olic_meetings"

    id = Column(Integer, primary_key=True, index=True)
    meeting_type = Column(String(50), default="OLIC") # OLIC (राजभाषा कार्यान्वयन समिति) or TOLIC (नराकास)
    meeting_number = Column(String(50), nullable=True) # e.g. 54th Meeting
    quarter = Column(String(20), nullable=False) # Q1, Q2, Q3, Q4
    financial_year = Column(String(20), nullable=False) # e.g. 2025-2026
    meeting_date = Column(Date, default=date.today, nullable=False)
    venue = Column(String(200), nullable=True)
    chairperson_name = Column(String(150), nullable=False)
    chairperson_designation = Column(String(150), nullable=False)
    attendees_list = Column(Text, nullable=True)
    minutes_filepath = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    agenda_items = relationship("MeetingAgenda", back_populates="meeting", cascade="all, delete-orphan")


class MeetingAgenda(Base):
    __tablename__ = "meeting_agenda"

    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("olic_meetings.id", ondelete="CASCADE"), nullable=False)
    item_number = Column(Integer, nullable=False)
    title_hi = Column(String(300), nullable=False)
    title_en = Column(String(300), nullable=True)
    discussion_summary = Column(Text, nullable=True)

    meeting = relationship("OlicMeeting", back_populates="agenda_items")
    resolutions = relationship("MeetingResolution", back_populates="agenda", cascade="all, delete-orphan")


class MeetingResolution(Base):
    __tablename__ = "meeting_resolutions"

    id = Column(Integer, primary_key=True, index=True)
    agenda_id = Column(Integer, ForeignKey("meeting_agenda.id", ondelete="CASCADE"), nullable=False)
    resolution_number = Column(String(50), nullable=False)
    decision_text_hi = Column(Text, nullable=False)
    responsible_officer = Column(String(150), nullable=False)
    responsible_department = Column(String(150), nullable=False)
    target_date = Column(Date, nullable=True)
    resolution_status = Column(String(30), default="Open") # Open, In-Progress, Complied

    agenda = relationship("MeetingAgenda", back_populates="resolutions")
    atrs = relationship("ActionTakenReport", back_populates="resolution", cascade="all, delete-orphan")


class ActionTakenReport(Base):
    __tablename__ = "action_taken_reports"

    id = Column(Integer, primary_key=True, index=True)
    resolution_id = Column(Integer, ForeignKey("meeting_resolutions.id", ondelete="CASCADE"), nullable=False)
    report_date = Column(Date, default=date.today)
    action_taken_summary = Column(Text, nullable=False)
    current_status = Column(String(30), default="Ongoing") # Open, Ongoing, Complied, Closed
    reporting_officer = Column(String(150), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow)

    resolution = relationship("MeetingResolution", back_populates="atrs")
