from ultralytics import YOLO
import logging

logger = logging.getLogger(__name__)

class YOLODetector:
    def __init__(self, model_configs=None):
        """
        model_configs: List of dicts e.g. [{"path": "yolov8n.pt", "type": "primary"}]
        """
        self.models = {}
        configs = model_configs or [{"path": "yolov8n.pt", "type": "primary"}]
        
        for cfg in configs:
            try:
                m_type = cfg.get("type", "primary")
                path = cfg.get("path", "yolov8n.pt")
                self.models[m_type] = YOLO(path)
                logger.info(f"YOLOv8 ({m_type}) initialized with {path}")
            except Exception as e:
                logger.error(f"Failed to load YOLO {cfg}: {e}")

    def detect(self, frame, target_classes=None):
        if not self.models or frame is None:
            return [], None
            
        all_detections = []
        pose_results = None
        
        for m_type, model in self.models.items():
            results = model(frame, verbose=False)[0]
            
            # Specialized: If it's a pose model, store keypoints
            if m_type == "pose":
                pose_results = results
            
            for box in results.boxes:
                cls_id = int(box.cls[0])
                cls_name = model.names[cls_id]
                
                if target_classes and cls_name not in target_classes:
                    continue
                    
                conf = float(box.conf[0])
                bbox = box.xyxy[0].tolist()
                
                # --- DUPLICATE FILTERING (Cross-Model NMS) ---
                is_duplicate = False
                for existing in all_detections:
                    if existing['class'] == cls_name:
                        # Simple IoU-like check for high overlap
                        eb = existing['bbox']
                        overlap_x = max(0, min(bbox[2], eb[2]) - max(bbox[0], eb[0]))
                        overlap_y = max(0, min(bbox[3], eb[3]) - max(bbox[1], eb[1]))
                        if overlap_x > 0 and overlap_y > 0:
                            area_overlap = overlap_x * overlap_y
                            area_new = (bbox[2]-bbox[0]) * (bbox[3]-bbox[1])
                            if area_new > 0 and area_overlap / area_new > 0.8: # 80%+ overlap
                                is_duplicate = True
                                if conf > existing['confidence']:
                                    existing['confidence'] = conf
                                    existing['bbox'] = bbox
                                break
                                
                if not is_duplicate:
                    all_detections.append({
                        "class": cls_name,
                        "confidence": conf,
                        "bbox": bbox,
                        "model_source": m_type
                    })
                
        return all_detections, pose_results
