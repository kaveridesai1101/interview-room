from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# --- Question Schemas ---
class QuestionCreate(BaseModel):
    text: str
    category: str
    difficulty: str = "Medium"

class QuestionOut(BaseModel):
    id: int
    text: str
    category: str
    difficulty: str
    created_at: datetime

    class Config:
        from_attributes = True


# --- Session Schemas ---
class SessionCreate(BaseModel):
    interview_type: str
    recruiter_id: Optional[int] = None

class SessionUpdate(BaseModel):
    technical_score: Optional[float] = None
    confidence_score: Optional[float] = None
    communication_score: Optional[float] = None
    overall_score: Optional[float] = None
    level: Optional[str] = None
    transcript: Optional[str] = None
    ai_feedback: Optional[str] = None
    recommendation: Optional[str] = None
    duration_minutes: Optional[int] = None
    intro_text: Optional[str] = None

class SessionOut(BaseModel):
    id: int
    student_id: int
    recruiter_id: Optional[int]
    interview_type: str
    mode: str
    status: str
    overall_score: float
    level: Optional[str]
    copy_detected: bool
    recommendation: Optional[str]
    scheduled_at: Optional[datetime]
    meeting_link: Optional[str]
    created_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


# --- Q&A Schemas ---
class AnswerSubmit(BaseModel):
    question_text: str
    answer_text: str
    question_id: Optional[int] = None
    order_index: int = 0

class AnswerOut(BaseModel):
    id: int
    question_text: str
    answer_text: Optional[str]
    ai_score: float
    order_index: int

    class Config:
        from_attributes = True


# --- Emotion Log Schemas ---
class EmotionLogCreate(BaseModel):
    emotion: str
    confidence: float
    timestamp_seconds: float

class EmotionLogOut(BaseModel):
    emotion: str
    confidence: float
    timestamp_seconds: float

    class Config:
        from_attributes = True


# --- Eye Contact Schemas ---
class EyeContactLogCreate(BaseModel):
    is_present: bool
    timestamp_seconds: float


# --- Copy Detection Schemas ---
class CopyEventCreate(BaseModel):
    event_type: str
    description: Optional[str] = None
    timestamp_seconds: float

class CopyEventOut(BaseModel):
    event_type: str
    description: Optional[str]
    timestamp_seconds: float

    class Config:
        from_attributes = True


# --- Full Report Schema (Recruiter view) ---
class CandidateInfo(BaseModel):
    name: Optional[str]
    email: str
    education: Optional[str]
    experience: Optional[str]
    domain: Optional[str]

class SessionInfo(BaseModel):
    date: str
    time: str
    duration_minutes: int
    interview_type: str
    mode: str

class ScoreInfo(BaseModel):
    technical_score: float
    confidence_score: float
    communication_score: float
    overall_score: float
    level: Optional[str]

class FullReportOut(BaseModel):
    candidate: CandidateInfo
    session: SessionInfo
    intro_given: Optional[str]
    questions_and_answers: List[AnswerOut]
    scores: ScoreInfo
    emotion_timeline: List[EmotionLogOut]
    eye_contact_percent: float
    copy_detection: dict
    ai_feedback: Optional[str]
    recommendation: Optional[str]


# --- Invite / Join Schemas ---
class InviteRequest(BaseModel):
    student_email: str
    interview_type: str
    message: Optional[str] = None

class MeetingSchedule(BaseModel):
    student_id: int
    interview_type: str
    scheduled_at: datetime
    room_name: Optional[str] = None
