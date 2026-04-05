from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from database import users_collection
from schemas.user import MessageResponse
from utils.email import create_and_send_otp, mark_otp_used, verify_otp
from utils.security import hash_password

router = APIRouter(prefix="/auth", tags=["auth"])


class ForgotPasswordRequest(BaseModel):
    email: str


class VerifyOTPRequest(BaseModel):
    email: str
    otp: str


class ResetPasswordRequest(BaseModel):
    email: str
    otp: str
    new_password: str


@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(body: ForgotPasswordRequest):
    """Request password reset OTP."""
    success, message = create_and_send_otp(body.email)
    if success:
        return MessageResponse(message=message)
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail=message
    )


@router.post("/verify-otp", response_model=MessageResponse)
def verify_otp_endpoint(body: VerifyOTPRequest):
    """Verify OTP is valid."""
    if verify_otp(body.email, body.otp):
        return MessageResponse(message="OTP verified successfully")
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Invalid or expired OTP"
    )


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(body: ResetPasswordRequest):
    """Reset password with OTP."""
    # Verify OTP first
    if not verify_otp(body.email, body.otp):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP"
        )
    
    # Check if user exists
    user = users_collection.find_one({"email": body.email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update password
    new_password_hash = hash_password(body.new_password)
    users_collection.update_one(
        {"email": body.email},
        {"$set": {"password_hash": new_password_hash}}
    )
    
    # Mark OTP as used
    mark_otp_used(body.email, body.otp)
    
    return MessageResponse(message="Password reset successfully")
