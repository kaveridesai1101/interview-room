from datetime import datetime, timezone
from sqlalchemy.orm import Session
from ..database import SessionLocal
from ..models.audit_log import AuditLog
from ..api.websocket_manager import manager
import asyncio
import logging

logger = logging.getLogger(__name__)

class AuditService:
    @staticmethod
    def log_action(user_id: int, action: str, details: str = None, ip_address: str = None):
        """
        Logs an operator action to the database and broadcasts it to all connected admins.
        """
        db: Session = SessionLocal()
        try:
            timestamp = datetime.now(timezone.utc)
            
            # 1. Save to Database
            log = AuditLog(
                user_id=user_id,
                action=action,
                details=details,
                ip_address=ip_address,
                timestamp=timestamp
            )
            db.add(log)
            db.commit()
            db.refresh(log)

            # 2. Prepare Broadcast Data
            broadcast_data = {
                "msg_type": "audit_log",
                "id": log.id,
                "user_id": log.user_id,
                "action": log.action,
                "details": log.details,
                "timestamp": log.timestamp.isoformat().replace("+00:00", "Z"),
                "ip_address": log.ip_address
            }

            # 3. Broadcast to Admins Real-time
            try:
                loop = asyncio.get_event_loop()
                # We target 'admin' specifically in the manager
                if loop.is_running():
                    loop.create_task(manager.broadcast(broadcast_data, target_user_id="admin"))
                else:
                    asyncio.run(manager.broadcast(broadcast_data, target_user_id="admin"))
            except Exception as ws_err:
                logger.error(f"Audit Broadcast Failed: {ws_err}")

            return log
        except Exception as e:
            logger.error(f"Audit Logging Failed: {e}")
            db.rollback()
            return None
        finally:
            db.close()

audit_service = AuditService()
