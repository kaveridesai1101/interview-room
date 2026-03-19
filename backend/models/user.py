from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text
from datetime import datetime
from ..database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    # Roles: "student", "recruiter", "admin"
    role = Column(String, default="student")
    is_active = Column(Boolean, default=False)  # False until OTP verified
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

    # Common Profile
    full_name = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    organization = Column(String, nullable=True)
    bio = Column(String, nullable=True)

    # Student-specific
    experience = Column(String, nullable=True)       # e.g. "2 years"
    education = Column(String, nullable=True)        # e.g. "B.Tech Computer Science"
    target_domain = Column(String, nullable=True)    # e.g. "Backend Developer"
    face_embedding = Column(Text, nullable=True)     # base64 face capture

    # Recruiter-specific
    company = Column(String, nullable=True)
    job_position = Column(String, nullable=True)     # position they're hiring for
