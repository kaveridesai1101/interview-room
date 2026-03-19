from ultralytics import YOLO
import logging

logger = logging.getLogger(__name__)

class DetectionEngine:
    def __init__(self, model_path='yolov8n.pt'):
        try:
            self.model = YOLO(model_path)
            self.names = self.model.names
            logger.info(f"YOLOv8 model loaded: {model_path}")
        except Exception as e:
            logger.error(f"Failed to load YOLO model: {e}")
            self.model = None

    def detect(self, frame, target_classes: list = None):
        """
        Runs YOLOv8 detection and returns a list of dictionaries with results.
        Filters by target_classes if provided.
        """
        if self.model is None or frame is None:
            return []

        # Run inference (stream=True for better memory usage with many frames)
        results = self.model(frame, verbose=False)
        
        detections = []
        for r in results:
            boxes = r.boxes
            for box in boxes:
                cls_id = int(box.cls[0])
                cls_name = self.names[cls_id]
                
                # Check if class is in target list
                if target_classes and cls_name not in target_classes:
                    continue
                    
                conf = float(box.conf[0])
                bbox = box.xyxy[0].tolist()  # [x1, y1, x2, y2]
                
                detections.append({
                    "class": cls_name,
                    "confidence": conf,
                    "bbox": bbox
                })
                
        return detections
