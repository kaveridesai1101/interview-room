from collections import deque
import numpy as np

class TemporalBuffer:
    def __init__(self, size=10):
        self.buffer = deque(maxlen=size)
        
    def add(self, frame_metadata: dict):
        """
        Adds metadata for a single frame.
        frame_metadata = {
            "timestamp": float,
            "detections": list,
            "motion": bool,
            "threat_score": float
        }
        """
        self.buffer.append(frame_metadata)

    def get_history(self):
        return list(self.buffer)

    def is_full(self):
        return len(self.buffer) == self.buffer.maxlen

    def get_smoothed_score(self):
        if not self.buffer:
            return 0.0
        scores = [f["threat_score"] for f in self.buffer]
        return np.mean(scores)

    def detect_sudden_change(self, threshold=0.3):
        """
        Detects significant jumps in threat score within the buffer.
        """
        if len(self.buffer) < 2:
            return False
            
        latest = self.buffer[-1]["threat_score"]
        previous = self.buffer[-2]["threat_score"]
        
        return abs(latest - previous) > threshold
