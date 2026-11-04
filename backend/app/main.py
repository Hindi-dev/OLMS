import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.app.config import OUTPUT_DIR, UPLOAD_DIR, BASE_DIR
from backend.app.database import engine, Base
import backend.app.models  # Register all ORM models

from backend.app.routers.converter import router as converter_router
from backend.app.routers.dak import router as dak_router
from backend.app.routers.training import router as training_router
from backend.app.routers.translation import router as translation_router
from backend.app.routers.meetings import router as meetings_router
from backend.app.routers.compliance import router as compliance_router
from backend.app.routers.policy_reference import router as policy_docs_router
from backend.app.routers.email_config import router as email_config_router

# Create all database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="राजभाषा-प्रबंधक (Rajbhasha Prabandhak API)",
    description="Administrative Workflows, Compliance Tracking, Translation Operations & Document Conversion Engine",
    version="1.0.0"
)

# Enable CORS for local Vite development or desktop webview
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount outputs and uploads as static assets
app.mount("/outputs", StaticFiles(directory=str(OUTPUT_DIR)), name="outputs")
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# Include Modular Routers
app.include_router(converter_router)
app.include_router(dak_router)
app.include_router(training_router)
app.include_router(translation_router)
app.include_router(meetings_router)
app.include_router(compliance_router)
app.include_router(policy_docs_router)
app.include_router(email_config_router)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "app_name": "राजभाषा-प्रबंधक (Rajbhasha Prabandhak)",
        "version": "1.0.0",
        "devanagari_encoding": "UTF-8",
        "sqlite_wal_mode": True
    }

# Mount Frontend Dist if available
FRONTEND_DIST = BASE_DIR / "frontend" / "dist"
if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        file_path = FRONTEND_DIST / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(FRONTEND_DIST / "index.html")
