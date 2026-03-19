import logging
import time
import threading
import random
from datetime import datetime
import asyncio
import queue

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Critical Vision Libs
try:
    import cv2
    import numpy as np
    HAS_AI_LIBS = True
except ImportError as e:
    print(f"CRITICAL IMPORT ERROR: {e}", flush=True)
    HAS_AI_LIBS = False
    logger.warning(f"CRITICAL: OpenCV/NumPy not found. {e}")

# Advanced AI Libs (Gemini Integration)
try:
    import google.generativeai as genai
    HAS_ADVANCED_AI = True
except ImportError:
    HAS_ADVANCED_AI = False
    logger.warning("Gemini SDK not found. Visual analysis disabled.")

from ..database import SessionLocal
from ..models.surveillance import Incident
from .pipeline import UnifiedAIPipeline

class AIProcessor:
    camera_id: str
    owner_id: str
    is_running: bool
    
    def __init__(self, broadcast_callback=None, save_incident_callback=None, realtime_callback=None, profile="public"):
        self.is_running = False
        self.broadcast_callback = broadcast_callback
        self.save_incident_callback = save_incident_callback
        self.realtime_callback = realtime_callback
        self.camera_id = "WEB-01"
        self.owner_id = "admin"
        self.frame_queue = queue.Queue(maxsize=10)
        self.cap = None
        
        # Production-ready Unified AI Pipeline
        self.pipeline = UnifiedAIPipeline(profile_name=profile, camera_id=self.camera_id)
        
    def start_feed(self, source=0, camera_id="DEMO-USER-CAM", owner_id="admin"):
        self.camera_id = camera_id
        self.owner_id = owner_id
        if self.is_running: return
        self.is_running = True
        self.thread = threading.Thread(target=self._process_loop, args=(source,), daemon=True)
        self.thread.start()
        
    def _process_loop(self, source):
        last_incident_save = time.time()
        
        if HAS_AI_LIBS:
            try:
                # Prioritize CAP_DSHOW on Windows for better hardware sharing/locking behavior
                self.cap = cv2.VideoCapture(source, cv2.CAP_DSHOW)
                if not self.cap.isOpened():
                    logger.info("DSHOW failed, attempting MSMF (Default)...")
                    self.cap = cv2.VideoCapture(source)
                
                if self.cap.isOpened():
                    # Set resolution to ensure stability
                    self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
                    self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
                    logger.info(f"SUCCESS: Camera initialized on source {source} using {'DSHOW' if self.cap.get(cv2.CAP_PROP_BACKEND) == cv2.CAP_DSHOW else 'MSMF'}")
                else:
                    logger.error(f"FAILED: Camera {source} could not be opened with DSHOW or MSMF.")
            except Exception as e:
                logger.error(f"Error initializing camera: {e}")

        print(f"DEBUG: Starting AI Processor loop for source {source}", flush=True)
        while self.is_running:
            frame_to_send = None
            if HAS_AI_LIBS:
                # 1. Hardware Presence Check
                if self.cap is None or not self.cap.isOpened():
                    try:
                        # Try default backend first for better compatibility
                        self.cap = cv2.VideoCapture(source)
                        if not self.cap.isOpened():
                            self.cap = cv2.VideoCapture(source, cv2.CAP_DSHOW)
                    except Exception as e:
                        logger.error(f"Error initializing camera: {e}")
                
                # 2. Frame Acquisition
                ret = False
                if self.cap and self.cap.isOpened():
                    ret, frame = self.cap.read()
                
                if ret:
                    frame_to_send = frame.copy()
                    try:
                        # 3. AI Pipeline Execution
                        analysis, _ = self.pipeline.process(frame)
                        
                        # 4. Real-time Telemetry
                        if self.realtime_callback:
                            stats_data = {
                                "type": "stats",
                                "owner_id": self.owner_id,
                                "threat_score": min(1.0, analysis.get("threat_score", 0) / 100.0),
                                "severity": analysis.get("severity", "Normal"),
                                "motion": analysis.get("motion_active", False),
                                "is_anomaly": analysis.get("is_confirmed_incident", False)
                            }
                            # Only return True for is_anomaly if it's really High Risk/Critical
                            stats_data["is_anomaly"] = analysis.get("severity") in ["High Risk", "Critical"]
                            self.realtime_callback(stats_data)

                        # 5. Incident Persistence
                        if analysis["is_confirmed_incident"] and (time.time() - last_incident_save > 20):
                            self._save_incident(analysis)
                            last_incident_save = time.time()

                        # 6. UI Overlay
                        self._draw_overlay(frame_to_send, analysis)
                    except Exception as e:
                        logger.error(f"Error in AI Loop: {e}")
                else:
                    # 7. Fallback: Hardware Lock Detection UI
                    frame = np.zeros((480, 640, 3), dtype=np.uint8)
                    cv2.putText(frame, "HARDWARE LOCKED / NO SIGNAL", (50, 240), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
                    frame_to_send = frame
                    
                    if self.realtime_callback:
                        self.realtime_callback({
                            "type": "stats",
                            "owner_id": self.owner_id,
                            "threat_score": 0.0,
                            "severity": "OFFLINE",
                            "motion": False,
                            "is_anomaly": False
                        })
                    time.sleep(1.0)
            else:
                time.sleep(0.5)

            # 8. Queue Management for Streaming
            if frame_to_send is not None:
                try:
                    _, buffer = cv2.imencode('.jpg', frame_to_send)
                    if not self.frame_queue.full():
                        self.frame_queue.put(buffer.tobytes())
                    else:
                        self.frame_queue.get_nowait()
                        self.frame_queue.put(buffer.tobytes())
                    # Minimal heartbeat to terminal
                    if int(time.time()) % 10 == 0:
                        print(f"DEBUG: Frame PUSH for source {source}", flush=True)
                except Exception as e:
                    logger.error(f"Queue error: {e}")
            
            time.sleep(0.01)

    def _draw_overlay(self, frame, analysis):
        """Draws senior-engineer quality overlay on the frame."""
        h, w, _ = frame.shape
        
        # Color based on severity
        color = (0, 255, 0) # Normal
        if analysis["severity"] == "Suspicious": color = (0, 255, 255)
        elif analysis["severity"] == "High Risk": color = (0, 165, 255)
        elif analysis["severity"] == "Critical": color = (0, 0, 255)
        
        # Draw Detections
        for det in analysis.get("detections", []):
            x1, y1, x2, y2 = map(int, det["bbox"])
            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            cv2.putText(frame, f"{det['class']} {int(det['confidence']*100)}%", (x1, y1-10), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)

        # Draw Dashboard UI Element
        overlay_h = 100
        sub_img = frame[0:overlay_h, 0:300]
        rect = np.full(sub_img.shape, (0, 0, 0), dtype=np.uint8)
        res = cv2.addWeighted(sub_img, 0.5, rect, 0.5, 1.0)
        frame[0:overlay_h, 0:300] = res
        
        cv2.putText(frame, f"AI {analysis['profile'].upper()} ENGINE", (15, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        cv2.putText(frame, f"THREAT: {analysis['threat_score']}%", (15, 55), cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)
        cv2.putText(frame, f"ACTION: {analysis['action_detected'].upper()}", (15, 85), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)

    def _save_incident(self, analysis):
        """Saves structured JSON incident report to database."""
        if self.save_incident_callback:
            # Enforce the requested schema
            incident_data = {
                "type": analysis["action_detected"],
                "incident_id": analysis["incident_id"],
                "profile": analysis["profile"],
                "camera_id": analysis["camera_id"],
                "timestamp": analysis["timestamp"],
                "detected_objects": analysis["detected_objects"],
                "action_detected": analysis["action_detected"],
                "threat_score": analysis["threat_score"],
                "severity": analysis["severity"],
                "confidence": analysis["confidence"],
                "location": analysis["location"],
                "temporal_consistency": analysis["temporal_consistency"],
                "owner_id": self.owner_id
            }
            self.save_incident_callback(incident_data)

    def get_frame(self):
        try:
            return self.frame_queue.get(timeout=0.01)
        except:
            return None

    def stop(self):
        self.is_running = False
        if self.cap:
            self.cap.release()
