# backend/app/utils.py
import tempfile
import os
import io
import base64
from pathlib import Path
import numpy as np
import librosa
from PIL import Image
import matplotlib.pyplot as plt
from .config import SAMPLE_RATE, N_MFCC, MAX_LENGTH, SPEC_IMG_SIZE

def save_bytes_to_tempfile(b: bytes, suffix=".wav") -> str:
    """Write bytes to a temp file and return path."""
    fd, path = tempfile.mkstemp(suffix=suffix)
    os.close(fd)
    with open(path, "wb") as f:
        f.write(b)
    return path

def extract_mfcc_from_bytes(file_bytes: bytes, sr=SAMPLE_RATE, n_mfcc=N_MFCC, max_length=MAX_LENGTH):
    """
    Convert raw audio bytes to MFCC array shaped (1, n_mfcc, max_length, 1).
    Uses librosa.load (so it supports many formats).
    """
    path = save_bytes_to_tempfile(file_bytes, suffix=".wav")
    try:
        y, _ = librosa.load(path, sr=sr, mono=True)
        mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=n_mfcc)
        if mfccs.shape[1] < max_length:
            mfccs = np.pad(mfccs, ((0, 0), (0, max_length - mfccs.shape[1])), mode="constant")
        else:
            mfccs = mfccs[:, :max_length]
        mfccs = mfccs.reshape(1, mfccs.shape[0], mfccs.shape[1], 1).astype("float32")
        return mfccs
    finally:
        try:
            os.remove(path)
        except Exception:
            pass

def make_mel_spectrogram_image_from_bytes(file_bytes: bytes, sr=SAMPLE_RATE, n_mels=128, size=SPEC_IMG_SIZE):
    """
    Returns a base64 data URI PNG string containing a Mel spectrogram visualization
    created from the provided audio bytes.
    """
    path = save_bytes_to_tempfile(file_bytes, suffix=".wav")
    try:
        y, _ = librosa.load(path, sr=sr, mono=True)
        S = librosa.feature.melspectrogram(y=y, sr=sr, n_mels=n_mels)
        S_db = librosa.power_to_db(S, ref=np.max)

        # Create a matplotlib figure without axes and save to buffer
        fig = plt.figure(figsize=(size[0] / 100, size[1] / 100), dpi=100)
        ax = fig.add_subplot(111)
        ax.axis("off")
        ax.imshow(S_db, aspect="auto", origin="lower")
        plt.tight_layout(pad=0)

        buf = io.BytesIO()
        fig.savefig(buf, format="png", bbox_inches="tight", pad_inches=0)
        plt.close(fig)
        buf.seek(0)
        b64 = base64.b64encode(buf.read()).decode("utf-8")
        return f"data:image/png;base64,{b64}"
    finally:
        try:
            os.remove(path)
        except Exception:
            pass
