import cv2
import numpy as np

class MotionDetector:
    def __init__(self, sensitivity=0.4):
        self.sensitivity = sensitivity
        self.fgbg = cv2.createBackgroundSubtractorMOG2(history=500, varThreshold=25, detectShadows=True)
        self.kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))

    def detect(self, frame) -> bool:
        """
        Returns True if significant motion is detected.
        """
        if frame is None:
            return False

        # Apply Background Subtraction
        fgmask = self.fgbg.apply(frame)
        
        # Noise reduction
        fgmask = cv2.morphologyEx(fgmask, cv2.MORPH_OPEN, self.kernel)
        
        # Calculate motion percentage
        non_zero_pixels = cv2.countNonZero(fgmask)
        total_pixels = frame.shape[0] * frame.shape[1]
        motion_ratio = non_zero_pixels / total_pixels
        
        # Highly sensitive to smaller non-zero pixel counts relative to total area
        return motion_ratio > (1.0 - self.sensitivity) * 0.05
