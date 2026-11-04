from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from backend.app.database import get_db
from backend.app.models.email_config import GovEmailConfig
from backend.app.schemas.email_config import (
    GovEmailConfigCreate,
    GovEmailConfigUpdate,
    GovEmailConfigResponse,
    EmailTestRequest,
    EmailTestResponse,
    EmailSyncResponse
)
from backend.app.services.email_sync import GovEmailService

router = APIRouter(prefix="/api/email", tags=["Gov Email Integration"])

@router.get("/config")
def get_email_config(db: Session = Depends(get_db)):
    config = db.query(GovEmailConfig).first()
    if not config:
        return {
            "id": None,
            "email_address": "",
            "display_name": "",
            "imap_server": "imap.mail.gov.in",
            "imap_port": 993,
            "imap_use_ssl": True,
            "smtp_server": "smtp.mail.gov.in",
            "smtp_port": 465,
            "smtp_use_ssl": True,
            "has_password": False,
            "folder_name": "INBOX",
            "fetch_filter": "UNSEEN",
            "fetch_limit": 15,
            "auto_mark_read": False,
            "last_sync_at": None,
            "last_sync_status": "अभी तक कॉन्फ़िगर नहीं किया गया"
        }
        
    return {
        "id": config.id,
        "email_address": config.email_address,
        "display_name": config.display_name,
        "imap_server": config.imap_server,
        "imap_port": config.imap_port,
        "imap_use_ssl": config.imap_use_ssl,
        "smtp_server": config.smtp_server,
        "smtp_port": config.smtp_port,
        "smtp_use_ssl": config.smtp_use_ssl,
        "has_password": bool(config.app_password),
        "folder_name": config.folder_name,
        "fetch_filter": config.fetch_filter,
        "fetch_limit": config.fetch_limit,
        "auto_mark_read": config.auto_mark_read,
        "last_sync_at": config.last_sync_at,
        "last_sync_status": config.last_sync_status
    }

@router.post("/config")
def save_email_config(config_in: GovEmailConfigCreate, db: Session = Depends(get_db)):
    config = db.query(GovEmailConfig).first()
    
    if not config:
        config = GovEmailConfig(
            email_address=config_in.email_address.strip(),
            display_name=config_in.display_name,
            imap_server=config_in.imap_server.strip(),
            imap_port=config_in.imap_port,
            imap_use_ssl=config_in.imap_use_ssl,
            smtp_server=config_in.smtp_server.strip(),
            smtp_port=config_in.smtp_port,
            smtp_use_ssl=config_in.smtp_use_ssl,
            app_password=config_in.app_password.strip() if config_in.app_password else None,
            folder_name=config_in.folder_name or "INBOX",
            fetch_filter=config_in.fetch_filter or "UNSEEN",
            fetch_limit=config_in.fetch_limit or 15,
            auto_mark_read=config_in.auto_mark_read
        )
        db.add(config)
    else:
        config.email_address = config_in.email_address.strip()
        config.display_name = config_in.display_name
        config.imap_server = config_in.imap_server.strip()
        config.imap_port = config_in.imap_port
        config.imap_use_ssl = config_in.imap_use_ssl
        config.smtp_server = config_in.smtp_server.strip()
        config.smtp_port = config_in.smtp_port
        config.smtp_use_ssl = config_in.smtp_use_ssl
        if config_in.app_password and config_in.app_password.strip():
            config.app_password = config_in.app_password.strip()
        config.folder_name = config_in.folder_name or "INBOX"
        config.fetch_filter = config_in.fetch_filter or "UNSEEN"
        config.fetch_limit = config_in.fetch_limit or 15
        config.auto_mark_read = config_in.auto_mark_read
        
    db.commit()
    db.refresh(config)
    
    return {
        "success": True,
        "message": "ईमेल सेटिंग्स सफलतापूर्वक सहेजी गईं।",
        "has_password": bool(config.app_password)
    }

@router.post("/test", response_model=EmailTestResponse)
def test_email_connection(req: EmailTestRequest, db: Session = Depends(get_db)):
    config = db.query(GovEmailConfig).first()
    
    # Resolve email and password
    email_address = req.email_address or (config.email_address if config else None)
    app_password = req.app_password or (config.app_password if config else None)
    imap_server = req.imap_server or (config.imap_server if config else "imap.mail.gov.in")
    imap_port = req.imap_port or (config.imap_port if config else 993)
    imap_use_ssl = req.imap_use_ssl if req.imap_use_ssl is not None else (config.imap_use_ssl if config else True)
    
    if not email_address or not app_password:
        return EmailTestResponse(
            success=False,
            message="कृपया ईमेल पता और कवच ऐप-पासवर्ड (App Password) दर्ज करें।",
            folders=[]
        )
        
    success, msg, folders = GovEmailService.test_connection(
        email_address=email_address,
        app_password=app_password,
        imap_server=imap_server,
        imap_port=imap_port,
        use_ssl=imap_use_ssl
    )
    
    return EmailTestResponse(success=success, message=msg, folders=folders)

@router.post("/sync", response_model=EmailSyncResponse)
def sync_email_dak(db: Session = Depends(get_db)):
    config = db.query(GovEmailConfig).first()
    if not config or not config.email_address or not config.app_password:
        return EmailSyncResponse(
            success=False,
            message="कृपया पहले सेटिंग्स में mail.gov.in ईमेल एवं कवच ऐप-पासवर्ड कॉन्फ़िगर करें।",
            synced_count=0,
            skipped_count=0,
            items=[]
        )
        
    res = GovEmailService.sync_inward_dak(config=config, db=db)
    return EmailSyncResponse(
        success=res.get("success", False),
        message=res.get("message", ""),
        synced_count=res.get("synced_count", 0),
        skipped_count=res.get("skipped_count", 0),
        items=res.get("items", [])
    )
