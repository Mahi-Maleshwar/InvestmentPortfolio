import os
import random
import string
from datetime import datetime, timedelta, timezone

from database import password_reset_otp_collection, users_collection
from models.password_reset import PasswordResetOTP, password_reset_otp_to_doc

# Email configuration - using environment variables
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", SMTP_USER)


def generate_otp(length: int = 6) -> str:
    """Generate a random numeric OTP."""
    return ''.join(random.choices(string.digits, k=length))


def send_otp_email(to_email: str, otp: str) -> bool:
    """
    Send OTP email to user.
    Returns True if email was sent successfully.
    
    For production, configure SMTP credentials in environment variables:
    - SMTP_HOST
    - SMTP_PORT
    - SMTP_USER
    - SMTP_PASSWORD
    - FROM_EMAIL
    """
    # Check if SMTP is configured
    if not SMTP_USER or not SMTP_PASSWORD:
        # For development: print OTP to console instead of sending email
        print(f"\n{'='*50}")
        print(f"DEVELOPMENT MODE - OTP for {to_email}")
        print(f"OTP: {otp}")
        print(f"{'='*50}\n")
        return True
    
    try:
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart
        
        msg = MIMEMultipart()
        msg['From'] = FROM_EMAIL
        msg['To'] = to_email
        msg['Subject'] = 'Password Reset OTP - Investment Portfolio'
        
        body = f"""
Hello,

You requested a password reset for your Investment Portfolio account.

Your OTP (One-Time Password) is: {otp}

This OTP will expire in 10 minutes.

If you did not request this password reset, please ignore this email.

Best regards,
Investment Portfolio Team
"""
        
        msg.attach(MIMEText(body, 'plain'))
        
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
        
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False


def create_and_send_otp(email: str) -> tuple[bool, str]:
    """
    Create a new OTP and send it to the user.
    Returns (success, message)
    """
    # Check if user exists
    user = users_collection.find_one({"email": email})
    if not user:
        # Don't reveal if email exists or not for security
        return True, "If the email exists, an OTP has been sent."
    
    # Generate OTP
    otp = generate_otp()
    
    # Calculate expiration (10 minutes from now)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    
    # Invalidate any existing OTPs for this email
    password_reset_otp_collection.update_many(
        {"email": email, "used": False},
        {"$set": {"used": True}}
    )
    
    # Create new OTP record
    otp_record = PasswordResetOTP(
        email=email,
        otp=otp,
        expires_at=expires_at,
        used=False
    )
    password_reset_otp_collection.insert_one(password_reset_otp_to_doc(otp_record))
    
    # Send email
    if send_otp_email(email, otp):
        return True, "OTP sent successfully. Please check your email."
    else:
        return False, "Failed to send OTP email. Please try again."


def verify_otp(email: str, otp: str) -> bool:
    """Verify if OTP is valid and not expired."""
    record = password_reset_otp_collection.find_one({
        "email": email,
        "otp": otp,
        "used": False,
        "expires_at": {"$gt": datetime.now(timezone.utc)}
    })
    return record is not None


def mark_otp_used(email: str, otp: str) -> None:
    """Mark OTP as used after successful password reset."""
    password_reset_otp_collection.update_one(
        {"email": email, "otp": otp},
        {"$set": {"used": True}}
    )
