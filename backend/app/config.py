from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
UPLOAD_DIR = DATA_DIR / "uploads"
OUTPUT_DIR = DATA_DIR / "outputs"
TEMPLATE_DIR = DATA_DIR / "templates"
DATABASE_URL = f"sqlite:///{DATA_DIR / 'rajbhasha.db'}"

for dir_path in [DATA_DIR, UPLOAD_DIR, OUTPUT_DIR, TEMPLATE_DIR]:
    dir_path.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc", ".xlsx", ".png", ".jpg", ".jpeg"}
MAX_FILE_SIZE_MB = 50

# Rajbhasha Regions Definition per Official Languages Rules 1976
REGION_A_STATES = [
    "Bihar", "Haryana", "Himachal Pradesh", "Madhya Pradesh", "Chhattisgarh", 
    "Jharkhand", "Rajasthan", "Uttar Pradesh", "Uttarakhand", "Delhi", "Andaman and Nicobar Islands"
]
REGION_B_STATES = [
    "Gujarat", "Maharashtra", "Punjab", "Chandigarh", "Daman and Diu", "Dadra and Nagar Haveli"
]
# All remaining states/UTs fall under Region C (ग क्षेत्र)
