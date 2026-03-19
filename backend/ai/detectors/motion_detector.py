import cv2
import numpy as np

class MotionDetector:
    def __init__(self, history=500, threshold=25):
        self.fgbg = cv2.createBackgroundSubtractorMOG2(history=history, varThreshold=threshold, detectShadows=True)
        self.kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))

    def get_motion_intensity(self, frame):
        """Returns a normalized motion score (0.0 to 1.0)."""
        if frame is None:
            return 0.0
            
        fgmask = self.fgbg.apply(frame)
        fgmask = cv2.morphologyEx(fgmask, cv2.MORPH_OPEN, self.kernel)
        
        non_zero = cv2.countNonZero(fgmask)
        total = frame.shape[0] * frame.shape[1]
        
        intensity = non_zero / total
        # Normalize to be more sensitive (0.05 occupancy = 1.0 intensity)
        return min(1.0, intensity * 20.0)
