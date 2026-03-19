import random
import string
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from ..models.otp import OTP
from ..utils.security import security_utils
from ..config import settings

class OTPService:
    @staticmethod
    def generate_otp(length: int = 6) -> str:
        return ''.join(random.choices(string.digits, k=length))

    @staticmethod
    def create_otp(db: Session, user_id: int) -> str:
        # Check for existing valid OTP to prevent spam
        existing_otp = db.query(OTP).filter(
            OTP.user_id == user_id, 
            OTP.is_verified == False,
            OTP.expires_at > datetime.utcnow()
        ).first()
        
        if existing_otp:
            # Check resend cooldown
            cooldown_time = existing_otp.created_at + timedelta(seconds=settings.OTP_RESEND_COOLDOWN_SECONDS)
            if datetime.utcnow() < cooldown_time:
                return None # Cooldown active

        # Generate new OTP
        otp_code = OTPService.generate_otp()
        otp_hash = security_utils.get_password_hash(otp_code)
        
        new_otp = OTP(
            user_id=user_id,
            otp_hash=otp_hash,
            expires_at=datetime.utcnow() + timedelta(minutes=settings.OTP_EXPIRY_MINUTES)
        )
        db.add(new_otp)
        db.commit()
        return otp_code

    @staticmethod
    def verify_otp(db: Session, user_id: int, otp_code: str) -> bool:
        otp_record = db.query(OTP).filter(
            OTP.user_id == user_id,
            OTP.is_verified == False,
            OTP.expires_at > datetime.utcnow()
        ).order_by(OTP.created_at.desc()).first()

        if not otp_record:
            return False

        if otp_record.attempts >= settings.OTP_MAX_ATTEMPTS:
            return False

        if security_utils.verify_password(otp_code, otp_record.otp_hash):
            otp_record.is_verified = True
            db.commit()
            return True
        else:
            otp_record.attempts += 1
            db.commit()
            return False

otp_service = OTPService()
