from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models.surveillance import Incident, Camera
from ..api.websocket_manager import manager
from pydantic import BaseModel

router = APIRouter(tags=["surveillance"])

class IncidentUpdate(BaseModel):
    status: str
    notes: Optional[str] = None

class IncidentCreate(BaseModel):
    type: str
    description: str
    severity: str
    camera_id: str
    timestamp: str

from ..services.incident_service import incident_service

@router.post("/incidents")
async def create_incident(incident: IncidentCreate, x_user_id: str = Header("admin"), db: Session = Depends(get_db)):
    incident_data = {
        "type": incident.type,
        "description": incident.description,
        "severity": incident.severity,
        "camera_id": incident.camera_id,
        "timestamp": incident.timestamp,
        "owner_id": x_user_id,
        "confidence": 1.0 # Manual/Browser violations are 100% certain
    }
    
    # Use unified service to handle DB save + PDF + Broadcast
    new_incident = incident_service.log_incident(incident_data)
    
    if not new_incident:
        raise HTTPException(status_code=500, detail="Failed to log violation")
        
    return new_incident

from datetime import datetime, timezone

@router.get("/incidents")
async def get_incidents(x_user_id: str = Header("admin"), db: Session = Depends(get_db)):
    if x_user_id == "admin":
        incidents = db.query(Incident).order_by(Incident.timestamp.desc()).all()
    else:
        incidents = db.query(Incident).filter(Incident.owner_id == x_user_id).order_by(Incident.timestamp.desc()).all()
    
    # Manually format to ensure UTC awareness (Z suffix) for frontend
    results = []
    for inc in incidents:
        inc_dict = {c.name: getattr(inc, c.name) for c in inc.__table__.columns}
        if inc.timestamp:
            # Add Z if missing to force UTC in browser
            inc_dict['timestamp'] = inc.timestamp.replace(tzinfo=timezone.utc).isoformat().replace("+00:00", "Z")
        results.append(inc_dict)
    return results

@router.put("/incidents/{incident_id}")
async def update_incident(incident_id: int, update: IncidentUpdate, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    incident.status = update.status
    db.commit()
    db.refresh(incident)
    
    await manager.broadcast({
        "msg_type": "incident_update",
        "id": incident.id,
        "status": incident.status,
        "notes": update.notes
    })
    return incident

@router.get("/cameras")
async def get_cameras(x_user_id: str = Header("admin"), db: Session = Depends(get_db)):
    if x_user_id == "admin":
        return db.query(Camera).all()
    return db.query(Camera).filter(Camera.owner_id == x_user_id).all()

@router.post("/cameras")
async def add_camera(name: str, location: str, source: str, x_user_id: str = Header("admin"), db: Session = Depends(get_db)):
    new_cam = Camera(name=name, location=location, source_url=source, owner_id=x_user_id)
    db.add(new_cam)
    db.commit()
    db.refresh(new_cam)
    return new_cam

@router.delete("/cameras/{camera_id}")
async def delete_camera(camera_id: int, x_user_id: str = Header("admin"), db: Session = Depends(get_db)):
    cam = db.query(Camera).filter(Camera.id == camera_id).first()
    if not cam:
        raise HTTPException(status_code=404, detail="Camera not found")
        
    if cam.owner_id != x_user_id and x_user_id != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this camera")
        
    db.delete(cam)
    db.commit()
    return {"message": "Camera deleted successfully"}
