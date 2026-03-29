"""
Smart City Pothole Detection — AI Microservice
FastAPI service exposing a /analyze endpoint that accepts an image
and returns pothole detection results with severity classification.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from model.detector import PotholeDetector

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# App lifecycle
# ---------------------------------------------------------------------------

detector: PotholeDetector | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global detector
    logger.info("Loading pothole detection model...")
    detector = PotholeDetector()
    logger.info("Model ready: %s", detector.model_ready)
    yield
    logger.info("Shutting down AI service.")


app = FastAPI(
    title="Pothole AI Detection Service",
    description="AI microservice for pothole image analysis and severity classification",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://localhost:5173"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

VALID_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}


class AnalysisResult(BaseModel):
    is_pothole: bool = Field(..., description="True if the image contains a pothole")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Model confidence score")
    severity: str = Field(..., description="Severity level: LOW, MEDIUM, HIGH, CRITICAL")
    estimated_diameter_cm: float = Field(..., description="Estimated pothole diameter in centimetres")
    estimated_depth_cm: float = Field(..., description="Estimated pothole depth in centimetres")


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    mode: str


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health", response_model=HealthResponse, tags=["Health"])
def health():
    """Health check — returns whether the AI model is loaded."""
    loaded = detector is not None and detector.model_ready
    return HealthResponse(
        status="ok",
        model_loaded=loaded,
        mode="model" if loaded else "mock",
    )


@app.post("/analyze", response_model=AnalysisResult, tags=["Detection"])
async def analyze_image(file: UploadFile = File(..., description="Pothole image to analyse")):
    """
    Analyse a pothole image and return detection results.

    - **is_pothole**: whether the image contains a pothole
    - **confidence**: model confidence (0–1)
    - **severity**: LOW / MEDIUM / HIGH / CRITICAL
    - **estimated_diameter_cm**: approximate pothole width in cm
    - **estimated_depth_cm**: approximate pothole depth in cm
    """
    if file.content_type not in VALID_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{file.content_type}'. "
                   f"Accepted: {', '.join(VALID_CONTENT_TYPES)}",
        )

    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    if len(contents) > 10 * 1024 * 1024:  # 10 MB
        raise HTTPException(status_code=413, detail="File too large (max 10 MB)")

    if detector is None:
        raise HTTPException(status_code=503, detail="Model not initialised yet")

    try:
        result = detector.analyze(contents)
    except Exception as exc:
        logger.error("Analysis failed: %s", exc)
        raise HTTPException(status_code=500, detail="Image analysis failed") from exc

    return AnalysisResult(**result)
