from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class GlossaryTermBase(BaseModel):
    english_term: str
    hindi_term: str
    alternate_terms: Optional[str] = None
    domain: Optional[str] = "Administration"
    authority_source: Optional[str] = "CSTT"
    example_sentence: Optional[str] = None

class GlossaryTermCreate(GlossaryTermBase):
    pass

class GlossaryTermResponse(GlossaryTermBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class TranslationMemoryBase(BaseModel):
    source_text: str
    target_text: str
    source_lang: Optional[str] = "en"
    target_lang: Optional[str] = "hi"
    domain: Optional[str] = "Administration"
    context_notes: Optional[str] = None
    reference_circular_no: Optional[str] = None

class TranslationMemoryCreate(TranslationMemoryBase):
    pass

class TranslationMemoryResponse(TranslationMemoryBase):
    id: int
    usage_count: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
