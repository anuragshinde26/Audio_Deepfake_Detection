# backend/app/model.py
from pathlib import Path
from typing import Optional
import traceback
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model
from tensorflow.keras import layers, Model, Input
from .config import MODEL_DIR, MODEL_PRIORITY, N_MFCC, MAX_LENGTH

MODEL = None
MODEL_PATH = None

def find_model_file() -> Optional[Path]:
    if not MODEL_DIR.exists():
        return None
    for name in MODEL_PRIORITY:
        p = MODEL_DIR / name
        if p.exists():
            return p
    for ext in (".keras", ".h5"):
        files = list(MODEL_DIR.glob(f"*{ext}"))
        if files:
            return files[0]
    return None

def build_model_architecture(input_shape=(N_MFCC, MAX_LENGTH, 1)):
    """
    Reconstruct the model architecture to match the saved model structure
    seen in the deserialization error (Conv2D blocks -> reshape -> BiLSTM -> Dense).
    This architecture matches the config printed in the traceback.
    """
    inp = Input(shape=input_shape, name="input_1")

    # Conv block 1
    x = layers.Conv2D(32, (3,3), padding="same", activation="relu")(inp)
    x = layers.BatchNormalization(axis=-1)(x)
    x = layers.MaxPooling2D(pool_size=(2,2))(x)

    # Conv block 2
    x = layers.Conv2D(64, (3,3), padding="same", activation="relu")(x)
    x = layers.BatchNormalization(axis=-1)(x)
    x = layers.MaxPooling2D(pool_size=(2,2))(x)

    # Conv block 3
    x = layers.Conv2D(128, (3,3), padding="same", activation="relu")(x)
    x = layers.BatchNormalization(axis=-1)(x)
    x = layers.MaxPooling2D(pool_size=(2,2))(x)

    # After three (2x2) poolings, height = N_MFCC / 2^3, width = MAX_LENGTH / 2^3
    # For N_MFCC=40 and MAX_LENGTH=500 -> height=5, width=62 -> 5*62 = 310 time steps
    h = input_shape[0] // 8
    w = input_shape[1] // 8
    time_steps = h * w  # e.g., 5 * 62 = 310

    # reshape to (time_steps, channels)
    x = layers.Reshape((time_steps, 128))(x)

    # BiLSTM stack
    x = layers.Bidirectional(layers.LSTM(128, return_sequences=True, dropout=0.3, recurrent_dropout=0.2))(x)
    x = layers.BatchNormalization()(x)

    x = layers.Bidirectional(layers.LSTM(128, return_sequences=False, dropout=0.3, recurrent_dropout=0.2))(x)
    x = layers.BatchNormalization()(x)

    # Dense head
    x = layers.Dense(128, activation="relu", kernel_regularizer=tf.keras.regularizers.l2(0.001))(x)
    x = layers.Dropout(0.5)(x)
    out = layers.Dense(1, activation="sigmoid")(x)

    model = Model(inputs=inp, outputs=out, name="reconstructed_cnn_bilstm")
    return model

def try_load_keras_model(path: Path):
    # Attempt to load full model first
    try:
        m = load_model(str(path), compile=False)
        return m
    except Exception as e:
        raise e

def load_keras_model():
    """
    Loads the model. Strategy:
    1) try tf.keras.models.load_model(full_model_file)
    2) if fails, and we have an .h5 file, reconstruct architecture and load weights
    """
    global MODEL, MODEL_PATH
    if MODEL is not None:
        return MODEL

    model_file = find_model_file()
    if model_file is None:
        raise FileNotFoundError(f"No model found in {MODEL_DIR}; expected one of {MODEL_PRIORITY}")

    MODEL_PATH = model_file
    # Try normal load_model first
    try:
        MODEL = try_load_keras_model(model_file)
        print(f"Loaded model via load_model: {model_file.name}")
        return MODEL
    except Exception as e:
        # fallback path: attempt to rebuild architecture and load weights from .h5
        print("load_model failed; attempting architecture reconstruction and load_weights().")
        print("Original load_model exception:\n", "".join(traceback.format_exception_only(type(e), e)).strip())

    # If the file is an HDF5 (.h5) file containing weights or the entire model, attempt to load weights
    if model_file.suffix.lower() in [".h5", ".hdf5"]:
        try:
            # Reconstruct architecture that matches original model
            reconstructed = build_model_architecture(input_shape=(N_MFCC, MAX_LENGTH, 1))
            # Try load_weights
            reconstructed.load_weights(str(model_file))
            MODEL = reconstructed
            print(f"Reconstructed architecture and loaded weights from: {model_file.name}")
            return MODEL
        except Exception as e2:
            print("Failed to load weights into reconstructed architecture. Exception:")
            traceback.print_exc()
            raise RuntimeError(f"Failed to reconstruct model and load weights: {e2}") from e2

    # If we got here, we couldn't recover
    raise RuntimeError(f"Could not load model from {model_file}. See previous errors for details.")

def predict_from_mfcc(mfcc_array: np.ndarray):
    """
    Take MFCC input shaped (1, n_mfcc, max_length, 1) and return prediction dict.
    """
    model = load_keras_model()
    preds = model.predict(mfcc_array)
    p = np.asarray(preds).squeeze()

    if p.ndim == 0 or p.size == 1:
        prob_fake = float(p)
        prob_real = 1.0 - prob_fake
    elif p.size == 2:
        prob_fake = float(p[1])
        prob_real = float(p[0])
    else:
        p = p / (p.sum() + 1e-9)
        prob_fake = float(p[0])
        prob_real = float(1.0 - prob_fake)

    confidence = max(prob_fake, prob_real)
    label = "Fake" if prob_fake > prob_real else "Real"

    return {
        "label": label,
        "confidence": float(confidence),
        "probabilities": {"fake": float(prob_fake), "real": float(prob_real)},
        "model_file": MODEL_PATH.name if MODEL_PATH else None
    }
