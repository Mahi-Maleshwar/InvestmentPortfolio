from pydantic import BaseModel, EmailStr, Field


class UserRegister(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    email: str
    password: str = Field(..., min_length=6, max_length=128)


class UserLogin(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserPublic(BaseModel):
    id: str
    name: str
    email: str
    role: str
    is_blocked: bool = False

    model_config = {"from_attributes": True}


class UserAdminList(UserPublic):
    investment_count: int = 0


class BlockUserBody(BaseModel):
    blocked: bool


class MessageResponse(BaseModel):
    message: str
