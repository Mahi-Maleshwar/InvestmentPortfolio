from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from pydantic import BaseModel, Field


class User(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    name: str
    email: str
    password_hash: str
    role: str = "user"
    is_blocked: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}

    @property
    def user_id(self) -> str:
        return str(self.id) if self.id else None


def user_from_doc(doc: dict) -> User:
    """Convert MongoDB document to User model."""
    if doc is None:
        return None
    return User(
        id=str(doc.get("_id")),
        name=doc.get("name"),
        email=doc.get("email"),
        password_hash=doc.get("password_hash"),
        role=doc.get("role", "user"),
        is_blocked=doc.get("is_blocked", False),
        created_at=doc.get("created_at", datetime.now(timezone.utc)),
    )


def user_to_doc(user: User) -> dict:
    """Convert User model to MongoDB document."""
    doc = {
        "name": user.name,
        "email": user.email,
        "password_hash": user.password_hash,
        "role": user.role,
        "is_blocked": user.is_blocked,
        "created_at": user.created_at,
    }
    if user.id:
        doc["_id"] = ObjectId(user.id)
    return doc
