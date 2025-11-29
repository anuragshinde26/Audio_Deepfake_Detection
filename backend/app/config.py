# backend/app/config.py
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent.parent
MODEL_DIR = PROJECT_ROOT / "models" / "savedmodels"

# Which model file names to prefer (in order)
MODEL_PRIORITY = ["updated_model.keras", "updated_model.h5", "my_model.h5"]

# MFCC params (match Streamlit reference)
SAMPLE_RATE = 16000
N_MFCC = 40
MAX_LENGTH = 500  # time frames (columns) to pad/trim to

# Spectrogram image return size (width, height)
SPEC_IMG_SIZE = (512, 256)

# Allowed origins for CORS (adjust to your frontend domain for production)
ALLOWED_ORIGINS = [
    "http://localhost:5173",  # Vite dev server (default)
    "http://localhost:3000",
]

# Temporary directory name (optional)
TMP_DIR = PROJECT_ROOT / "tmp"
