import asyncio
import traceback
import time
import uvicorn
from datetime import datetime
from typing import Any

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, Query
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

# Using absolute imports for robust resolution
from backend.database import engine, Base, SessionLocal
from backend.config import settings
from backend.routers import (
    auth_router, user_router, surveillance_router, 
    video_router, report_router, ai_router, interview_router
)
from backend.middleware import ActivityLoggerMiddleware
from backend.ai.processor import AIProcessor
from backend.api.websocket_manager import manager
from backend.utils.security import security_utils
from backend.services.incident_service import incident_service
from backend.services.interview_service import interview_service

# Import all models for Base.metadata.create_all
from backend.models.user import User
from backend.models.otp import OTP
from backend.models.audit_log import AuditLog
from backend.models.surveillance import Incident, Camera, VideoAnalysisHistory
from backend.models.interview import InterviewSession, Question, EmotionLog, EyeContactLog, CopyDetectionEvent, QuestionAnswer

# Initialize Database DDL
Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.APP_NAME, redirect_slashes=False)

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(ActivityLoggerMiddleware)

# Mount Uploads for Video Playback
app.mount("/api/uploads", StaticFiles(directory="uploads"), name="uploads")

main_loop = None
ai_engine: AIProcessor | None = None  # Explicit type hint to avoid 'Never' inference

def handle_live_incident(incident_data: dict):
    incident_service.log_incident(incident_data)

def broadcast_stats(data: dict):
    """Bridge sync AI thread to async WebSocket manager."""
    try:
        if main_loop is not None and main_loop.is_running():
            asyncio.run_coroutine_threadsafe(manager.broadcast(data), main_loop)
            if data.get('is_anomaly'):
                print(f"TRACE: Broadcasting ANOMALY stats", flush=True)
    except Exception as e:
        print(f"DEBUG Error in broadcast_stats: {e}", flush=True)


@app.on_event("startup")
async def startup_event():
    global ai_engine, main_loop
    main_loop = asyncio.get_event_loop()
    try:
        ai_engine = AIProcessor(
            broadcast_callback=handle_live_incident,
            save_incident_callback=lambda x: None,
            realtime_callback=broadcast_stats
        )
        if ai_engine is not None:
            ai_engine.start_feed(source=0)
            print(f"INFO: AI Interview Room Vision System initialized.")
    except Exception as e:
        print(f"ERROR: AI Engine failure: {e}")
        traceback.print_exc()

    # Seed Data
    db = SessionLocal()
    try:
        # Seed Admin
        admin = db.query(User).filter(User.email == "admin@sentinel.ai").first()
        if not admin:
            admin = User(
                email="admin@sentinel.ai",
                hashed_password=security_utils.get_password_hash("admin123"),
                role="admin",
                is_active=True,
                full_name="System Admin"
            )
            db.add(admin)
            print("INFO: Initial Admin account created: admin@sentinel.ai / admin123")
        
        # Seed Interview Questions
        interview_service.seed_questions(db)
        
        db.commit()
    except Exception as e:
        print(f"ERROR: Seeding data failed: {e}")
        db.rollback()
    finally:
        db.close()

# Video Feed Endpoint
@app.get("/video_feed")
async def video_feed():
    async def gen():
        while True:
            if ai_engine is not None:
                frame = ai_engine.get_frame()
                if frame:
                    yield (b'--frame\r\n'
                           b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
                else:
                    await asyncio.sleep(0.1)
            else:
                await asyncio.sleep(0.1)
    return StreamingResponse(gen(), media_type="multipart/x-mixed-replace; boundary=frame")


# WebSocket Endpoint
@app.websocket("/ws/alerts")
async def websocket_alerts(websocket: WebSocket, user_id: str = Query("admin")):
    await manager.connect(websocket, user_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)

# Register Routers
app.include_router(auth_router.router)
app.include_router(user_router.router)
app.include_router(surveillance_router.router, prefix="/api")
app.include_router(video_router.router, prefix="/api")
app.include_router(report_router.router, prefix="/api")
app.include_router(ai_router.router, prefix="/api")
app.include_router(interview_router.router)

class AIContextReq(BaseModel):
    owner_id: str | int | None = None
    camera_id: str | None = None

@app.post("/api/ai/context")
async def set_ai_context(req: AIContextReq):
    global ai_engine
    if ai_engine is not None:
        if req.owner_id:
            ai_engine.owner_id = str(req.owner_id)
        if req.camera_id:
            ai_engine.camera_id = req.camera_id
        return {"status": "success", "context": {"owner_id": ai_engine.owner_id, "camera_id": ai_engine.camera_id}}
    return {"status": "error", "message": "AI Engine not initialized"}

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="0.0.0.0", port=settings.PORT, reload=True)
