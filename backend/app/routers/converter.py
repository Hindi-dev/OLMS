import shutil
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from backend.app.config import UPLOAD_DIR, OUTPUT_DIR
from backend.app.services.converter import convert_pdf_to_docx, get_pdf_info

router = APIRouter(prefix="/api/converter", tags=["Document Converter"])

@router.post("/inspect")
async def inspect_pdf(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    file_path = UPLOAD_DIR / f"temp_{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    try:
        info = get_pdf_info(file_path)
        return {"filename": file.filename, **info}
    finally:
        if file_path.exists():
            file_path.unlink()

@router.post("/convert")
async def convert_file(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    # Save uploaded PDF
    clean_stem = Path(file.filename).stem
    safe_name = "".join(c for c in clean_stem if c.isalnum() or c in ("-", "_", " ")).strip() or "document"
    uploaded_pdf = UPLOAD_DIR / f"{safe_name}.pdf"
    
    with open(uploaded_pdf, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    output_docx = OUTPUT_DIR / f"{safe_name}_converted.docx"

    try:
        result = convert_pdf_to_docx(uploaded_pdf, output_docx)
        return {
            **result,
            "filename": f"{safe_name}_converted.docx",
            "download_url": f"/api/converter/download/{safe_name}_converted.docx"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Conversion error: {str(e)}")

@router.get("/download/{filename}")
async def download_converted_file(filename: str):
    file_path = OUTPUT_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Converted file not found.")
    
    return FileResponse(
        path=str(file_path),
        filename=filename,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )
