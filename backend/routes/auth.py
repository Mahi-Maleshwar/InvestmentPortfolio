from fastapi import APIRouter, Depends, HTTPException, status

from database import get_db, users_collection
from models.user import User, user_from_doc, user_to_doc
from routes.deps import get_current_user
from schemas.user import TokenResponse, UserLogin, UserPublic, UserRegister
from utils.security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserPublic)
def register(body: UserRegister, db=Depends(get_db)):
    # Check if email already exists
    existing = users_collection.find_one({"email": body.email})
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    
    user = User(
        name=body.name,
        email=body.email,
        password_hash=hash_password(body.password),
        role="user",
        is_blocked=False,
    )
    result = users_collection.insert_one(user_to_doc(user))
    user.id = str(result.inserted_id)
    return user


@router.get("/me", response_model=UserPublic)
def me(user: User = Depends(get_current_user)):
    return user


@router.post("/login", response_model=TokenResponse)
def login(body: UserLogin, db=Depends(get_db)):
    doc = users_collection.find_one({"email": body.email})
    if not doc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    
    user = user_from_doc(doc)
    if not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if user.is_blocked:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account blocked")
    
    token = create_access_token(user.id, extra={"role": user.role})
    return TokenResponse(access_token=token)
