from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from backend.app.database import Base

class GovEmailConfig(Base):
    __tablename__ = "gov_email_configs"

    id = Column(Integer, primary_key=True, index=True)
    email_address = Column(String(150), nullable=False)
    display_name = Column(String(150), nullable=True)
    
    imap_server = Column(String(150), default="imap.mail.gov.in", nullable=False)
    imap_port = Column(Integer, default=993, nullable=False)
    imap_use_ssl = Column(Boolean, default=True, nullable=False)
    
    smtp_server = Column(String(150), default="smtp.mail.gov.in", nullable=False)
    smtp_port = Column(Integer, default=465, nullable=False)
    smtp_use_ssl = Column(Boolean, default=True, nullable=False)
    
    app_password = Column(String(255), nullable=True)
    folder_name = Column(String(100), default="INBOX", nullable=False)
    fetch_filter = Column(String(50), default="UNSEEN", nullable=False) # UNSEEN or ALL_RECENT
    fetch_limit = Column(Integer, default=15, nullable=False)
    auto_mark_read = Column(Boolean, default=False, nullable=False)
    
    last_sync_at = Column(DateTime, nullable=True)
    last_sync_status = Column(String(255), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
