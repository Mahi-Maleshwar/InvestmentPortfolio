from datetime import date, datetime, timezone
from typing import Optional

from bson import ObjectId
from pydantic import BaseModel, Field


class PortfolioHistory(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    user_id: str
    total_value: float
    date: datetime  # MongoDB stores datetime, not date
    recorded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}


def portfolio_history_from_doc(doc: dict) -> PortfolioHistory:
    """Convert MongoDB document to PortfolioHistory model."""
    if doc is None:
        return None
    return PortfolioHistory(
        id=str(doc.get("_id")),
        user_id=str(doc.get("user_id")),
        total_value=doc.get("total_value"),
        date=doc.get("date"),
        recorded_at=doc.get("recorded_at", datetime.now(timezone.utc)),
    )


def portfolio_history_to_doc(history: PortfolioHistory) -> dict:
    """Convert PortfolioHistory model to MongoDB document."""
    doc = {
        "user_id": ObjectId(history.user_id) if history.user_id else None,
        "total_value": history.total_value,
        "date": history.date,
        "recorded_at": history.recorded_at,
    }
    if history.id:
        doc["_id"] = ObjectId(history.id)
    return doc
