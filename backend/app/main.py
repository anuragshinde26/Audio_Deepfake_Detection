# backend/app/main.py
import os
import io
import time
import uuid
import base64
import shutil
import tempfile
import subprocess
from pathlib import Path
from typing import Optional

import numpy as np
import librosa
import librosa.display
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from fastapi import FastAPI, UploadFile, File, HTTPException, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

# TensorFlow import (your venv must have tensorflow installed)
import tensorflow as tf

# ---------- Configuration ----------
ROOT = Path(__file__).resolve().parent.parent
STATIC_DIR = ROOT / "static"
SPECT_DIR = STATIC_DIR / "spectrograms"
MODELS_DIR = ROOT / "models" / "savedmodels"

STATIC_DIR.mkdir(parents=True, exist_ok=True)
SPECT_DIR.mkdir(parents=True, exist_ok=True)
MODELS_DIR.mkdir(parents=True, exist_ok=True)

MODEL_CANDIDATES = [
    MODELS_DIR / "updated_model.keras",
    MODELS_DIR / "updated_model.h5",
    MODELS_DIR / "my_model.h5"
]

app = FastAPI(title="Audio Deepfake Detection API")

# CORS: include typical local dev origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# serve static files so frontend can fetch /static/spectrograms/...
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

# ---------- Model load ----------
model = None
model_path = None

def try_load_model():
    global model, model_path
    for p in MODEL_CANDIDATES:
        if p.exists():
            model_path = p
            try:
                model = tf.keras.models.load_model(str(p))
                print(f"Model loaded from: {p}")
                return
            except Exception as e:
                print(f"load_model failed for {p}: {e}")
    if model is None:
        print("Warning: No model loaded. Place updated_model.h5 or my_model.h5 in models/savedmodels")

try_load_model()

# ---------- Audio helpers ----------
def _write_bytes_to_tempfile(data: bytes, suffix: str = "") -> str:
    tfp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    tfp.write(data)
    tfp.close()
    return tfp.name

def _convert_to_wav_if_needed(input_path: str, target_sr: int = 16000) -> str:
    """
    If input_path is already a .wav, return it. Otherwise use ffmpeg to convert to wav.
    Returns path to WAV file (temp file) which must be removed by caller.
    Requires ffmpeg in PATH.
    """
    input_path = str(input_path)
    if input_path.lower().endswith(".wav"):
        # optionally resample later when loading with librosa
        return input_path

    out_wav = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
    out_wav.close()
    out_path = out_wav.name

    # ffmpeg command: convert -> 16k mono wav
    cmd = [
        "ffmpeg", "-y", "-i", input_path,
        "-ar", str(target_sr), "-ac", "1",
        out_path
    ]
    try:
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True)
        return out_path
    except subprocess.CalledProcessError as e:
        # include stderr to help debugging
        err = e.stderr if hasattr(e, "stderr") else str(e)
        # cleanup the failed file
        try:
            os.remove(out_path)
        except Exception:
            pass
        raise RuntimeError(f"ffmpeg conversion failed: {err.strip() if err else str(e)}")

def extract_mfcc_from_wavfile(wav_path: str, sr: int = 16000, n_mfcc: int = 40, max_len: int = 500):
    """
    Loads audio from a WAV file path (already converted to WAV) and returns shaped MFCCs.
    """
    y, _ = librosa.load(wav_path, sr=sr, mono=True)
    mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=n_mfcc)
    if mfccs.shape[1] < max_len:
        mfccs = np.pad(mfccs, ((0, 0), (0, max_len - mfccs.shape[1])), mode='constant')
    else:
        mfccs = mfccs[:, :max_len]
    return mfccs.reshape(1, mfccs.shape[0], mfccs.shape[1], 1)

def make_mel_spectrogram_image_bytes_from_wav(wav_path: str, sr: int = 16000, n_mels: int = 128):
    """
    Creates a PNG bytes of mel-spectrogram from a wav file path.
    """
    y, _ = librosa.load(wav_path, sr=sr, mono=True)
    S = librosa.feature.melspectrogram(y=y, sr=sr, n_mels=n_mels, fmax=8000)
    S_db = librosa.power_to_db(S, ref=np.max)
    plt.figure(figsize=(8, 4))
    plt.axis('off')
    librosa.display.specshow(S_db, sr=sr, x_axis='time', y_axis='mel')
    buf = io.BytesIO()
    plt.tight_layout(pad=0)
    plt.savefig(buf, format='png', bbox_inches='tight', pad_inches=0)
    plt.close()
    buf.seek(0)
    return buf.getvalue()

def save_spectrogram_bytes(png_bytes: bytes, filename: Optional[str] = None) -> str:
    if filename is None:
        filename = f"spect_{int(time.time())}_{uuid.uuid4().hex[:6]}.png"
    out_path = SPECT_DIR / filename
    with open(out_path, "wb") as f:
        f.write(png_bytes)
    return f"/static/spectrograms/{filename}"

