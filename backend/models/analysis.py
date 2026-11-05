
from sqlalchemy import Column, Integer, String, Float, DateTime, JSON
from sqlalchemy.sql import func

from database import Base


class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True, index=True)

    message = Column(String, nullable=False)

    risk = Column(String, nullable=False)

    risk_confidence = Column(Float, nullable=False)

    risk_probabilities = Column(JSON, nullable=False)

    tactics = Column(JSON, nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
