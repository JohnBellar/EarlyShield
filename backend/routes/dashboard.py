
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models.analysis import Analysis

router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard"]
)


@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):

    total = db.query(Analysis).count()

    safe_count = db.query(Analysis).filter(
        Analysis.risk == "SAFE"
    ).count()

    suspicious_count = db.query(Analysis).filter(
        Analysis.risk == "SUSPICIOUS"
    ).count()

    high_risk_count = db.query(Analysis).filter(
        Analysis.risk == "HIGH RISK"
    ).count()

    # Retrieve all tactic predictions
    records = db.query(Analysis.tactics).all()

    tactic_counts = {}

    for record in records:
        tactics = record[0] or []

        for tactic in tactics:
            label = tactic.get("label")

            if label:
                tactic_counts[label] = (
                    tactic_counts.get(label, 0) + 1
                )

    return {
        "total_analyzed": total,
        "risk_distribution": {
            "SAFE": safe_count,
            "SUSPICIOUS": suspicious_count,
            "HIGH RISK": high_risk_count
        },
        "tactic_frequency": tactic_counts
    }
