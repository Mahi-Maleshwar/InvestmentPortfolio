from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from pydantic import BaseModel, Field


class PasswordResetOTP(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    email: str
    otp: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: datetime
    used: bool = False

    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}


def password_reset_otp_from_doc(doc: dict) -> PasswordResetOTP:
    """Convert MongoDB document to PasswordResetOTP model."""
    if doc is None:
        return None
    return PasswordResetOTP(
        id=str(doc.get("_id")),
        email=doc.get("email"),
        otp=doc.get("otp"),
        created_at=doc.get("created_at", datetime.now(timezone.utc)),
        expires_at=doc.get("expires_at"),
        used=doc.get("used", False),
    )


def password_reset_otp_to_doc(otp: PasswordResetOTP) -> dict:
    """Convert PasswordResetOTP model to MongoDB document."""
    doc = {
        "email": otp.email,
        "otp": otp.otp,
        "created_at": otp.created_at,
        "expires_at": otp.expires_at,
        "used": otp.used,
    }
    if otp.id:
        doc["_id"] = ObjectId(otp.id)
    return doc
