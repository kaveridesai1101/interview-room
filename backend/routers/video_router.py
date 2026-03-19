from fastapi import APIRouter, UploadFile, File, BackgroundTasks, Depends, Header
from fastapi.responses import StreamingResponse
import shutil
import os
import uuid
from typing import List
from sqlalchemy.orm import Session
from ..database import get_db
from ..services.video_service import video_service
from ..models.surveillance import Incident, VideoAnalysisHistory

router = APIRouter(prefix="/video", tags=["video"])

UPLOAD_DIR = os.path.abspath("uploads/videos")

@router.get("/stream/{camera_id}")
async def stream_camera(camera_id: str, source: str = "0"):
    """Live MJPEG Stream for a specific camera."""
    # Note: 'source' can be an RTSP URL or camera index
    return StreamingResponse(
        video_service.gen_frames(camera_id, source),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

@router.post("/upload")
async def upload_video(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    camera_id: str = "UPLOAD-01",
    x_user_id: str = Header("admin")
):
    """Upload a video for asynchronous AI analysis."""
    if not os.path.exists(UPLOAD_DIR):
        os.makedirs(UPLOAD_DIR)
        
    file_id = str(uuid.uuid4())
    file_ext = os.path.splitext(file.filename)[1]
    file_path = os.path.abspath(os.path.join(UPLOAD_DIR, f"{file_id}{file_ext}"))
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Log to Admin Audit Trail
    from ..services.audit_service import audit_service
    audit_service.log_action(
        user_id=x_user_id,
        action="Video Upload Started",
        details=f"File: {file.filename} | Camera: {camera_id}"
    )

    # Queue background analysis
    background_tasks.add_task(
        video_service.analyze_video_file, 
        file_path, 
        camera_id, 
        x_user_id,
        file_id
    )
    
    return {
        "status": "upload_success",
        "file_id": file_id,
        "message": "Background analysis started."
    }

@router.get("/analytics/{file_id}")
async def get_video_analytics(file_id: str, db: Session = Depends(get_db)):
    """Retrieve all incidents found in a specific video file and its processing progress."""
    incidents = db.query(Incident).filter(Incident.video_path.contains(file_id)).all()
    progress_data = video_service.analysis_progress.get(file_id, {"progress": 0, "status": "Pending"})
    print(f"DEBUG_POLL: File={file_id}, Progress={progress_data['progress']}, Status={progress_data['status']}", flush=True)
    
    return {
        "file_id": file_id,
        "incident_count": len(incidents),
        "incidents": incidents,
        "progress": progress_data["progress"],
        "status": progress_data["status"],
        "primary_incident_id": incidents[0].id if incidents else None
    }

@router.get("/history")
async def get_video_history(db: Session = Depends(get_db), x_user_id: str = Header("admin")):
    """Fetch the complete analysis history for the current user."""
    history = db.query(VideoAnalysisHistory).filter(VideoAnalysisHistory.user_id == x_user_id).order_by(VideoAnalysisHistory.upload_time.desc()).all()
    return history

