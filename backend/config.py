import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # App Config
    APP_NAME: str = "Sentinel AI Interview Proctor"
    DEBUG: bool = True
    PORT: int = 8000
    
    # Database
    DATABASE_URL: str = "sqlite:///./surveillance_system.db"
    
    # JWT Config
    SECRET_KEY: str = "7b9d7c0f1e2a3b4c5d6e7f8g9h0i1j2k3l4m5n6o7p8q9r0s1t2u3v4w5x6y7z8"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    
    # SMTP Config
    SMTP_SERVER: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    
    # OTP Config
    OTP_EXPIRY_MINUTES: int = 5
    OTP_RESEND_COOLDOWN_SECONDS: int = 60
    OTP_MAX_ATTEMPTS: int = 3

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
