from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from datetime import datetime, timezone
from ..database import Base

class Incident(Base):
    __tablename__ = "incidents"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    camera_id = Column(String)
    type = Column(String)
    severity = Column(String)
    description = Column(Text)
    ai_summary = Column(Text, nullable=True)
    confidence = Column(Float, default=0.0)
    owner_id = Column(String, default="admin")
    snapshot_path = Column(String, nullable=True)
    report_path = Column(String, nullable=True) # Path to the generated PDF report
    video_path = Column(String, nullable=True) # Path to the recorded video file
    video_offset = Column(Float, default=0.0) # Seconds into the video where incident occurred

class Camera(Base):
    __tablename__ = "cameras"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    location = Column(String)
    source_url = Column(String)
    owner_id = Column(String, default="admin")
    status = Column(String, default="active")

class VideoAnalysisHistory(Base):
    __tablename__ = "video_analysis_history"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)
    video_filename = Column(String)
    video_path = Column(String)
    report_path = Column(String, nullable=True)
    incident_count = Column(Integer, default=0)
    incident_types = Column(String, nullable=True) # Comma-separated list
    status = Column(String, default="Analyzing") # Analyzing, Completed, Error
    upload_time = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    analysis_time = Column(DateTime, nullable=True)

