from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class GovEmailConfigBase(BaseModel):
    email_address: str
    display_name: Optional[str] = None
    imap_server: str = "imap.mail.gov.in"
    imap_port: int = 993
    imap_use_ssl: bool = True
    smtp_server: str = "smtp.mail.gov.in"
    smtp_port: int = 465
    smtp_use_ssl: bool = True
    app_password: Optional[str] = None
    folder_name: str = "INBOX"
    fetch_filter: str = "UNSEEN"
    fetch_limit: int = 15
    auto_mark_read: bool = False

class GovEmailConfigCreate(GovEmailConfigBase):
    pass

class GovEmailConfigUpdate(BaseModel):
    email_address: Optional[str] = None
    display_name: Optional[str] = None
    imap_server: Optional[str] = None
    imap_port: Optional[int] = None
    imap_use_ssl: Optional[bool] = None
    smtp_server: Optional[str] = None
    smtp_port: Optional[int] = None
    smtp_use_ssl: Optional[bool] = None
    app_password: Optional[str] = None
    folder_name: Optional[str] = None
    fetch_filter: Optional[str] = None
    fetch_limit: Optional[int] = None
    auto_mark_read: Optional[bool] = None

class GovEmailConfigResponse(BaseModel):
    id: int
    email_address: str
    display_name: Optional[str] = None
    imap_server: str
    imap_port: int
    imap_use_ssl: bool
    smtp_server: str
    smtp_port: int
    smtp_use_ssl: bool
    has_password: bool
    folder_name: str
    fetch_filter: str
    fetch_limit: int
    auto_mark_read: bool
    last_sync_at: Optional[datetime] = None
    last_sync_status: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class EmailTestRequest(BaseModel):
    email_address: Optional[str] = None
    app_password: Optional[str] = None
    imap_server: Optional[str] = "imap.mail.gov.in"
    imap_port: Optional[int] = 993
    imap_use_ssl: Optional[bool] = True

class EmailTestResponse(BaseModel):
    success: bool
    message: str
    folders: List[str] = []

class EmailSyncResponse(BaseModel):
    success: bool
    message: str
    synced_count: int = 0
    skipped_count: int = 0
    items: List[dict] = []
