from typing import Optional

from bson import ObjectId
from pydantic import BaseModel, Field


class Investment(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    user_id: str
    asset_name: str
    asset_type: str
    quantity: float
    buy_price: float
    total_value: float
    current_price: Optional[float] = None

    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}


def investment_from_doc(doc: dict) -> Investment:
    """Convert MongoDB document to Investment model."""
    if doc is None:
        return None
    return Investment(
        id=str(doc.get("_id")),
        user_id=str(doc.get("user_id")),
        asset_name=doc.get("asset_name"),
        asset_type=doc.get("asset_type"),
        quantity=doc.get("quantity"),
        buy_price=doc.get("buy_price"),
        total_value=doc.get("total_value"),
        current_price=doc.get("current_price"),
    )


def investment_to_doc(investment: Investment) -> dict:
    """Convert Investment model to MongoDB document."""
    doc = {
        "user_id": ObjectId(investment.user_id) if investment.user_id else None,
        "asset_name": investment.asset_name,
        "asset_type": investment.asset_type,
        "quantity": investment.quantity,
        "buy_price": investment.buy_price,
        "total_value": investment.total_value,
        "current_price": investment.current_price,
    }
    if investment.id:
        doc["_id"] = ObjectId(investment.id)
    return doc
