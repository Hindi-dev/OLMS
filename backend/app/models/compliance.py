from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Float, Text, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database import Base

class QprSubmission(Base):
    __tablename__ = "qpr_submissions"

    id = Column(Integer, primary_key=True, index=True)
    year = Column(Integer, nullable=False) # e.g. 2026
    quarter = Column(String(10), nullable=False) # Q1 (Apr-Jun), Q2 (Jul-Sep), Q3 (Oct-Dec), Q4 (Jan-Mar)
    office_name = Column(String(200), nullable=False)
    office_region = Column(String(10), default="A") # Region A, B, or C (क, ख, ग)
    
    # Correspondence Statistics (पत्राचार आंकड़े)
    letters_to_region_a_hi = Column(Integer, default=0)
    letters_to_region_a_total = Column(Integer, default=0)
    
    letters_to_region_b_hi = Column(Integer, default=0)
    letters_to_region_b_total = Column(Integer, default=0)

    letters_to_region_c_hi = Column(Integer, default=0)
    letters_to_region_c_total = Column(Integer, default=0)
    
    # Letters received in Hindi (हिंदी में प्राप्त पत्र)
    letters_received_hindi = Column(Integer, default=0)
    letters_replied_hindi = Column(Integer, default=0) # Rule 5 mandate: 100% replied in Hindi
    
    # Computer usage & typing (कंप्यूटर एवं ई-मेल पर हिंदी प्रयोग)
    total_computers = Column(Integer, default=0)
    computers_with_hindi_facility = Column(Integer, default=0)
    
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    section3_3_items = relationship("QprSection33Item", back_populates="qpr", cascade="all, delete-orphan")


class QprSection33Item(Base):
    __tablename__ = "qpr_section3_3_items"

    id = Column(Integer, primary_key=True, index=True)
    qpr_id = Column(Integer, ForeignKey("qpr_submissions.id", ondelete="CASCADE"), nullable=False)
    document_category = Column(String(200), nullable=False) # e.g. General Orders, Circulars, Contracts, Notifications
    total_issued = Column(Integer, default=0)
    bilingual_issued = Column(Integer, default=0)
    only_english_issued = Column(Integer, default=0) # Direct violation count if > 0
    compliance_percent = Column(Float, default=100.0)

    qpr = relationship("QprSubmission", back_populates="section3_3_items")
