import cv2
import asyncio
import os
import time
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from ..ai.pipeline import UnifiedAIPipeline
from ..models.surveillance import Incident, VideoAnalysisHistory
from ..database import SessionLocal
from ..services.incident_service import incident_service

logger = logging.getLogger(__name__)

class VideoAnalysisService:
    def __init__(self):
        self.active_streams = {} # camera_id -> CV2 Capture
        self.pipeline_cache = {} # camera_id -> UnifiedAIPipeline
        self.analysis_progress = {} # file_id -> {"progress": int, "status": str}

    def get_pipeline(self, camera_id, profile="public"):
        if camera_id not in self.pipeline_cache:
            self.pipeline_cache[camera_id] = UnifiedAIPipeline(profile_name=profile, camera_id=camera_id)
        return self.pipeline_cache[camera_id]

    async def gen_frames(self, camera_id: str, source: str):
        """Generates MJPEG frames for a live RTSP or Local camera."""
        cap = cv2.VideoCapture(source)
        pipeline = self.get_pipeline(camera_id)
        
        try:
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break
                
                # Process with AI
                analysis, processed_frame = pipeline.process(frame)
                
                # Encode and Yield
                _, buffer = cv2.imencode('.jpg', processed_frame)
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
                
                await asyncio.sleep(0.01) # Yield control
        finally:
            cap.release()

    async def analyze_video_file(self, video_path: str, camera_id: str, owner_id: str, file_id: str = None):
        """Background task to analyze a recorded video file and log incidents."""
        print(f"DEBUG_PROGRESS: Starting analysis for {video_path} (ID: {file_id})", flush=True)
        
        db = SessionLocal()
        # Initialize History Record
        history_entry = VideoAnalysisHistory(
            user_id=owner_id,
            video_filename=os.path.basename(video_path),
            video_path=video_path,
            status="Analyzing",
            upload_time=datetime.utcnow()
        )
        db.add(history_entry)
        db.commit()
        db.refresh(history_entry)

        if file_id:
            self.analysis_progress[file_id] = {"progress": 0, "status": "Analyzing..."}
            
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            print(f"DEBUG_PROGRESS: ERROR - Could not open video file: {video_path}", flush=True)
            if file_id:
                self.analysis_progress[file_id] = {"progress": 0, "status": "Error: File Open Failed"}
            history_entry.status = "Error"
            db.commit()
            db.close()
            return

        pipeline = self.get_pipeline(camera_id)
        fps = cap.get(cv2.CAP_PROP_FPS) or 30
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        print(f"DEBUG_PROGRESS: FPS={fps}, Total Frames={total_frames}", flush=True)
        
        frame_count = 0
        incident_types_set = set()
        
        try:
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    print(f"DEBUG_PROGRESS: End of file reached at frame {frame_count}", flush=True)
                    break
                
                # Update progress periodically
                if file_id and frame_count % 15 == 0:
                    if total_frames > 0:
                        progress = int((frame_count / total_frames) * 100)
                    else:
                        # Fallback: simulate progress if frame count is unknown (not ideal but better than 0%)
                        progress = min(99, (frame_count // 5)) 
                        
                    self.analysis_progress[file_id] = {"progress": progress, "status": "Analyzing..."}
                    if frame_count % 150 == 0:
                        print(f"DEBUG_PROGRESS: File={file_id}, Progress={progress}%, Frame={frame_count}/{total_frames}", flush=True)
                    
                # Analyze every 5th frame to save CPU
                if frame_count % 5 == 0:
                    analysis, _ = pipeline.process(frame, skip_stale=True)
                    
                    if analysis["is_confirmed_incident"]:
                        # Calculate timestamp offset
                        offset_seconds = frame_count / fps
                        
                        # Semantic labelling for professional report
                        action = analysis.get("action_detected", "none").lower()
                        objects = analysis.get("detected_objects", [])
                        person_count = objects.count("person")
                        
                        incident_type = "Suspicious Behaviour"
                        if "fight" in action: incident_type = "Physical Fight Detected"
                        elif "fall" in action: incident_type = "Fall Detected"
                        elif any(x in objects for x in ["knife", "weapon", "gun"]): incident_type = "Weapon Threat Detected"
                        elif "crowd" in action: incident_type = "Crowd Aggression"
                        elif "phone" in action: incident_type = "Mobile Device Usage Detected"
                        elif "persons" in action: incident_type = "Unauthorized Person/Helper Presence"
                        elif "object" in action: incident_type = "Use of Prohibited Material"
                        elif "gaze" in action: incident_type = "Eye Gaze Deviation (Copy Case)"
                        elif "gesture" in action: incident_type = "Covert Communication Detected"
                        elif "blur" in action or "focus" in action or "window" in action: incident_type = "Window Switch Violation"
                        
                        incident_types_set.add(incident_type)
                        
                        incident_data = {
                            "timestamp": datetime.now().isoformat(),
                            "camera_id": camera_id,
                            "type": incident_type,
                            "severity": analysis["severity"],
                            "description": f"Incident detected at {round(offset_seconds, 2)}s into recording involving {person_count} subjects.",
                            "ai_summary": analysis.get("ai_explanation", ""), # Will be enriched in PDF service
                            "confidence": analysis["confidence"],
                            "owner_id": owner_id,
                            "video_path": video_path,
                            "video_offset": offset_seconds
                        }
                        # Use unified service
                        incident_service.log_incident(incident_data)
                
                frame_count += 1
                if frame_count % 10 == 0:
                    await asyncio.sleep(0.01) # Yield more frequently and for slightly longer to ensure loop responsiveness
                    
            logger.info(f"Finished analysis for {video_path}. Total frames: {frame_count}")
        finally:
            cap.release()
            
            # Finalize History Entry
            all_incidents = db.query(Incident).filter(Incident.video_path == video_path).all()
            history_entry.incident_count = len(all_incidents)
            history_entry.incident_types = ", ".join(list(incident_types_set))
            history_entry.status = "Completed"
            history_entry.analysis_time = datetime.utcnow()
            
            # If there was at least one incident, we might have a report path from one of them
            if all_incidents:
                history_entry.report_path = all_incidents[0].report_path
                
            db.commit()
            
            # Update analysis status in history and log to audit trail
            # We use the existing history_entry object which is already committed and refreshed
            # No need to query again with file_id as history_entry is the correct object.
            
            # Log to Admin Audit Trail
            from ..services.audit_service import audit_service
            audit_service.log_action(
                user_id=history_entry.user_id,
                action="Video Analysis Completed",
                details=f"File: {history_entry.video_filename} | Incidents found: {len(all_incidents)}"
            )
            
            db.close()
            
            if file_id:
                self.analysis_progress[file_id] = {"progress": 100, "status": "Completed"}

video_service = VideoAnalysisService()

