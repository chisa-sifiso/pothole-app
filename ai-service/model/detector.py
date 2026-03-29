import io
import logging
import os

import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)

SEVERITY_THRESHOLDS = [
    ("CRITICAL", 0.80),
    ("HIGH",     0.60),
    ("MEDIUM",   0.35),
    ("LOW",      0.10),
]


class PotholeDetector:
    """
    Pothole detection model using MobileNetV2 transfer learning.
    Falls back to image-heuristic mock mode when trained weights are absent.
    """

    def __init__(self):
        self.model = None
        self.model_ready = False
        self._load_model()

    def _load_model(self):
        weights_path = os.path.join(
            os.path.dirname(__file__), "weights", "pothole_mobilenetv2.h5"
        )
        if not os.path.exists(weights_path):
            logger.warning(
                "Model weights not found at %s. Running in MOCK mode.", weights_path
            )
            return

        try:
            import tensorflow as tf  # lazy import — not needed in mock mode

            base = tf.keras.applications.MobileNetV2(
                input_shape=(224, 224, 3),
                include_top=False,
                weights=None,
            )
            x = tf.keras.layers.GlobalAveragePooling2D()(base.output)
            x = tf.keras.layers.Dense(128, activation="relu")(x)
            x = tf.keras.layers.Dropout(0.3)(x)
            output = tf.keras.layers.Dense(1, activation="sigmoid")(x)

            self.model = tf.keras.Model(inputs=base.input, outputs=output)
            self.model.load_weights(weights_path)
            self.model_ready = True
            logger.info("MobileNetV2 pothole model loaded successfully.")
        except Exception as exc:
            logger.error("Failed to load model: %s. Falling back to mock mode.", exc)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def analyze(self, image_bytes: bytes) -> dict:
        if not self.model_ready:
            return self._mock_analyze(image_bytes)
        return self._model_analyze(image_bytes)

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _model_analyze(self, image_bytes: bytes) -> dict:
        tensor = self._preprocess(image_bytes)
        confidence = float(self.model.predict(tensor, verbose=0)[0][0])
        is_pothole = confidence > 0.50
        severity = self._confidence_to_severity(confidence)
        return {
            "is_pothole": is_pothole,
            "confidence": round(confidence, 4),
            "severity": severity,
            "estimated_diameter_cm": round(10.0 + confidence * 70.0, 1),
            "estimated_depth_cm":    round(1.5  + confidence * 20.0, 1),
        }

    def _mock_analyze(self, image_bytes: bytes) -> dict:
        """
        Rule-based heuristic used during development (no trained weights).

        Logic:
          - Dark images with high texture variance score higher (pothole-like).
          - Uniform bright images score lower (road surface / sky).
        """
        img = Image.open(io.BytesIO(image_bytes)).convert("L")
        arr = np.array(img, dtype=np.float32)

        mean_brightness = float(arr.mean()) / 255.0
        texture_variance = float(arr.var()) / (255.0 ** 2)

        # Combine: dark + textured → higher score
        confidence = min(1.0, (1.0 - mean_brightness) * 0.5 + texture_variance * 3.0)
        is_pothole = confidence > 0.25

        severity = self._confidence_to_severity(confidence) if is_pothole else "LOW"

        return {
            "is_pothole": is_pothole,
            "confidence": round(confidence, 4),
            "severity": severity,
            "estimated_diameter_cm": round(10.0 + confidence * 65.0, 1),
            "estimated_depth_cm":    round(2.0  + confidence * 18.0, 1),
        }

    @staticmethod
    def _preprocess(image_bytes: bytes) -> np.ndarray:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img = img.resize((224, 224))
        arr = np.array(img, dtype=np.float32) / 255.0
        return np.expand_dims(arr, axis=0)

    @staticmethod
    def _confidence_to_severity(confidence: float) -> str:
        for label, threshold in SEVERITY_THRESHOLDS:
            if confidence >= threshold:
                return label
        return "LOW"
