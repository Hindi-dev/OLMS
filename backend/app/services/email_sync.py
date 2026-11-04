import imaplib
import email
from email.header import decode_header
from email.utils import parseaddr, parsedate_to_datetime
import re
import socket
import ssl
from pathlib import Path
from datetime import date, datetime
from typing import List, Dict, Any, Tuple, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.config import UPLOAD_DIR
from backend.app.models.dak import DakRecord, DakAttachment
from backend.app.models.email_config import GovEmailConfig

def decode_mime_header(header_val: Optional[str]) -> str:
    """Decodes MIME encoded header string (RFC 2047) to clean UTF-8 string."""
    if not header_val:
        return ""
    try:
        decoded_fragments = decode_header(header_val)
        parts = []
        for content, enc in decoded_fragments:
            if isinstance(content, bytes):
                encoding = enc.lower() if enc else "utf-8"
                if encoding in ["gb2312", "windows-1252"]:
                    encoding = "utf-8"
                try:
                    parts.append(content.decode(encoding, errors="replace"))
                except Exception:
                    parts.append(content.decode("utf-8", errors="replace"))
            else:
                parts.append(str(content))
        return "".join(parts).strip()
    except Exception:
        return str(header_val)

def sanitize_filename(name: str) -> str:
    """Removes unsafe characters from attachment filenames."""
    cleaned = re.sub(r'[\\/*?:"<>|]', "", name)
    return cleaned.strip() or "attachment.dat"

def infer_department_from_email(email_addr: str) -> str:
    """Infers Indian government ministry or department from email domain."""
    if not email_addr or "@" not in email_addr:
        return "केंद्रीय सरकार (Central Govt)"
    domain = email_addr.split("@")[-1].lower()
    
    dept_map = {
        "mha.gov.in": "गृह मंत्रालय (Ministry of Home Affairs)",
        "rajbhasha.gov.in": "राजभाषा विभाग (Department of Official Language)",
        "dopt.gov.in": "कार्मिक एवं प्रशिक्षण विभाग (DoPT)",
        "nic.in": "राष्ट्रीय सूचना विज्ञान केंद्र (NIC)",
        "gov.in": "भारत सरकार (Government of India)",
        "finmin.nic.in": "वित्त मंत्रालय (Ministry of Finance)",
        "mod.gov.in": "रक्षा मंत्रालय (Ministry of Defence)",
        "mea.gov.in": "विदेश मंत्रालय (Ministry of External Affairs)",
        "railnet.gov.in": "रेल मंत्रालय (Ministry of Railways)",
        "mofpi.gov.in": "खाद्य प्रसंस्करण उद्योग मंत्रालय",
        "education.gov.in": "शिक्षा मंत्रालय (Ministry of Education)",
    }
    
    for key, val in dept_map.items():
        if key in domain:
            return val
    return f"विभागीय ईमेल ({domain})"

def get_next_dak_number(db: Session) -> str:
    current_year = date.today().year
    prefix = f"DAK/{current_year}/"
    last_record = db.query(DakRecord).filter(DakRecord.dak_unique_no.like(f"{prefix}%")).order_by(DakRecord.id.desc()).first()
    
    if last_record and last_record.dak_unique_no:
        try:
            seq = int(last_record.dak_unique_no.split("/")[-1])
            return f"{prefix}{seq + 1:04d}"
        except Exception:
            pass
    total = db.query(func.count(DakRecord.id)).scalar() or 0
    return f"{prefix}{total + 1:04d}"

