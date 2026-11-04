from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database import Base

class DakRecord(Base):
    __tablename__ = "dak_records"

    id = Column(Integer, primary_key=True, index=True)
    dak_unique_no = Column(String(50), unique=True, index=True, nullable=False) # e.g. DAK/2026/001
    receipt_date = Column(Date, default=date.today, nullable=False)
    letter_no = Column(String(100), nullable=True)
    letter_date = Column(Date, nullable=True)
    sender_name = Column(String(150), nullable=True)
    sender_department = Column(String(200), nullable=True)
    sender_region = Column(String(10), default="A") # Region A, B, or C (क, ख, ग क्षेत्र)
    
    subject_hi = Column(String(300), nullable=False) # Devanagari Unicode
    subject_en = Column(String(300), nullable=True)
    category = Column(String(50), default="General") # General, Policy, Training, Translation, Section 3(3), Parliament Question
    priority = Column(String(30), default="Normal") # Normal, Urgent, Immediate, Top Priority
    target_date = Column(Date, nullable=True)
    current_status = Column(String(30), default="Pending") # Pending, In Progress, Disposed, Transferred
    assigned_to = Column(String(150), nullable=True)
    summary_notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    actions = relationship("DakAction", back_populates="dak", cascade="all, delete-orphan")
    attachments = relationship("DakAttachment", back_populates="dak", cascade="all, delete-orphan")


class DakAction(Base):
    __tablename__ = "dak_actions"

    id = Column(Integer, primary_key=True, index=True)
    dak_id = Column(Integer, ForeignKey("dak_records.id", ondelete="CASCADE"), nullable=False)
    action_date = Column(Date, default=date.today)
    action_taken_by = Column(String(150), nullable=False)
    action_details = Column(Text, nullable=False)
    status_after_action = Column(String(30), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    dak = relationship("DakRecord", back_populates="actions")


class DakAttachment(Base):
    __tablename__ = "dak_attachments"

    id = Column(Integer, primary_key=True, index=True)
    dak_id = Column(Integer, ForeignKey("dak_records.id", ondelete="CASCADE"), nullable=False)
    original_filename = Column(String(255), nullable=False)
    stored_filepath = Column(String(500), nullable=False)
    file_type = Column(String(50), nullable=True)
    file_size_bytes = Column(Integer, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    dak = relationship("DakRecord", back_populates="attachments")
