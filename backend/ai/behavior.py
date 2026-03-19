import time
from collections import defaultdict

class BehaviorAnalyzer:
    def __init__(self):
        # Track person movement: {track_id: [(timestamp, x, y), ...]}
        self.tracks = defaultdict(list)
        self.loitering_threshold = 60  # seconds (was 10)
        self.movement_threshold = 80   # pixels (was 50)
        
    def analyze(self, detections, timestamp):
        """Analyzes detections to identify suspicious behaviors."""
        incidents = []
        current_ids = set()
        
        for det in detections:
            if det['class'] == 'person':
                # Simplified tracking (real system would use ByteTrack ID)
                # Here we use a dummy ID for demonstration
                track_id = hash(tuple(det['bbox'])) 
                current_ids.add(track_id)
                
                center_x = (det['bbox'][0] + det['bbox'][2]) / 2
                center_y = (det['bbox'][1] + det['bbox'][3]) / 2
                
                self.tracks[track_id].append((timestamp, center_x, center_y))
                
                # Analyze Loitering
                if self._is_loitering(track_id):
                    incidents.append({
                        "type": "Loitering",
                        "severity": "Medium",
                        "description": f"Person (ID: {track_id}) detected in zone for over {self.loitering_threshold}s."
                    })
                    
        # Analyze Aggressive Movement (placeholder logic)
        # In a real system, we'd check velocity and sudden changes in trajectory or proximity between persons
        
        # Cleanup old tracks
        self._cleanup_tracks(current_ids)
        
        return incidents

    def _is_loitering(self, track_id):
        track = self.tracks[track_id]
        if len(track) < 2:
            return False
            
        duration = track[-1][0] - track[0][0]
        if duration > self.loitering_threshold:
            # Check if person moved significantly
            start_pos = (track[0][1], track[0][2])
            end_pos = (track[-1][1], track[-1][2])
            dist = ((start_pos[0] - end_pos[0])**2 + (start_pos[1] - end_pos[1])**2)**0.5
            
            if dist < self.movement_threshold:
                return True
        return False

    def _cleanup_tracks(self, current_ids):
        # Remove tracks not present in current frame
        keys_to_remove = [k for k in self.tracks if k not in current_ids]
        for k in keys_to_remove:
            del self.tracks[k]

behavior_analyzer = BehaviorAnalyzer()
