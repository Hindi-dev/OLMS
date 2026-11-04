import sys
import os

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

import uvicorn
from backend.seed import seed_database

def main():
    print("=" * 70)
    print("  राजभाषा-प्रबंधक (Rajbhasha Management Suite) - v1.0.0")
    print("  Personal & Departmental Administration, Compliance & Translation")
    print("=" * 70)
    
    # 1. Ensure DB and seed data exist
    print("[1/2] Checking and initializing database...")
    seed_database()

    # 2. Launch FastAPI Server
    host = "127.0.0.1"
    port = 8000
    print(f"[2/2] Starting Web Application Server on http://{host}:{port} ...")
    print(f"      Open your browser and navigate to: http://localhost:{port}")
    print("=" * 70)
    
    uvicorn.run("backend.app.main:app", host=host, port=port, reload=True)

if __name__ == "__main__":
    main()
