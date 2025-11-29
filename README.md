🎧 Audio Deepfake Detection System
An Integrated Audio Analysis Platform for Detecting Synthetic / Manipulated Voices

This project implements a complete Audio Deepfake Detection System using deep learning and signal-processing techniques.
It includes:

✔ CNN + Bi-LSTM Deepfake detection model

✔ Mel-Spectrogram visualization

✔ MFCC feature extraction pipeline

✔ FastAPI backend for inference

✔ React + Vite + Tailwind frontend

✔ Support for file upload (.wav/.mp3/.m4a)

✔ Support for YouTube URL–based detection

✔ Real-time spectrogram generation

🚀 Features
🔍 1. Deepfake Audio Classification

Uses a hybrid CNN + Bi-LSTM neural network.

Output: Real (0) or Fake (1) with probability.

🎼 2. Mel-Spectrogram Generation

Automatic spectrogram creation using Librosa.

Displayed on results page.

🎤 3. MFCC-based Feature Extraction

Extracts 40 MFCCs

Normalized to max sequence length 500 for uniform model input.

🌐 4. Analyze Audio From:

Local device upload

Direct YouTube URL (via yt-dlp)

🖥 5. Frontend (React + Tailwind)

Modern, clean UI

Mobile-friendly

Displays confidence bars, analysis time, model used, file name, etc.

⚡ 6. Backend (FastAPI)

High-performance inference API

Generates and returns both:

Base64 spectrogram (inline preview)

Saved spectrogram path
📂 Project Structure
AUDIO-DEEPFAKE-DETECTION/
│
├── backend/
│   ├── app/
│   │   ├── main.py        # FastAPI server + endpoints
│   │   ├── utils.py       # Audio processing helpers
│   ├── models/
│   │   └── savedmodels/   # Your model (.h5 / .keras)
│   ├── static/
│   │   └── spectrograms/  # Saved PNGs
│   └── .venv/             # Python virtual environment
│
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/
│   │   ├── lib/api.ts     # Frontend API calls
│   │   └── App.tsx
│   └── node_modules/
│
├── models/                # Extra models if any
├── README.md
└── .gitignore

🧠 Model Architecture Overview
Hybrid CNN + Bi-LSTM Model
Input (MFCC: 40 × 500 × 1)
        │
   Conv2D → BatchNorm → MaxPool
        │
   Conv2D → BatchNorm → MaxPool
        │
   Conv2D → BatchNorm → MaxPool
        │
     Reshape (Time × Features)
        │
 Bi-LSTM Layer (Bidirectional)
        │
 Bi-LSTM Layer (Bidirectional)
        │
 Dense → Dropout → Dense (sigmoid)
        │
   Output: Fake Probability

📊 How Detection Works
1. Load audio file (or download from YouTube)

→ Convert to WAV
→ Normalize

2. Generate:

✔ MFCC features
✔ Mel-spectrogram image

3. Pass MFCC through trained deep learning model
4. Compute:

Fake probability

Real probability

Prediction label

Analysis time

5. Return data to frontend
⚙️ Installation & Setup
🐍 Backend (FastAPI)
1. Create venv
cd backend
python -m venv .venv
.venv\Scripts\activate     # Windows

2. Install dependencies
pip install -r requirements.txt

3. Start backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000


Backend will run at:

👉 http://localhost:8000

Required External Tools:
pip install yt-dlp

🖥 Frontend (React + Vite)
1. Install packages
cd frontend
npm install

2. Start dev server
npm run dev


Frontend runs at:

👉 http://localhost:5173

🔌 API Endpoints
📤 1. POST /predict

Upload audio file for analysis.

Request:
multipart/form-data
file: <audio-file>

Response:
{
  "prediction": "fake",
  "confidence": 0.92,
  "spectrogram": "data:image/png;base64,...",
  "spectrogram_path": "/static/spectrograms/img123.png",
  "file_name": "audio.wav",
  "analysis_time": 3.4
}

🌐 2. POST /predict-url

Analyze audio from YouTube URL.

Request:
{
  "url": "https://youtube.com/..."
}

📝 Environment Variables

Create .env inside frontend/

VITE_API_URL="http://localhost:8000"
VITE_SUPABASE_URL=...
VITE_SUPABASE_PROJECT_ID=...
VITE_SUPABASE_PUBLISHABLE_KEY=...

📦 Dependencies
Backend

TensorFlow / Keras

FastAPI

Librosa

NumPy

Matplotlib

yt-dlp

Frontend

React

Vite

TailwindCSS

Lucide Icons
