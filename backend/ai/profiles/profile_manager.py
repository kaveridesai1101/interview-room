import json
import os
import logging

logger = logging.getLogger(__name__)

class ProfileManager:
    def __init__(self, config_path=None):
        if config_path is None:
            config_path = os.path.join(os.path.dirname(__file__), "config.json")
            
        self.config_path = config_path
        self.profiles = {}
        self.load_profiles()

    def load_profiles(self):
        try:
            with open(self.config_path, 'r') as f:
                data = json.load(f)
                self.profiles = data.get("profiles", {})
            logger.info(f"Loaded {len(self.profiles)} AI detection profiles.")
        except Exception as e:
            logger.error(f"Failed to load AI profiles: {e}")
            # Fallback to empty public profile
            self.profiles = {"public": {"name": "Default Public", "target_classes": ["person"], "threat_weights": {}, "thresholds": {"critical": 80, "high": 60, "suspicious": 30}}}

    def get_profile(self, profile_name):
        return self.profiles.get(profile_name, self.profiles.get("public"))

    def list_profiles(self):
        return list(self.profiles.keys())
