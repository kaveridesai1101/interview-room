from sqlalchemy.orm import Session
from datetime import datetime
from ..models.user import User
from ..utils.security import security_utils
from ..utils.jwt_handler import jwt_handler
from ..models.audit_log import AuditLog

class AuthService:
    @staticmethod
    def get_password_hash(password: str) -> str:
        return security_utils.get_password_hash(password)

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        return security_utils.verify_password(plain_password, hashed_password)

    @staticmethod
    def authenticate_user(db: Session, email: str, password: str) -> User:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            return None
        if not security_utils.verify_password(password, user.hashed_password):
            return None
        return user

    @staticmethod
    def log_activity(db: Session, user_id: int, action: str, ip_address: str = None, details: str = None):
        log = AuditLog(
            user_id=user_id,
            action=action,
            ip_address=ip_address,
            details=details
        )
        db.add(log)
        db.commit()

auth_service = AuthService()
