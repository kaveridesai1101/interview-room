import time
from collections import deque
import numpy as np

class TemporalBuffer:
    def __init__(self, size=5): # Reduced from 10 to 5
        self.buffer = deque(maxlen=size)
        self.last_update = time.time()

    def add(self, data):
        self.buffer.append(data)
        self.last_update = time.time()

    def check_stale(self, timeout=2.0, skip_stale=False):
        if not skip_stale and (time.time() - self.last_update > timeout):
            self.buffer.clear()

    def get_smoothed_score(self):
        if not self.buffer:
            return 0.0
        scores = [d["threat_score"] for d in self.buffer]
        return float(np.mean(scores))

    def get_majority_action(self):
        if not self.buffer:
            return None
        # Only count non-None actions
        actions = [d["action"] for d in self.buffer if d.get("action")]
        if not actions:
            return None
        # Require the top action to appear in at least 60% of frames
        # This prevents stale labels (like "fight") from lingering
        best = max(set(actions), key=actions.count)
        frequency = actions.count(best) / len(self.buffer)
        if frequency >= 0.6:
            return best
        return None

    def get_trigger_logic(self, threshold=0.7):
        """Majority voting trigger logic."""
        if len(self.buffer) < self.buffer.maxlen:
            return False
        anomalies = [1 if d["is_anomaly"] else 0 for d in self.buffer]
        return (sum(anomalies) / len(anomalies)) >= threshold