class GovEmailService:

    @staticmethod
    def test_connection(
        email_address: str, 
        app_password: str, 
        imap_server: str = "imap.mail.gov.in", 
        imap_port: int = 993, 
        use_ssl: bool = True
    ) -> Tuple[bool, str, List[str]]:
        """Tests IMAP connection to mail.gov.in with detailed step-by-step diagnostics."""
        if not email_address or not email_address.strip():
            return False, "कृपया अपना सरकारी ईमेल पता (उदा. @nic.in या @gov.in) दर्ज करें।", []
        if not app_password or not app_password.strip():
            return False, "कृपया कवच ऐप पासवर्ड (Kavach App-Specific Password) दर्ज करें।", []
        
        server_clean = imap_server.strip()
        port_clean = int(imap_port)

        # 1. DNS Resolution Check
        try:
            ip = socket.gethostbyname(server_clean)
        except Exception:
            return False, f"डीएनएस (DNS) त्रुटि: सर्वर पता '{server_clean}' इंटरनेट पर नहीं मिल सका। कृपया सर्वर नाम या इंटरनेट कनेक्शन जांचें।", []

        # 2. Port Reachability Check (3.5s timeout)
        test_sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        test_sock.settimeout(3.5)
        try:
            test_sock.connect((ip, port_clean))
            test_sock.close()
        except (socket.timeout, socket.error):
            return False, (
                f"पोर्ट {port_clean} पर सर्वर ({server_clean}) से संपर्क नहीं हो सका (Connection Timed Out)।\n\n"
                f"📌 महत्वपूर्ण सुरक्षा कारण (NIC Cyber Security Policy):\n"
                f"भारत सरकार (NIC) की आधिकारिक सुरक्षा नीति के अनुसार, mail.gov.in का IMAP (पोर्ट 993) केवल सरकारी कार्यालयीन नेटवर्क (NICNET / LAN) अथवा NIC VPN (कवच) कनेक्ट होने पर ही एक्सेस होता है। सामान्य होम इंटरनेट/मोबाइल नेटवर्क पर NIC फ़ायरवॉल पोर्ट 993 को ब्लॉक रखता है।\n\n"
                f"💡 समाधान:\n"
                f"1. यदि संभव हो तो NIC VPN ऑन करके पुनः प्रयास करें।\n"
                f"2. अथवा आप बिना VPN के भी NIC वेबमेल से किसी भी ईमेल को '.eml फ़ाइल' के रूप में सेव करके सीधे डाक ट्रैकर में ड्रैग-एंड-ड्रॉप कर सकते हैं।"
            ), []

        # 3. IMAP SSL Handshake & Login
        mail = None
        old_timeout = socket.getdefaulttimeout()
        try:
            socket.setdefaulttimeout(8.0)
            ssl_context = ssl.create_default_context()
            if use_ssl:
                mail = imaplib.IMAP4_SSL(host=server_clean, port=port_clean, ssl_context=ssl_context, timeout=8.0)
            else:
                mail = imaplib.IMAP4(host=server_clean, port=port_clean, timeout=8.0)
            
            mail.login(email_address.strip(), app_password.strip())
            typ, folder_data = mail.list()
            
            folders = []
            if typ == "OK" and folder_data:
                for f in folder_data:
                    if f and isinstance(f, bytes):
                        decoded_f = f.decode("utf-8", errors="ignore")
                        match = re.search(r'"([^"]+)"$', decoded_f) or re.search(r'([^\s]+)$', decoded_f)
                        if match:
                            folder_name = match.group(1).replace('"', '').strip()
                            if folder_name:
                                folders.append(folder_name)
                                
            if "INBOX" not in folders:
                folders.insert(0, "INBOX")
                
            mail.logout()
            return True, f"सफल! '{email_address}' से mail.gov.in सर्वर सफलतापूर्वक कनेक्ट हो गया है।", folders

        except imaplib.IMAP4.error as e:
            err_msg = str(e)
            if "AUTHENTICATIONFAILED" in err_msg.upper() or "LOGIN" in err_msg.upper():
                return False, "प्रमाणीकरण विफल (Authentication Failed): उपयोगकर्ता नाम अथवा कवच ऐप पासवर्ड (App Password) अमान्य है। कृपया सुनिश्चित करें कि आप सामान्य वेबमेल पासवर्ड के बजाय Kavach Webmail ➔ Preferences ➔ Security ➔ App Passwords से जनरेट किया गया ऐप-पासवर्ड दर्ज कर रहे हैं।", []
            return False, f"IMAP सर्वर त्रुटि: {err_msg}", []
        except socket.timeout:
            return False, "कनेक्शन समय समाप्त (Socket Timeout)। कृपया इंटरनेट या VPN कनेक्टिविटी जांचें।", []
        except Exception as e:
            return False, f"सर्वर से कनेक्ट करने में त्रुटि: {str(e)}", []
        finally:
            socket.setdefaulttimeout(old_timeout)
            try:
                if mail:
                    mail.logout()
            except Exception:
                pass

    @staticmethod
    def sync_inward_dak(config: GovEmailConfig, db: Session) -> Dict[str, Any]:
        """Connects to mail.gov.in via IMAP and ingests unread or recent emails as Inward Dak."""
        if not config.email_address or not config.app_password:
            return {
                "success": False,
                "message": "ईमेल पता या पासवर्ड कॉन्फ़िगर नहीं किया गया है।",
                "synced_count": 0,
                "skipped_count": 0,
                "items": []
            }
            
        mail = None
        synced_items = []
        skipped_count = 0
        
        try:
            ssl_context = ssl.create_default_context()
            if config.imap_use_ssl:
                mail = imaplib.IMAP4_SSL(host=config.imap_server, port=config.imap_port, ssl_context=ssl_context)
            else:
                mail = imaplib.IMAP4(host=config.imap_server, port=config.imap_port)
                
            mail.login(config.email_address.strip(), config.app_password.strip())
            
            # Select target folder
            target_folder = f'"{config.folder_name}"' if " " in config.folder_name else config.folder_name
            status, _ = mail.select(target_folder)
            if status != "OK":
                # Fallback to INBOX
                mail.select("INBOX")
            
            # Search criteria
            search_crit = config.fetch_filter if config.fetch_filter in ["UNSEEN", "ALL"] else "UNSEEN"
            typ, data = mail.search(None, search_crit)
            if typ != "OK" or not data or not data[0]:
                config.last_sync_at = datetime.utcnow()
                config.last_sync_status = "सफल: कोई नया अनरीड ईमेल नहीं मिला。"
                db.commit()
                return {
                    "success": True,
                    "message": "कोई नया ईमेल नहीं मिला। आपका इनबॉक्स अद्यतन है।",
                    "synced_count": 0,
                    "skipped_count": 0,
                    "items": []
                }
            
            mail_ids = data[0].split()
            # Fetch latest N emails
            fetch_limit = min(config.fetch_limit or 15, 30)
            target_ids = mail_ids[-fetch_limit:]
            target_ids.reverse() # Newest first
            
            for m_id in target_ids:
                try:
                    res, msg_data = mail.fetch(m_id, "(RFC822)")
                    if res != "OK" or not msg_data or not msg_data[0]:
                        continue
                        
                    raw_email = msg_data[0][1]
                    msg = email.message_from_bytes(raw_email)
                    
                    # 1. Message ID & check duplicate
                    msg_id_header = msg.get("Message-ID", "").strip()
                    if msg_id_header:
                        existing = db.query(DakRecord).filter(
                            DakRecord.summary_notes.contains(msg_id_header)
                        ).first()
                        if existing:
                            skipped_count += 1
                            continue
                            
                    # 2. Extract Subject
                    raw_subject = msg.get("Subject", "बिना विषय का ईमेल")
                    subject = decode_mime_header(raw_subject) or "सरकारी ईमेल पत्राचार"
                    
                    # 3. Extract Sender
                    from_header = msg.get("From", "")
                    real_name, sender_email = parseaddr(from_header)
                    sender_display = decode_mime_header(real_name) or sender_email or "सरकारी प्रेषक"
                    sender_dept = infer_department_from_email(sender_email)
                    
                    # 4. Extract Date
                    date_header = msg.get("Date")
                    letter_date_val = date.today()
                    if date_header:
                        try:
                            parsed_dt = parsedate_to_datetime(date_header)
                            if parsed_dt:
                                letter_date_val = parsed_dt.date()
                        except Exception:
                            pass
                            
                    # 5. Extract Priority from Subject/Headers
                    priority = "Normal"
                    subj_lower = subject.lower()
                    if any(w in subj_lower for w in ["अति आवश्यक", "तत्काल", "urgent", "immediate", "top priority", "समय-सीमा"]):
                        priority = "Urgent"
                    
                    # 6. Extract Body and Attachments
                    body_text_parts = []
                    attachments_to_save = []
                    
                    if msg.is_multipart():
                        for part in msg.walk():
                            content_type = part.get_content_type()
                            content_disposition = str(part.get("Content-Disposition", ""))
                            filename = part.get_filename()
                            
                            if filename or "attachment" in content_disposition.lower():
                                clean_name = decode_mime_header(filename) or "संलग्नक"
                                clean_name = sanitize_filename(clean_name)
                                payload = part.get_payload(decode=True)
                                if payload:
                                    attachments_to_save.append((clean_name, payload, content_type))
                            elif content_type == "text/plain" and "attachment" not in content_disposition.lower():
                                charset = part.get_content_charset() or "utf-8"
                                try:
                                    payload = part.get_payload(decode=True)
                                    if payload:
                                        body_text_parts.append(payload.decode(charset, errors="replace"))
                                except Exception:
                                    pass
                    else:
                        charset = msg.get_content_charset() or "utf-8"
                        try:
                            payload = msg.get_payload(decode=True)
                            if payload:
                                body_text_parts.append(payload.decode(charset, errors="replace"))
                        except Exception:
                            pass
                            
                    full_body = "\n".join(body_text_parts).strip()
                    body_snippet = (full_body[:400] + "...") if len(full_body) > 400 else full_body
                    
                    # Summary notes with tracking tag
                    notes = f"मूल प्रेषक: {sender_display} <{sender_email}>\n"
                    if body_snippet:
                        notes += f"ईमेल सारांश:\n{body_snippet}\n"
                    notes += f"\n[ईमेल स्रोत: mail.gov.in | Message-ID: {msg_id_header}]"
                    
                    # 7. Create Dak Record
                    dak_no = get_next_dak_number(db)
                    dak = DakRecord(
                        dak_unique_no=dak_no,
                        receipt_date=date.today(),
                        letter_no=msg.get("X-Letter-No") or f"EMAIL-{m_id.decode() if isinstance(m_id, bytes) else m_id}",
                        letter_date=letter_date_val,
                        sender_name=sender_display,
                        sender_department=sender_dept,
                        sender_region="A",
                        subject_hi=subject,
                        subject_en=None,
                        category="General",
                        priority=priority,
                        current_status="Pending",
                        assigned_to=config.display_name or config.email_address,
                        summary_notes=notes
                    )
                    db.add(dak)
                    db.flush() # get dak.id
                    
                    # 8. Save Attachments
                    for fname, fpayload, ftype in attachments_to_save:
                        stored_name = f"email_dak_{dak.id}_{fname}"
                        file_path = UPLOAD_DIR / stored_name
                        with open(file_path, "wb") as f_out:
                            f_out.write(fpayload)
                            
                        att = DakAttachment(
                            dak_id=dak.id,
                            original_filename=fname,
                            stored_filepath=str(file_path),
                            file_type=ftype,
                            file_size_bytes=len(fpayload)
                        )
                        db.add(att)
                        
                    db.commit()
                    
                    # Optional: Mark as seen on server if configured
                    if config.auto_mark_read:
                        mail.store(m_id, "+FLAGS", "\\Seen")
                        
                    synced_items.append({
                        "dak_unique_no": dak.dak_unique_no,
                        "subject": subject,
                        "sender": sender_display,
                        "attachments_count": len(attachments_to_save)
                    })
                    
                except Exception as item_err:
                    print(f"Error processing email {m_id}: {item_err}")
                    continue
                    
            config.last_sync_at = datetime.utcnow()
            config.last_sync_status = f"सफल: {len(synced_items)} नई डाक पंजीकृत, {skipped_count} पूर्व से दर्ज।"
            db.commit()
            
            return {
                "success": True,
                "message": f"सफलतापूर्वक {len(synced_items)} नई डाक mail.gov.in से आयात की गईं ({skipped_count} पहले से मौजूद डाक छोड़ी गईं)।",
                "synced_count": len(synced_items),
                "skipped_count": skipped_count,
                "items": synced_items
            }
            
        except Exception as e:
            return {
                "success": False,
                "message": f"ईमेल सिंक के दौरान त्रुटि: {str(e)}",
                "synced_count": len(synced_items),
                "skipped_count": skipped_count,
                "items": synced_items
            }
        finally:
            socket.setdefaulttimeout(old_timeout)
            try:
                if mail:
                    mail.logout()
            except Exception:
                pass
