import numpy as np
from collections import deque
import logging

logger = logging.getLogger(__name__)

class ThreatScoringEngine:
    """
    Advanced Threat Scoring Engine for Surveillance AI.
    Consolidates multiple computer vision signals into a unified, smoothed threat score.
    """
    
    def __init__(self, window_size=10):
        self.window_size = window_size
        self.score_history = deque(maxlen=window_size)
        
        # Configuration-driven weights (Sum to 1.0)
        self.weights = {
            "weapon": 0.35,      # Critical priority
            "action": 0.20,      # Behavioral priority (e.g., running, fighting)
            "object": 0.15,      # General presence (e.g., person detected)
            "motion": 0.15,      # Kinetic activity
            "proximity": 0.15    # Inter-subject distance (closer = higher risk)
        }
        
    def _normalize_proximity(self, dist):
        """Inverts distance: 0.0 (touching) -> 1.0, 1.0 (far) -> 0.0."""
        return max(0.0, 1.0 - min(1.0, dist))

    def calculate_instant_score(self, obj_conf, weapon_conf, motion_score, action_prob, proximity_dist):
        """
        Calculates raw threat score for a single frame (0.0 to 100.0).
        
        Args:
            obj_conf (float): Confidence of general subject detection (0-1).
            weapon_conf (float): Confidence of weapon detection (0-1).
            motion_score (float): Normalized motion intensity (0-1).
            action_prob (float): Probability of aggressive action (0-1).
            proximity_dist (float): Normalized inter-subject distance (0-1).
        """
        prox_score = self._normalize_proximity(proximity_dist)
        
        raw_score = (
            (weapon_conf * self.weights["weapon"]) +
            (action_prob * self.weights["action"]) +
            (obj_conf * self.weights["object"]) +
            (motion_score * self.weights["motion"]) +
            (prox_score * self.weights["proximity"])
        ) * 100.0
        
        return min(100.0, max(0.0, raw_score))

    def update(self, obj_conf, weapon_conf, motion_score, action_prob, proximity_dist):
        """
        Updates the engine with new frame data and returns the smoothed threat score.
        """
        instant = self.calculate_instant_score(obj_conf, weapon_conf, motion_score, action_prob, proximity_dist)
        self.score_history.append(instant)
        
        # Rolling average smoothing
        smoothed = float(np.mean(self.score_history))
        return smoothed

    def get_classification(self, score):
        """Returns severity level based on score thresholds."""
        if score >= 80: return "Critical"
        if score >= 60: return "High Risk"
        if score >= 30: return "Suspicious"
        return "Normal"

    def reset(self):
        """Clears the temporal buffer."""
        self.score_history.clear()

# Example Usage & Test Logic
if __name__ == "__main__":
    engine = ThreatScoringEngine(window_size=10)
    
    # Simulate a sudden spike (weapon detection)
    print("--- Simulating Weapon Detection Spike ---")
    for i in range(15):
        # Frame 5-10: Weapon detected with high confidence
        w_conf = 0.9 if 5 <= i <= 10 else 0.0
        score = engine.update(obj_conf=0.8, weapon_conf=w_conf, motion_score=0.4, action_prob=0.3, proximity_dist=0.6)
        severity = engine.get_classification(score)
        print(f"Frame {i:02d}: Score={score:5.2f} | Severity={severity}")
