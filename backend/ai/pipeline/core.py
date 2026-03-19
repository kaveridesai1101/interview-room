import time
import logging
from .config import get_profile
from .motion import MotionDetector
from .detection import DetectionEngine
from .action import ActionRecognizer
from .scoring import ScoringEngine
from .buffer import TemporalBuffer

logger = logging.getLogger(__name__)

class AIPipeline:
    def __init__(self, profile_name="public"):
        self.profile = get_profile(profile_name)
        self.motion_detector = MotionDetector(sensitivity=self.profile.motion_sensitivity)
        self.detection_engine = DetectionEngine()
        self.action_recognizer = ActionRecognizer()
        self.scoring_engine = ScoringEngine(self.profile)
        self.temporal_buffer = TemporalBuffer(size=10)
        
        logger.info(f"AI Pipeline initialized with profile: {self.profile.name}")

    def process_frame(self, frame):
        """
        Executes the full modular pipeline on a single frame.
        Returns a dictionary with structured incident data.
        """
        timestamp = time.time()
        
        # 1. Motion Detection (Primary Filter)
        has_motion = self.motion_detector.detect(frame)
        
        detections = []
        actions = []
        
        # 2. Object Detection (Conditional)
        # We always detect if there is motion, or once every N frames in a real system
        if has_motion:
            detections = self.detection_engine.detect(frame, target_classes=self.profile.target_classes)
            
            # 3. Action Recognition (Based on detections)
            actions = self.action_recognizer.recognize(detections, timestamp)
            
        # 4. Threat Scoring
        raw_score = self.scoring_engine.calculate(detections, actions, has_motion)
        
        # 5. Temporal Smoothing
        frame_data = {
            "timestamp": timestamp,
            "detections": detections,
            "actions": actions,
            "motion": has_motion,
            "threat_score": raw_score
        }
        self.temporal_buffer.add(frame_data)
        
        smoothed_score = self.temporal_buffer.get_smoothed_score()
        
        # 6. Structured Output
        result = {
            "profile": self.profile.name,
            "threat_score": round(smoothed_score, 2),
            "is_anomaly": smoothed_score > 60.0,  # Threshold for anomaly
            "detections": detections,
            "actions": actions,
            "motion_active": has_motion,
            "timestamp": timestamp
        }
        
        return result
