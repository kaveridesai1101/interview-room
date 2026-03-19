class ThreatEngine:
    def __init__(self, profile):
        self.profile = profile
        self.weights = profile.get("threat_weights", {})

    def calculate_score(self, detections, actions, motion_intensity, proximity_score=0.0):
        """
        Refined Multi-Layer Threat Scoring:
        Priority 1: Weapons & Direct Violence
        Priority 2: Suspicious Objects & Crowd Patterns
        Priority 3: Motion & Proximity
        """
        # 1. Object Score (Weighted max for focus)
        obj_score = 0.0
        if detections:
            weighted_impacts = [det['confidence'] * self.weights.get(det['class'], 0.1) for det in detections]
            obj_score = max(weighted_impacts) if weighted_impacts else 0.0

        # 2. Action Score (Heuristic-based)
        act_score = 0.0
        if actions:
            # We treat 'weapon_threat' and 'fight' as multipliers
            weighted_acts = [act['confidence'] * self.weights.get(act['type'], 0.4) for act in actions]
            act_score = max(weighted_acts) if weighted_acts else 0.0

        # 3. Final Weighted Sum
        # If a weapon or fight is detected, we push the score higher
        base_score = (obj_score * 0.45) + (act_score * 0.45) + (motion_intensity * 0.1)
        
        # Scaling to 100
        final_score = base_score * 100.0
        
        # Cap and Floor
        return min(100.0, max(0.0, final_score))

    def get_severity(self, score):
        thresholds = self.profile.get("thresholds", {"critical": 80, "high": 60, "suspicious": 30})
        if score >= thresholds.get("critical", 80): return "Critical"
        if score >= thresholds.get("high", 60): return "High Risk"
        if score >= thresholds.get("suspicious", 30): return "Suspicious"
        return "Normal"
