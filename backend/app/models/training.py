from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database import Base

class TrainingCourse(Base):
    __tablename__ = "training_courses"

    id = Column(Integer, primary_key=True, index=True)
    course_code = Column(String(50), unique=True, index=True, nullable=False) # PRABODH, PRAVEEN, PRAGYA, TYPING, STENO
    name_hi = Column(String(150), nullable=False) # e.g. प्रबोध, प्रवीण, प्राज्ञ, हिंदी टंकण, हिंदी आशुलिपि
    name_en = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    duration_months = Column(Integer, default=6)

    nominations = relationship("TrainingNomination", back_populates="course")


class TrainingNomination(Base):
    __tablename__ = "training_nominations"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    course_id = Column(Integer, ForeignKey("training_courses.id", ondelete="CASCADE"), nullable=False)
    
    # Status: Pending Nomination, Nominated, Under Training, Passed, Exempted, Failed
    status = Column(String(50), default="Pending Nomination", index=True)
    batch_number = Column(String(80), nullable=True) # e.g. January 2026 Batch
    training_center = Column(String(200), nullable=True) # e.g. Hindi Teaching Scheme (केंद्रीय हिंदी प्रशिक्षण संस्थान / CHTI)
    
    nomination_date = Column(Date, nullable=True)
    start_date = Column(Date, nullable=True)
    completion_date = Column(Date, nullable=True)
    result_grade = Column(String(30), nullable=True) # e.g. Distinction, 1st Division, Pass
    cash_award_eligible = Column(String(100), nullable=True) # Incentive / Cash Award per Rajbhasha scheme
    remarks = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    employee = relationship("Employee", back_populates="nominations")
    course = relationship("TrainingCourse", back_populates="nominations")
