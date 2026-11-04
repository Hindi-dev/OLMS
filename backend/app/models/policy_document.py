from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Text, Date, DateTime
from backend.app.database import Base

class PolicyDocument(Base):
    __tablename__ = "policy_documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False) # e.g. "हिंदी में मूल टिप्पण/प्रारूपण हेतु नकद पुरस्कार योजना"
    circular_no = Column(String(120), nullable=True, index=True) # e.g. "No. 11013/02/2024-OL"
    issuing_authority = Column(String(200), default="गृह मंत्रालय, राजभाषा विभाग") # MoHA / Railway Board / DoPT
    issue_date = Column(Date, nullable=True)
    
    # Categories: Annual Programme, Incentives & Cash Awards, Section 3(3), Rules & Notifications, Training & Workshops, General Order
    policy_category = Column(String(80), default="General Order", index=True)
    
    original_filename = Column(String(255), nullable=False)
    stored_filepath = Column(String(500), nullable=False)
    file_type = Column(String(50), default="PDF") # PDF, DOCX, TXT
    file_size_bytes = Column(Integer, default=0)
    page_count = Column(Integer, default=1)
    
    # Extracted full text with page markers for ready reference search
    extracted_text = Column(Text, nullable=False)
    summary_notes = Column(Text, nullable=True) # Key takeaways / notes
    
    created_at = Column(DateTime, default=datetime.utcnow)
