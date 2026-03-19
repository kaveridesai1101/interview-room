from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Request 
from sqlalchemy.orm import Session

# Using absolute imports
from ..database import get_db
from ..models.user import User
from ..services.auth_service import auth_service
from ..services.otp_service import otp_service
from ..services.email_service import email_service
from ..services.audit_service import audit_service
from ..utils.jwt_handler import jwt_handler
from ..schemas.auth_schema import (
    LoginRequest, VerifyOTPRequest, Token, ResendOTPRequest,
    SignUpRequest, ForgotPasswordRequest, ResetPasswordRequest
)

router = APIRouter(prefix="/auth", tags=["auth"])

ALLOWED_ROLES = ("student", "recruiter")

@router.post("/signup")
async def signup(request: Request, signup_data: SignUpRequest, db: Session = Depends(get_db)):
    # Validate role
    if signup_data.role not in ALLOWED_ROLES:
        raise HTTPException(status_code=400, detail=f"Role must be one of: {', '.join(ALLOWED_ROLES)}")

    # Check existing user
    existing_user = db.query(User).filter(User.email == signup_data.email).first()
    if existing_user:
        if existing_user.is_active:
            raise HTTPException(status_code=400, detail="User already exists")
        user = existing_user
        user.hashed_password = auth_service.get_password_hash(signup_data.password)
    else:
        user = User(
            email=signup_data.email,
            hashed_password=auth_service.get_password_hash(signup_data.password),
            role=signup_data.role,
            full_name=signup_data.full_name,
            is_active=False
        )
        # Role-specific fields
        if signup_data.role == "student":
            user.education = signup_data.education
            user.experience = signup_data.experience
            user.target_domain = signup_data.target_domain
        elif signup_data.role == "recruiter":
            user.company = signup_data.company
            user.job_position = signup_data.job_position

        db.add(user)

    db.commit()
    db.refresh(user)

    # Send OTP
    otp_code = otp_service.create_otp(db, user.id)
    email_sent = email_service.send_otp_email(user.email, otp_code)
    if not email_sent:
        raise HTTPException(status_code=500, detail="Failed to send verification email")

    return {"message": "Verification code sent to your email", "role": user.role}

@router.post("/verify-signup", response_model=Token)
async def verify_signup(request: Request, verify_data: VerifyOTPRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == verify_data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if otp_service.verify_otp(db, user.id, verify_data.otp):
        user.is_active = True
        user.last_login = datetime.utcnow()
        db.commit()

        access_token = jwt_handler.create_access_token(
            data={"sub": user.email, "role": user.role, "id": user.id}
        )
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "email": user.email,
                "role": user.role,
                "id": user.id,
                "name": user.full_name
            }
        }
    else:
        raise HTTPException(status_code=401, detail="Invalid or expired verification code")

@router.post("/login", response_model=Token)
async def login(request: Request, login_data: LoginRequest, db: Session = Depends(get_db)):
    user = auth_service.authenticate_user(db, login_data.email, login_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account not verified. Please check your email for OTP.")

    access_token = jwt_handler.create_access_token(
        data={"sub": user.email, "role": user.role, "id": user.id}
    )
    user.last_login = datetime.utcnow()
    db.commit()

    try:
        audit_service.log_action(
            user_id=user.id,
            action="User Login",
            details=f"{user.full_name or user.email} ({user.role}) logged in.",
            ip_address=request.client.host
        )
    except Exception:
        pass

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "email": user.email,
            "role": user.role,
            "id": user.id,
            "name": user.full_name
        }
    }
