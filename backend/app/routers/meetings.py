from typing import List, Optional
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.meeting import OlicMeeting, MeetingAgenda, MeetingResolution, ActionTakenReport
from backend.app.schemas.meeting import (
    OlicMeetingCreate, OlicMeetingResponse,
    ActionTakenReportCreate, ActionTakenReportResponse
)
from backend.app.services.minutes_builder import generate_olic_minutes_docx

router = APIRouter(prefix="/api/meetings", tags=["OLIC / TOLIC Minutes & Action-Taken Tracker (ATR)"])

@router.get("/", response_model=List[OlicMeetingResponse])
def get_meetings(meeting_type: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(OlicMeeting)
    if meeting_type:
        query = query.filter(OlicMeeting.meeting_type == meeting_type.upper())
    return query.order_by(OlicMeeting.meeting_date.desc(), OlicMeeting.id.desc()).all()

@router.post("/", response_model=OlicMeetingResponse)
def create_meeting(meeting_in: OlicMeetingCreate, db: Session = Depends(get_db)):
    meeting = OlicMeeting(
        meeting_type=meeting_in.meeting_type,
        meeting_number=meeting_in.meeting_number,
        quarter=meeting_in.quarter,
        financial_year=meeting_in.financial_year,
        meeting_date=meeting_in.meeting_date,
        venue=meeting_in.venue,
        chairperson_name=meeting_in.chairperson_name,
        chairperson_designation=meeting_in.chairperson_designation,
        attendees_list=meeting_in.attendees_list
    )
    db.add(meeting)
    db.flush()

    for ag_item in meeting_in.agenda_items:
        agenda = MeetingAgenda(
            meeting_id=meeting.id,
            item_number=ag_item.item_number,
            title_hi=ag_item.title_hi,
            title_en=ag_item.title_en,
            discussion_summary=ag_item.discussion_summary
        )
        db.add(agenda)
        db.flush()

        for res in ag_item.resolutions:
            resolution = MeetingResolution(
                agenda_id=agenda.id,
                resolution_number=res.resolution_number,
                decision_text_hi=res.decision_text_hi,
                responsible_officer=res.responsible_officer,
                responsible_department=res.responsible_department,
                target_date=res.target_date,
                resolution_status=res.resolution_status or "Open"
            )
            db.add(resolution)

    db.commit()
    db.refresh(meeting)
    return meeting

@router.get("/{id}", response_model=OlicMeetingResponse)
def get_meeting(id: int, db: Session = Depends(get_db)):
    meeting = db.query(OlicMeeting).filter(OlicMeeting.id == id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meeting

@router.post("/{id}/generate-minutes")
def generate_minutes(id: int, db: Session = Depends(get_db)):
    meeting = db.query(OlicMeeting).filter(OlicMeeting.id == id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    filepath = generate_olic_minutes_docx(meeting, meeting.agenda_items)
    meeting.minutes_filepath = filepath
    db.commit()

    filename = Path(filepath).name
    return {
        "success": True,
        "message": "Minutes document generated successfully",
        "filename": filename,
        "download_url": f"/api/meetings/download-minutes/{filename}"
    }

@router.get("/download-minutes/{filename}")
def download_minutes_file(filename: str):
    from backend.app.config import OUTPUT_DIR
    file_path = OUTPUT_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Minutes file not found")
    
    return FileResponse(
        path=str(file_path),
        filename=filename,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )

@router.get("/atr/all")
def get_all_resolutions_with_atr(status: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(MeetingResolution).join(MeetingAgenda).join(OlicMeeting)
    if status:
        query = query.filter(MeetingResolution.resolution_status == status)
    
    resolutions = query.all()
    result = []
    for r in resolutions:
        result.append({
            "resolution_id": r.id,
            "resolution_number": r.resolution_number,
            "decision_text_hi": r.decision_text_hi,
            "responsible_officer": r.responsible_officer,
            "responsible_department": r.responsible_department,
            "target_date": r.target_date,
            "resolution_status": r.resolution_status,
            "meeting_quarter": r.agenda.meeting.quarter,
            "financial_year": r.agenda.meeting.financial_year,
            "meeting_type": r.agenda.meeting.meeting_type,
            "atrs": [
                {
                    "id": a.id,
                    "report_date": a.report_date,
                    "action_taken_summary": a.action_taken_summary,
                    "current_status": a.current_status,
                    "reporting_officer": a.reporting_officer
                } for a in r.atrs
            ]
        })
    return result

@router.post("/atr/record", response_model=ActionTakenReportResponse)
def record_atr(atr_in: ActionTakenReportCreate, db: Session = Depends(get_db)):
    res = db.query(MeetingResolution).filter(MeetingResolution.id == atr_in.resolution_id).first()
    if not res:
        raise HTTPException(status_code=404, detail="Resolution not found")
        
    atr = ActionTakenReport(**atr_in.model_dump())
    res.resolution_status = atr_in.current_status
    db.add(atr)
    db.commit()
    db.refresh(atr)
    return atr
