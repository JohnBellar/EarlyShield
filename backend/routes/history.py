
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.analysis import Analysis

router = APIRouter(prefix="/api/history", tags=["History"])


@router.get("")
def get_history(db: Session = Depends(get_db)):
    records = (
        db.query(Analysis)
        .order_by(Analysis.created_at.desc())
        .all()
    )

    return [
        {
            "id": record.id,
            "message": record.message,
            "risk": record.risk,
            "risk_confidence": record.risk_confidence,
            "risk_probabilities": record.risk_probabilities,
            "tactics": record.tactics,
            "created_at": record.created_at
        }
        for record in records
    ]


@router.get("/{analysis_id}")
def get_analysis(
    analysis_id: int,
    db: Session = Depends(get_db)
):
    record = db.query(Analysis).filter(
        Analysis.id == analysis_id
    ).first()

    if record is None:
        raise HTTPException(
            status_code=404,
            detail="Analysis not found"
        )

    return {
        "id": record.id,
        "message": record.message,
        "risk": record.risk,
        "risk_confidence": record.risk_confidence,
        "risk_probabilities": record.risk_probabilities,
        "tactics": record.tactics,
        "created_at": record.created_at
    }


@router.delete("/{analysis_id}")
def delete_analysis(
    analysis_id: int,
    db: Session = Depends(get_db)
):
    record = db.query(Analysis).filter(
        Analysis.id == analysis_id
    ).first()

    if record is None:
        raise HTTPException(
            status_code=404,
            detail="Analysis not found"
        )

    db.delete(record)
    db.commit()

    return {
        "message": "Analysis deleted successfully",
        "id": analysis_id
    }
