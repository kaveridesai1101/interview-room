from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)

class ResendOTPRequest(BaseModel):
    email: EmailStr

class SignUpRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    # Role: student | recruiter
    role: str = "student"
    # Student fields
    education: Optional[str] = None
    experience: Optional[str] = None
    target_domain: Optional[str] = None
    # Recruiter fields
    company: Optional[str] = None
    job_position: Optional[str] = None

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)
    new_password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Optional[dict] = None
