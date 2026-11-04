from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime
from backend.app.database import Base

class GlossaryTerm(Base):
    __tablename__ = "glossary_terms"

    id = Column(Integer, primary_key=True, index=True)
    english_term = Column(String(200), index=True, nullable=False)
    hindi_term = Column(String(250), index=True, nullable=False) # मानक पारिभाषिक शब्दावली
    alternate_terms = Column(String(300), nullable=True)
    domain = Column(String(100), default="Administration") # Administration, Finance, Railway, Legal, Engineering
    authority_source = Column(String(150), default="CSTT") # CSTT, Railway Board, Central Translation Bureau
    example_sentence = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class TranslationMemoryUnit(Base):
    __tablename__ = "translation_memory_units"

    id = Column(Integer, primary_key=True, index=True)
    source_text = Column(Text, nullable=False)
    target_text = Column(Text, nullable=False)
    source_lang = Column(String(10), default="en") # en or hi
    target_lang = Column(String(10), default="hi") # hi or en
    domain = Column(String(100), default="Administration")
    context_notes = Column(Text, nullable=True)
    reference_circular_no = Column(String(150), nullable=True) # Reference Office Order/Circular
    usage_count = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
