from .config import DetectionProfile

class ScoringEngine:
    def __init__(self, profile: DetectionProfile):
        self.profile = profile

    def calculate(self, detections: list, actions: list, motion: bool) -> float:
        """
        Calculates a weighted threat score (0-100).
        """
        if not motion and not detections:
            return 0.0

        score = 0.0
        
        # 1. Base Motion Score
        if motion:
            score += 10.0 * self.profile.motion_sensitivity
            
        # 2. Detection Contributions
        for det in detections:
            cls_name = det['class']
            weight = self.profile.threat_weights.get(cls_name, 0.1)
            
            # Confidence weighted detection contribution
            score += (weight * 20.0) * det['confidence']
            
        # 3. Action Contributions
        for action_data in actions:
            action_name = action_data['action']
            weight = self.profile.threat_weights.get(action_name, 0.2)
            
            # Confidence weighted action contribution
            score += (weight * 30.0) * action_data['confidence']
            
        # Cap score at 100
        return min(max(score, 0.0), 100.0)
