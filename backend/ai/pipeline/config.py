from pydantic import BaseModel
from typing import Dict, List

class DetectionProfile(BaseModel):
    name: str
    target_classes: List[str]  # e.g., ['person', 'backpack', 'cell phone']
    motion_sensitivity: float   # 0.0 to 1.0
    loitering_threshold: int    # seconds
    threat_weights: Dict[str, float]  # Weight for each class/behavior

PROFILES = {
    "public": DetectionProfile(
        name="Public Space",
        target_classes=["person", "backpack", "suitcase", "cell phone"],
        motion_sensitivity=0.4,
        loitering_threshold=300,
        threat_weights={
            "person": 0.1,
            "backpack": 0.4,
            "suitacase": 0.4,
            "loitering": 0.5,
            "running": 0.7,
            "falling": 0.8
        }
    ),
    "classroom": DetectionProfile(
        name="Classroom",
        target_classes=["person", "cell phone", "laptop"],
        motion_sensitivity=0.3,
        loitering_threshold=600,
        threat_weights={
            "person": 0.05,
            "cell phone": 0.3,
            "loitering": 0.2,
            "running": 0.9,  # High threat in classroom
            "crowding": 0.6
        }
    ),
    "railway": DetectionProfile(
        name="Railway Station",
        target_classes=["person", "backpack", "suitcase", "bicycle"],
        motion_sensitivity=0.5,
        loitering_threshold=60,
        threat_weights={
            "person": 0.1,
            "suitcase": 0.6,  # Unattended luggage
            "loitering": 0.8,
            "falling": 1.0,   # High priority
            "running": 0.5
        }
    ),
    "traffic": DetectionProfile(
        name="Traffic Monitoring",
        target_classes=["car", "truck", "motorcycle", "person"],
        motion_sensitivity=0.6,
        loitering_threshold=30,
        threat_weights={
            "truck": 0.3,
            "person": 0.8,    # Person on road
            "stopped_vehicle": 0.9,
            "excessive_speed": 0.7
        }
    )
}

def get_profile(name: str = "public") -> DetectionProfile:
    return PROFILES.get(name.lower(), PROFILES["public"])
