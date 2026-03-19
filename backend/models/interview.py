from sqlalchemy import Column, Integer, String, DateTime, Float, Boolean, Text, ForeignKey
from datetime import datetime
from ..database import Base

class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    text = Column(Text, nullable=False)
    category = Column(String, nullable=False)    # general / technical / hr / behavioral / custom
    difficulty = Column(String, default="Medium") # Easy / Medium / Hard
    created_at = Column(DateTime, default=datetime.utcnow)


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    recruiter_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # nullable = AI mode
    
    interview_type = Column(String, nullable=False)   # general / technical / hr / behavioral / custom
    mode = Column(String, default="ai")               # "ai" or "live"
    status = Column(String, default="pending")        # pending / active / completed
    
    # Candidate intro (collected at start)
    intro_text = Column(Text, nullable=True)
    
    # Scores (0-100)
    technical_score = Column(Float, default=0)
    confidence_score = Column(Float, default=0)
    communication_score = Column(Float, default=0)
    overall_score = Column(Float, default=0)
    level = Column(String, nullable=True)             # Beginner / Intermediate / Professional
    
    # AI-generated outputs
    transcript = Column(Text, nullable=True)          # JSON string of full Q&A
    ai_feedback = Column(Text, nullable=True)         # AI narrative feedback
    recommendation = Column(String, nullable=True)   # Shortlist / Reject / On Hold

    # Copy Detection
    copy_detected = Column(Boolean, default=False)
    
    # Timing
    duration_minutes = Column(Integer, default=0)
    scheduled_at = Column(DateTime, nullable=True)   # For live Jitsi meetings
    meeting_link = Column(String, nullable=True)    # Jitsi room link or name
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)


class QuestionAnswer(Base):
    __tablename__ = "question_answers"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=True)
    question_text = Column(Text, nullable=False)     # stored directly in case question is deleted
    answer_text = Column(Text, nullable=True)
    ai_score = Column(Float, default=0)              # 0-10 score for this answer
    order_index = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)


class EmotionLog(Base):
    __tablename__ = "emotion_logs"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id"), nullable=False)
    emotion = Column(String, nullable=False)         # happy / neutral / nervous / confused / angry
    confidence = Column(Float, default=0)
    timestamp_seconds = Column(Float, default=0)     # seconds from session start


class EyeContactLog(Base):
    __tablename__ = "eye_contact_logs"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id"), nullable=False)
    is_present = Column(Boolean, default=True)
    timestamp_seconds = Column(Float, default=0)


class CopyDetectionEvent(Base):
    __tablename__ = "copy_detection_events"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id"), nullable=False)
    event_type = Column(String, nullable=False)      # tab_switch / window_blur / multiple_faces / frequent_lookaway
    description = Column(String, nullable=True)
    timestamp_seconds = Column(Float, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
