from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from database import engine, Base
from models.analysis import Analysis
from model import EarlyShieldInference
from fastapi import Depends
from sqlalchemy.orm import Session
from routes.history import router as history_router
from database import get_db
from routes.dashboard import router as dashboard_router

CHECKPOINT_PATH = "/Users/john/Desktop/xlmr_unified_tanglish_best.pth"


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Initializing EarlyShield...")
    app.state.detector = EarlyShieldInference(CHECKPOINT_PATH)
    print("EarlyShield API is ready!")
    yield
    print("EarlyShield API shutting down...")

Base.metadata.create_all(bind=engine)
app = FastAPI(
    title="EarlyShield API",
    description="AI-powered scam detection backend",
    version="1.0.0",
    lifespan=lifespan,
)
app.include_router(history_router)
app.include_router(dashboard_router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000)


@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "service": "EarlyShield",
    }



@app.post("/api/analyze")
def analyze(
    request: AnalyzeRequest,
    db: Session = Depends(get_db)
):
    text = request.text.strip()

    if not text:
        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty"
        )

    detector = app.state.detector

    # Run ML prediction
    prediction = detector.predict(text)

    # Save prediction to SQLite
    analysis = Analysis(
        message=prediction["text"],
        risk=prediction["risk"],
        risk_confidence=prediction["risk_confidence"],
        risk_probabilities=prediction["risk_probabilities"],
        tactics=prediction["tactics"]
    )

    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    # Preserve existing response + add database ID
    prediction["analysis_id"] = analysis.id

    return prediction
