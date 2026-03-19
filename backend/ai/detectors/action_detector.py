import time
import numpy as np

class ActionDetector:
    def __init__(self):
        # We track person and object states to detect temporal changes
        self.person_histories = {} 
        self.object_states = {}   # id -> {"first_seen": float, "last_seen": float}
        self.frame_count = 0
        
    def detect_actions(self, tracks, detections, pose_results=None):
        """
        Enhanced Action Recognition:
        - Violence, Fall, Theft, Suspicious Objects, Crowd Aggression
        """
        self.frame_count += 1
        actions = []
        people = [d for d in detections if d['class'] == 'person']
        security_objects = [d for d in detections if d['class'] in ['backpack', 'suitcase', 'handbag', 'laptop']]
        weapons = [d for d in detections if d['class'] in ['knife', 'pistol', 'weapon']]

        # 1. Weapon Threat (Immediate Priority)
        for w in weapons:
            for p in people:
                if self._check_overlap(p['bbox'], w['bbox'], threshold=0.1):
                    actions.append({
                        "type": "weapon_threat",
                        "confidence": w['confidence'],
                        "description": f"Subject observed with a {w['class']} in immediate proximity."
                    })

        # 2. Fall Detection (Pose-Primary)
        if pose_results:
            for pose in pose_results:
                keypoints = pose.keypoints.data[0] 
                if keypoints.shape[0] < 17: continue
                try:
                    head_y = keypoints[0][1]
                    hip_y = (keypoints[11][1] + keypoints[12][1]) / 2
                    ankle_y = (keypoints[15][1] + keypoints[16][1]) / 2
                    body_height = ankle_y - head_y
                    if body_height < 60 and body_height > 0:
                        actions.append({
                            "type": "fall",
                            "confidence": 0.9,
                            "description": "Pose analysis indicates subject has collapsed or fallen."
                        })
                except: pass

        # 3. Suspicious Object Detection (Persistence)
        current_time = time.time()
        for obj in security_objects:
            obj_id = f"{obj['class']}_{round(obj['bbox'][0])}_{round(obj['bbox'][1])}"
            if obj_id not in self.object_states:
                self.object_states[obj_id] = {"first_seen": current_time, "last_seen": current_time}
            else:
                self.object_states[obj_id]["last_seen"] = current_time
                
            no_owner_nearby = all(self._get_dist(p['bbox'], obj['bbox']) > 150 for p in people)
            if no_owner_nearby and (current_time - self.object_states[obj_id]["first_seen"] > 8.0):
                actions.append({
                    "type": "suspicious_object",
                    "confidence": 0.75,
                    "description": f"Unattended {obj['class']} detected in public zone for prolonged period."
                })

        # 4. Fight / Crowd Aggression
        if len(people) >= 2:
            proximity_count = 0
            for i in range(len(people)):
                for j in range(i + 1, len(people)):
                    p1, p2 = people[i]['bbox'], people[j]['bbox']
                    dist = self._get_dist(p1, p2)
                    if dist < 120:
                        proximity_count += 1
                        if self._check_overlap(p1, p2, threshold=0.2):
                            actions.append({
                                "type": "fight",
                                "confidence": 0.85,
                                "description": "Aggressive physical interaction or conflict between individuals."
                            })
            
            if proximity_count >= 3 and len(people) >= 4:
                actions.append({
                    "type": "crowd_aggression",
                    "confidence": 0.8,
                    "description": "High-density irregular movement suggests crowd disturbance or panic."
                })

        # 5. Interview Violation Detection
        # A. Multiple Persons Detection
        if len(people) > 1:
            actions.append({
                "type": "multiple_persons",
                "confidence": 1.0,
                "description": f"Multiple persons ({len(people)}) detected in the interview room. Risk of third-party assistance."
            })

        # B. Phone Detection (Enhanced checking)
        phones = [d for d in detections if d['class'] == 'cell phone']
        for phone in phones:
            actions.append({
                "type": "phone_violation",
                "confidence": phone['confidence'],
                "description": "Mobile device detected in the candidate's view. Cheating risk."
            })

        # C. Unauthorized Objects
        unauthorized = [d for d in detections if d['class'] in ['book', 'laptop'] and d['confidence'] > 0.5]
        if unauthorized:
            actions.append({
                "type": "unauthorized_object",
                "confidence": 0.6,
                "description": f"Unauthorized device or material ({unauthorized[0]['class']}) detected."
            })

        # D. Advanced Interview Proctoring (Pose-based)
        if pose_results:
            for pose in pose_results:
                keypoints = pose.keypoints.data[0] # [17, 3] (x, y, conf)
                if keypoints.shape[0] < 17: continue
                
                # Gaze Distraction Detection (Head turn)
                try:
                    left_eye, right_eye = keypoints[1], keypoints[2]
                    left_ear, right_ear = keypoints[3], keypoints[4]
                    
                    # If eyes/ears have low confidence or are skewed, it's a head turn
                    eye_conf = (left_eye[2] + right_eye[2]) / 2
                    ear_conf = (left_ear[2] + right_ear[2]) / 2
                    
                    # Simple heuristic: If one eye is hidden but both ears are visible, head is turned
                    if (left_eye[2] < 0.3 or right_eye[2] < 0.3) and ear_conf > 0.5:
                        actions.append({
                            "type": "gaze_distraction",
                            "confidence": 0.7,
                            "description": "Candidate is looking away from the screen for a prolonged period."
                        })
                except: pass

                # Suspicious Gesture (Hand near Mouth/Face)
                try:
                    left_wrist, right_wrist = keypoints[9], keypoints[10]
                    nose = keypoints[0]
                    
                    # Check distance from wrists to nose (mouth area)
                    dist_l = np.sqrt((left_wrist[0]-nose[0])**2 + (left_wrist[1]-nose[1])**2)
                    dist_r = np.sqrt((right_wrist[0]-nose[0])**2 + (right_wrist[1]-nose[1])**2)
                    
                    if (dist_l < 50 and left_wrist[2] > 0.5) or (dist_r < 50 and right_wrist[2] > 0.5):
                        actions.append({
                            "type": "suspicious_gesture",
                            "confidence": 0.8,
                            "description": "Hand detected near face. Possible covert communication or whispering."
                        })
                except: pass


        if self.frame_count % 100 == 0:
            self.object_states = {k: v for k, v in self.object_states.items() if (current_time - v["last_seen"]) < 2.0}

        return actions

    def _get_dist(self, b1, b2):
        c1 = [(b1[0]+b1[2])/2, (b1[1]+b1[3])/2]
        c2 = [(b2[0]+b2[2])/2, (b2[1]+b2[3])/2]
        return ((c1[0]-c2[0])**2 + (c1[1]-c2[1])**2)**0.5

    def _check_overlap(self, b1, b2, threshold=0.15):
        overlap_x = max(0, min(b1[2], b2[2]) - max(b1[0], b2[0]))
        overlap_y = max(0, min(b1[3], b2[3]) - max(b1[1], b2[1]))
        if overlap_x == 0 or overlap_y == 0: return False
        area_o = overlap_x * overlap_y
        area_b1 = (b1[2]-b1[0]) * (b1[3]-b1[1])
        return area_b1 > 0 and (area_o / area_b1) > threshold