# ---------- Endpoints ----------
@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    """
    Accepts uploaded file (any audio/video container) -> converts to WAV via ffmpeg if needed -> runs model.
    """
    start = time.time()
    file_bytes = await file.read()
    in_suffix = Path(file.filename or "upload").suffix or ""
    temp_input_path = None
    temp_wav_path = None

    try:
        temp_input_path = _write_bytes_to_tempfile(file_bytes, suffix=in_suffix)
        # convert to wav if needed
        try:
            temp_wav_path = _convert_to_wav_if_needed(temp_input_path, target_sr=16000)
        except RuntimeError as e:
            raise HTTPException(status_code=500, detail=f"Audio conversion failed: {e}")

        # create spectrogram & features
        try:
            png_bytes = make_mel_spectrogram_image_bytes_from_wav(temp_wav_path)
            spect_rel = save_spectrogram_bytes(png_bytes)
            spect_base64 = "data:image/png;base64," + base64.b64encode(png_bytes).decode("ascii")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Spectrogram generation failed: {e}")

        if model is None:
            raise HTTPException(status_code=500, detail="Model not loaded on server")

        try:
            features = extract_mfcc_from_wavfile(temp_wav_path)
            pred = model.predict(features)
            if isinstance(pred, np.ndarray):
                try:
                    fake_prob = float(pred[0][0])
                except Exception:
                    if pred.shape[-1] == 2:
                        fake_prob = float(pred[0][1])
                    else:
                        fake_prob = float(np.max(pred))
            else:
                fake_prob = float(pred)
            real_prob = 1.0 - fake_prob
            label = "fake" if fake_prob >= 0.5 else "real"
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Inference error: {e}")

        elapsed = round(time.time() - start, 3)
        result = {
            "prediction": label,
            "confidence": fake_prob,
            "probabilities": {"fake": fake_prob, "real": real_prob},
            "model_file": model_path.name if model_path else None,
            "spectrogram": spect_base64,
            "spectrogram_path": spect_rel,
            "file_name": file.filename or "uploaded_audio",
            "analysis_time": elapsed,
            "spectral_heuristic": None
        }
        return JSONResponse(content=result)
    finally:
        # cleanup temp files
        try:
            if temp_input_path and os.path.exists(temp_input_path):
                os.remove(temp_input_path)
        except Exception:
            pass
        try:
            if temp_wav_path and os.path.exists(temp_wav_path) and temp_wav_path != temp_input_path:
                os.remove(temp_wav_path)
        except Exception:
            pass

@app.post("/predict-url")
async def predict_url(request: Request):
    """
    Accept either:
      - JSON body: { "url": "https://youtube.com/..." }
      - form field: youtube_url=...
    Uses yt-dlp to download and then same pipeline as /predict (with ffmpeg conversion if needed).
    """
    start = time.time()

    # parse JSON or form
    youtube_url = None
    try:
        body = await request.json()
        youtube_url = body.get("url") or body.get("youtube_url")
    except Exception:
        form = await request.form()
        youtube_url = form.get("url") or form.get("youtube_url")

    if not youtube_url:
        raise HTTPException(status_code=400, detail="No URL provided. Send JSON { url: '...' } or form field youtube_url='...'")

    tmpdir = tempfile.mkdtemp(prefix="dl_")
    try:
        # let yt-dlp produce an audio file in tmpdir
        out_template = os.path.join(tmpdir, "audio.%(ext)s")
        cmd = [
            "yt-dlp",
            "-x",
            "--audio-format",
            "wav",  # ask it to produce wav if possible
            "-o",
            out_template,
            youtube_url,
        ]
        try:
            proc = subprocess.run(cmd, check=True, capture_output=True, text=True, timeout=180)
        except subprocess.CalledProcessError as e:
            stderr = e.stderr or ""
            raise HTTPException(status_code=500, detail=f"yt-dlp failed: {stderr.strip() or str(e)}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"yt-dlp failed: {e}")

        # find the downloaded file (common audio extensions)
        downloaded = None
        for p in Path(tmpdir).iterdir():
            if p.suffix.lower() in (".wav", ".mp3", ".m4a", ".webm", ".aac", ".ogg"):
                downloaded = str(p)
                break
        if not downloaded:
            candidate = Path(tmpdir) / "audio.wav"
            if candidate.exists():
                downloaded = str(candidate)

        if not downloaded:
            raise HTTPException(status_code=500, detail="No audio file found after yt-dlp download")

        # convert to wav if necessary (this will also resample to target sr)
        try:
            wav_path = _convert_to_wav_if_needed(downloaded, target_sr=16000)
        except RuntimeError as e:
            raise HTTPException(status_code=500, detail=f"Audio conversion failed: {e}")

        # spectrogram, features and inference
        try:
            png_bytes = make_mel_spectrogram_image_bytes_from_wav(wav_path)
            spect_rel = save_spectrogram_bytes(png_bytes)
            spect_base64 = "data:image/png;base64," + base64.b64encode(png_bytes).decode("ascii")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Spectrogram generation failed: {e}")

        if model is None:
            raise HTTPException(status_code=500, detail="Model not loaded on server")

        try:
            features = extract_mfcc_from_wavfile(wav_path)
            pred = model.predict(features)
            try:
                fake_prob = float(pred[0][0])
            except Exception:
                if isinstance(pred, np.ndarray) and pred.shape[-1] == 2:
                    fake_prob = float(pred[0][1])
                else:
                    fake_prob = float(np.max(pred))
            real_prob = 1.0 - fake_prob
            label = "fake" if fake_prob >= 0.5 else "real"
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Inference error: {e}")

        elapsed = round(time.time() - start, 3)
        response = {
            "prediction": label,
            "confidence": fake_prob,
            "probabilities": {"fake": fake_prob, "real": real_prob},
            "model_file": model_path.name if model_path else None,
            "spectrogram": spect_base64,
            "spectrogram_path": spect_rel,
            "file_name": youtube_url,
            "analysis_time": elapsed,
            "spectral_heuristic": None
        }
        return JSONResponse(response)
    finally:
        # cleanup tempdir
        shutil.rmtree(tmpdir, ignore_errors=True)
