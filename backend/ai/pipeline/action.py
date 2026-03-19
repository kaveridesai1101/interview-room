import numpy as np

class ActionRecognizer:
    def __init__(self):
        # Stores previous box centers to calculate velocity
        # {track_id: (center_x, center_y, timestamp)}
        self.tracking_data = {}

    def recognize(self, current_detections: list, timestamp: float) -> list:
        """
        Analyzes movement patterns to recognize actions like 'running' or 'falling'.
        Note: This is a lightweight temporal analysis rather than a complex 3D-CNN.
        """
        actions = []
        
        for det in current_detections:
            if det['class'] != 'person':
                continue
                
            # Use bbox as a unique key for tracking (in a real system, use SORT/ByteTrack)
            track_id = hash(tuple(det['bbox']))
            
            x1, y1, x2, y2 = det['bbox']
            center_x = (x1 + x2) / 2
            center_y = (y1 + y2) / 2
            box_height = y2 - y1
            
            if track_id in self.tracking_data:
                prev_x, prev_y, prev_time = self.tracking_data[track_id]
                dt = timestamp - prev_time
                
                if dt > 0:
                    # Calculate velocity in pixels per second
                    velocity = ((center_x - prev_x)**2 + (center_y - prev_y)**2)**0.5 / dt
                    
                    # Normalize velocity by box height (to be scale invariant)
                    norm_velocity = velocity / box_height if box_height > 0 else 0
                    
                    # Action Logic
                    if norm_velocity > 4.0:  # Rapid movement detected
                        actions.append({"track_id": track_id, "action": "running", "confidence": min(norm_velocity / 10.0, 1.0)})
                    elif norm_velocity > 1.5:
                        actions.append({"track_id": track_id, "action": "walking", "confidence": 0.5})
                        
                    # detect falling by change in box aspect ratio (rough heuristic)
                    aspect_ratio = (x2 - x1) / (y2 - y1) if (y2 - y1) > 0 else 1
                    if aspect_ratio > 1.5: # Person is wider than tall
                        actions.append({"track_id": track_id, "action": "falling", "confidence": 0.8})

            # Update tracking data
            self.tracking_data[track_id] = (center_x, center_y, timestamp)
            
        # Cleanup old tracking data (not shown for brevity, but needed in production)
        return actions
