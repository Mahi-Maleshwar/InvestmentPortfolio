from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from pydantic import BaseModel, Field


class Transaction(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    user_id: str
    investment_id: Optional[str] = None
    action: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}


def transaction_from_doc(doc: dict) -> Transaction:
    """Convert MongoDB document to Transaction model."""
    if doc is None:
        return None
    return Transaction(
        id=str(doc.get("_id")),
        user_id=str(doc.get("user_id")),
        investment_id=str(doc.get("investment_id")) if doc.get("investment_id") else None,
        action=doc.get("action"),
        timestamp=doc.get("timestamp", datetime.now(timezone.utc)),
    )


def transaction_to_doc(transaction: Transaction) -> dict:
    """Convert Transaction model to MongoDB document."""
    doc = {
        "user_id": ObjectId(transaction.user_id) if transaction.user_id else None,
        "investment_id": ObjectId(transaction.investment_id) if transaction.investment_id else None,
        "action": transaction.action,
        "timestamp": transaction.timestamp,
    }
    if transaction.id:
        doc["_id"] = ObjectId(transaction.id)
    return doc
