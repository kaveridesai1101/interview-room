from datetime import datetime, timezone
from sqlalchemy.orm import Session
from ..database import SessionLocal
from ..models.surveillance import Incident
from ..services.pdf_service import pdf_service
from ..api.websocket_manager import manager
import asyncio
import logging
import os

logger = logging.getLogger(__name__)

class IncidentService:
    @staticmethod
    def log_incident(incident_data: dict):
        """
        Unified method to save incident, generate PDF, and broadcast alert.
        Used by both live AI processor and historical video analysis.
        """
        db: Session = SessionLocal()
        try:
            # 1. Create Incident Record
            incident = Incident(
                timestamp=datetime.fromisoformat(incident_data['timestamp']) if isinstance(incident_data['timestamp'], str) else incident_data['timestamp'],
                camera_id=incident_data['camera_id'],
                type=incident_data['type'],
                severity=incident_data['severity'],
                description=incident_data['description'],
                ai_summary=incident_data.get('ai_summary'),
                confidence=incident_data.get('confidence', 0.0),
                owner_id=incident_data.get('owner_id', 'admin'),
                video_path=incident_data.get('video_path'),
                video_offset=incident_data.get('video_offset', 0.0)
            )
            db.add(incident)
            db.commit()
            db.refresh(incident)

            # Log this detection to the Admin Audit Trail
            from .audit_service import audit_service
            audit_service.log_action(
                user_id=incident.owner_id,
                action=f"Incident Detected: {incident.type}",
                details=f"Severity: {incident.severity} | Location: {incident.camera_id}"
            )

            # 2. Automated PDF Report Generation
            try:
                report_path = pdf_service.create_report(incident)
                incident.report_path = report_path
                db.commit()
                logger.info(f"Report generated: {report_path}")

                # Log report generation
                audit_service.log_action(
                    user_id=incident.owner_id,
                    action="Incident Report Generated",
                    details=f"Type: {incident.type} | PDF: {os.path.basename(report_path)}"
                )
            except Exception as pdf_err:
                logger.error(f"PDF Generation Failed: {pdf_err}")

            # 3. Broadcast to Frontend via WebSocket
            broadcast_data = {
                "msg_type": "incident",
                "id": incident.id,
                "timestamp": incident.timestamp.replace(tzinfo=timezone.utc).isoformat().replace("+00:00", "Z"),
                "camera_id": incident.camera_id,
                "type": incident.type,
                "severity": incident.severity,
                "description": incident.description,
                "ai_summary": incident.ai_summary,
                "confidence": incident.confidence,
                "owner_id": incident.owner_id,
                "report_url": incident.report_path,
                "video_path": incident.video_path,
                "video_offset": incident.video_offset
            }
            
            # Since broadcast is async, we use the loop
            try:
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    loop.create_task(manager.broadcast(broadcast_data, target_user_id=incident.owner_id))
                else:
                    asyncio.run(manager.broadcast(broadcast_data, target_user_id=incident.owner_id))
            except Exception as ws_err:
                logger.error(f"WebSocket Broadcast Failed: {ws_err}")

            return incident
        except Exception as e:
            logger.error(f"Incident Logging Failed: {e}")
            db.rollback()
            return None
        finally:
            db.close()

incident_service = IncidentService()
