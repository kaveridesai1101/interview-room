import time
import datetime
from datetime import timezone
from .profiles.profile_manager import ProfileManager
from .detectors.yolo_detector import YOLODetector
from .detectors.motion_detector import MotionDetector
from .detectors.action_detector import ActionDetector
from .tracking.object_tracker import CentroidTracker
from .scoring.threat_engine import ThreatEngine
from .buffer.temporal_buffer import TemporalBuffer

class UnifiedAIPipeline:
    def __init__(self, profile_name="public", camera_id="CAM_01"):
        self.camera_id = camera_id
        self.profile_manager = ProfileManager()
        self.profile = self.profile_manager.get_profile("interview")
        
        # Initialize with model ensemble for maximum accuracy
        model_configs = [
            {"path": "backend/ai/models/yolov8n.pt", "type": "primary"},
            {"path": "backend/ai/models/yolov8n-pose.pt", "type": "pose"}, 
            {"path": "backend/ai/models/weapon_v1.pt", "type": "weapon"},
        ]
        
        self.yolo = YOLODetector(model_configs=model_configs)
        self.motion = MotionDetector()
        self.action = ActionDetector()
        self.tracker = CentroidTracker()
        self.scoring = ThreatEngine(self.profile)
        self.buffer = TemporalBuffer(size=10)

    def process(self, frame, location="Main Entrance", skip_stale=False):
        """
        Main execution flow:
        Preprocessing -> Detection -> Tracking -> Motion -> Action -> Scoring -> Buffer -> Decision
        """
        timestamp = datetime.datetime.now(timezone.utc).isoformat()
        
        # 1. Motion Analysis (Intensity 0-1)
        motion_intensity = self.motion.get_motion_intensity(frame)
        
        # 2. YOLOv8 Object Detection (Ensemble + Pose)
        detections, pose_results = self.yolo.detect(frame, target_classes=self.profile.get("target_classes"))
        
        # 3. Object Tracking
        rects = [det["bbox"] for det in detections]
        tracks = self.tracker.update(rects)
        
        # 4. Action Recognition (High Accuracy Pose-enabled)
        actions = self.action.detect_actions(tracks, detections, pose_results=pose_results)
        
        # 5. Threat Scoring
        threat_score = self.scoring.calculate_score(detections, actions, motion_intensity)
        
        # 6. Temporal Smoothing
        self.buffer.check_stale(timeout=1.5, skip_stale=skip_stale) # Wall-clock timeout is skipped for video files
        
        is_anomaly = threat_score >= self.profile["thresholds"].get("suspicious", 30)
        self.buffer.add({
            "threat_score": threat_score,
            "action": actions[0]["type"] if actions else None,
            "is_anomaly": is_anomaly
        })
        
        smoothed_score = self.buffer.get_smoothed_score()
        majority_action = self.buffer.get_majority_action()
        decision_trigger = self.buffer.get_trigger_logic()
        
        # 7. Semantic Label Mapping
        ACTION_MAP = {
            "fight": "Physical Fight Detected",
            "weapon_threat": "Weapon Threat Detected",
            "suspicious_object": "Suspicious Object Detected",
            "violence": "Physical Disturbance",
            "loitering": "Prohibited Persistence",
            "unauthorized": "Restricted Zone Entry",
            "phone_violation": "Mobile Device Usage Detected",
            "multiple_persons": "Unauthorized Person/Helper Presence",
            "unauthorized_object": "Use of Prohibited Material",
            "gaze_distraction": "Eye Gaze Deviation (Copy Case)",
            "suspicious_gesture": "Covert Communication Detected"
        }

        semantic_action = ACTION_MAP.get(majority_action, "No Significant Incident") if majority_action else "Monitoring"

        # 8. Structured JSON Incident Output
        output = {
            "incident_id": int(time.time()),
            "profile": self.profile["name"].lower(),
            "camera_id": self.camera_id,
            "timestamp": timestamp,
            "detected_objects": list(set([d["class"] for d in detections])),
            "action_detected": semantic_action,
            "threat_score": round(smoothed_score, 2),
            "severity": self.scoring.get_severity(smoothed_score),
            "confidence": float(max([d["confidence"] for d in detections] or [0.0])),
            "location": location,
            "temporal_consistency": float(len(self.buffer.buffer) / self.buffer.buffer.maxlen),
            "is_confirmed_incident": decision_trigger and smoothed_score > 20, 
            "motion_active": motion_intensity > 0.05,
            "detections": detections,
            "actions": actions
        }

        
        if output["threat_score"] > 20:
             print(f"DEBUG_VISION: Score={output['threat_score']} Detections={output['detected_objects']} Action={output['action_detected']}", flush=True)
        
        return output, frame
