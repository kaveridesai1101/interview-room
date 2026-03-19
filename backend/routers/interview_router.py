from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import List, Optional
import json
import uuid

from ..database import get_db
from ..models.interview import (
    InterviewSession, Question, QuestionAnswer,
    EmotionLog, EyeContactLog, CopyDetectionEvent
)
from ..models.user import User
from ..schemas.interview_schema import (
    SessionCreate, SessionOut, AnswerSubmit, AnswerOut,
    EmotionLogCreate, EyeContactLogCreate, CopyEventCreate,
    QuestionCreate, QuestionOut, InviteRequest, FullReportOut,
    MeetingSchedule
)
from ..services.interview_service import interview_service
from ..utils.jwt_handler import jwt_handler
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

router = APIRouter(prefix="/api/interview", tags=["interview"])
security = HTTPBearer()


# ── Auth helpers ────────────────────────────────────────────────────────────
def get_current_user(
    token: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    payload = jwt_handler.decode_token(token.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = db.query(User).filter(User.email == payload.get("sub")).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")
    return user

def require_recruiter(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in ("recruiter", "admin"):
        raise HTTPException(status_code=403, detail="Recruiter access required")
    return current_user

def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


# ======================== QUESTIONS ========================================

@router.get("/questions", response_model=List[QuestionOut])
async def get_questions(
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(Question)
    if category:
        q = q.filter(Question.category == category)
    return q.all()

@router.post("/questions", response_model=QuestionOut)
async def create_question(
    data: QuestionCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    q = Question(**data.model_dump())
    db.add(q)
    db.commit()
    db.refresh(q)
    return q

@router.put("/questions/{question_id}", response_model=QuestionOut)
async def update_question(
    question_id: int,
    data: QuestionCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    q.text = data.text
    q.category = data.category
    q.difficulty = data.difficulty
    db.commit()
    db.refresh(q)
    return q

@router.delete("/questions/{question_id}")
async def delete_question(
    question_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    db.delete(q)
    db.commit()
    return {"message": "Question deleted"}


# ======================== SESSIONS =========================================

@router.post("/sessions")
async def create_session(
    data: SessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Student or Recruiter creates an interview session."""
    if current_user.role == "student":
        student_id = current_user.id
    else:
        raise HTTPException(status_code=403, detail="Only students can create sessions")
    
    # Determine mode: ai if no recruiter_id provided
    mode = "live" if data.recruiter_id else "ai"

    session = InterviewSession(
        student_id=student_id,
        recruiter_id=data.recruiter_id,
        interview_type=data.interview_type,
        mode=mode,
        status="active"
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return {"id": session.id, "mode": session.mode, "type": session.interview_type}


@router.post("/sessions/schedule", response_model=SessionOut)
async def schedule_meeting(
    data: MeetingSchedule,
    db: Session = Depends(get_db),
    recruiter: User = Depends(require_recruiter)
):
    """Recruiter schedules a live Jitsi meeting with a student."""
    room_name = data.room_name or f"interview-{uuid.uuid4().hex[:8]}"
    
    session = InterviewSession(
        student_id=data.student_id,
        recruiter_id=recruiter.id,
        interview_type=data.interview_type,
        mode="live",
        status="pending",
        scheduled_at=data.scheduled_at,
        meeting_link=room_name
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.get("/sessions/{session_id}/meeting")
async def get_meeting_config(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns Jitsi meeting configuration for a session."""
    s = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if not s.meeting_link:
        raise HTTPException(status_code=400, detail="This session is not a scheduled meeting")

    # Only student, recruiter, or admin can access
    if current_user.role not in ("recruiter", "admin") and s.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    return {
        "room_name": s.meeting_link,
        "subject": f"{s.interview_type.capitalize()} Interview",
        "user_name": current_user.full_name or current_user.email,
        "is_moderator": current_user.role in ("recruiter", "admin")
    }

@router.get("/public/meeting/{session_id}")
async def get_public_meeting_config(
    session_id: int,
    db: Session = Depends(get_db)
):
    """Public endpoint for guest students to join a meeting without login."""
    s = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if not s.meeting_link:
        raise HTTPException(status_code=400, detail="Invalid session type")

    return {
        "room_name": s.meeting_link,
        "subject": f"{s.interview_type.capitalize()} Interview",
        "type": s.interview_type
    }


@router.get("/sessions/{session_id}/mode")
async def get_session_mode(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns mode: ai or live. Used by frontend to determine interview UI."""
    s = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"mode": s.mode, "recruiter_id": s.recruiter_id}


@router.get("/sessions", response_model=List[SessionOut])
async def list_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Students see their own. Recruiters see assigned ones. Admin sees all."""
    if current_user.role == "student":
        sessions = db.query(InterviewSession).filter(
            InterviewSession.student_id == current_user.id
        ).order_by(InterviewSession.created_at.desc()).all()
    elif current_user.role == "recruiter":
        sessions = db.query(InterviewSession).filter(
            InterviewSession.recruiter_id == current_user.id
        ).order_by(InterviewSession.created_at.desc()).all()
    else:  # admin
        sessions = db.query(InterviewSession).order_by(InterviewSession.created_at.desc()).all()
    return sessions


@router.post("/sessions/{session_id}/join")
async def recruiter_join_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_recruiter)
):
    """Recruiter joins or claims a session — marks as live mode."""
    s = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")
    s.recruiter_id = current_user.id
    s.mode = "live"
    db.commit()
    return {"message": "Joined session", "session_id": session_id}


@router.post("/sessions/{session_id}/answer")
async def submit_answer(
    session_id: int,
    data: AnswerSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Student submits an answer to a question during interview."""
    s = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")
    if s.student_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    qa = QuestionAnswer(
        session_id=session_id,
        question_id=data.question_id,
        question_text=data.question_text,
        answer_text=data.answer_text,
        order_index=data.order_index
    )
    db.add(qa)
    db.commit()
    db.refresh(qa)
    return {"id": qa.id, "message": "Answer recorded"}


@router.post("/sessions/{session_id}/emotion-log")
async def log_emotion(
    session_id: int,
    data: EmotionLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    log = EmotionLog(
        session_id=session_id,
        emotion=data.emotion,
        confidence=data.confidence,
        timestamp_seconds=data.timestamp_seconds
    )
    db.add(log)
    db.commit()
    return {"ok": True}


@router.post("/sessions/{session_id}/eye-contact-log")
async def log_eye_contact(
    session_id: int,
    data: EyeContactLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    log = EyeContactLog(
        session_id=session_id,
        is_present=data.is_present,
        timestamp_seconds=data.timestamp_seconds
    )
    db.add(log)
    db.commit()
    return {"ok": True}


@router.post("/sessions/{session_id}/copy-event")
async def log_copy_event(
    session_id: int,
    data: CopyEventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    event = CopyDetectionEvent(
        session_id=session_id,
        event_type=data.event_type,
        description=data.description,
        timestamp_seconds=data.timestamp_seconds
    )
    db.add(event)
    db.commit()
    return {"ok": True}


@router.put("/sessions/{session_id}/complete")
async def complete_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Student marks session done — triggers AI scoring & report generation."""
    s = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")
    if s.student_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    completed = interview_service.finalize_session(db, session_id)
    return {
        "message": "Interview completed successfully",
        "overall_score": completed.overall_score,
        "level": completed.level,
        "recommendation": completed.recommendation
    }


# ======================== FULL REPORT (Recruiter) ===========================

@router.get("/sessions/{session_id}/report")
async def get_session_report(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Full AI analysis report. Accessible by recruiter assigned, or admin."""
    s = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")
    if current_user.role not in ("recruiter", "admin") and s.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    student = db.query(User).filter(User.id == s.student_id).first()
    answers = db.query(QuestionAnswer).filter(QuestionAnswer.session_id == session_id).order_by(QuestionAnswer.order_index).all()
    emotion_logs = db.query(EmotionLog).filter(EmotionLog.session_id == session_id).all()
    eye_logs = db.query(EyeContactLog).filter(EyeContactLog.session_id == session_id).all()
    copy_events = db.query(CopyDetectionEvent).filter(CopyDetectionEvent.session_id == session_id).all()

    eye_percent = 0
    if eye_logs:
        eye_percent = round((sum(1 for e in eye_logs if e.is_present) / len(eye_logs)) * 100, 1)

    return {
        "candidate": {
            "name": student.full_name if student else "Unknown",
            "email": student.email if student else "",
            "education": student.education if student else "",
            "experience": student.experience if student else "",
            "domain": student.target_domain if student else ""
        },
        "session": {
            "date": s.created_at.strftime("%Y-%m-%d") if s.created_at else "",
            "time": s.created_at.strftime("%H:%M") if s.created_at else "",
            "duration_minutes": s.duration_minutes or 0,
            "interview_type": s.interview_type,
            "mode": s.mode
        },
        "intro_given": s.intro_text or "",
        "questions_and_answers": [
            {
                "question": a.question_text,
                "answer": a.answer_text or "",
                "ai_score": a.ai_score,
                "order": a.order_index
            } for a in answers
        ],
        "scores": {
            "technical_score": s.technical_score,
            "confidence_score": s.confidence_score,
            "communication_score": s.communication_score,
            "overall_score": s.overall_score,
            "level": s.level or "Beginner"
        },
        "emotion_timeline": [
            {"emotion": e.emotion, "confidence": e.confidence, "timestamp": e.timestamp_seconds}
            for e in emotion_logs
        ],
        "eye_contact_percent": eye_percent,
        "copy_detection": {
            "detected": s.copy_detected,
            "incidents": [
                {"type": c.event_type, "description": c.description, "timestamp": c.timestamp_seconds}
                for c in copy_events
            ]
        },
        "ai_feedback": s.ai_feedback or "",
        "recommendation": s.recommendation or "On Hold"
    }


# ======================== STATS (Admin) ====================================

@router.get("/stats")
async def get_interview_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Platform-wide interview stats (admin) or personal (others)."""
    if current_user.role == "admin":
        total_sessions = db.query(InterviewSession).count()
        total_students = db.query(User).filter(User.role == "student").count()
        total_recruiters = db.query(User).filter(User.role == "recruiter").count()
        completed = db.query(InterviewSession).filter(InterviewSession.status == "completed").all()
        avg_score = round(sum(s.overall_score for s in completed) / max(len(completed), 1), 1)
        copy_flagged = db.query(InterviewSession).filter(InterviewSession.copy_detected == True).count()
        return {
            "total_sessions": total_sessions,
            "total_students": total_students,
            "total_recruiters": total_recruiters,
            "avg_score": avg_score,
            "copy_flagged": copy_flagged,
            "completed": len(completed)
        }
    else:
        my_sessions = db.query(InterviewSession).filter(
            InterviewSession.student_id == current_user.id,
            InterviewSession.status == "completed"
        ).all()
        avg_score = round(sum(s.overall_score for s in my_sessions) / max(len(my_sessions), 1), 1)
        return {
            "my_sessions": len(my_sessions),
            "avg_score": avg_score,
            "best_level": max((s.level for s in my_sessions), default="N/A")
        }


# ======================== INVITE ===========================================

@router.post("/invite")
async def invite_student(
    data: InviteRequest,
    db: Session = Depends(get_db),
    recruiter: User = Depends(require_recruiter)
):
    """Recruiter invites a student by email for a specific interview type."""
    student = db.query(User).filter(User.email == data.student_email, User.role == "student").first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found with that email")

    # Pre-create a session assigned to this recruiter
    session = InterviewSession(
        student_id=student.id,
        recruiter_id=recruiter.id,
        interview_type=data.interview_type,
        mode="live",
        status="pending"
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return {
        "message": f"Invitation created for {student.email}",
        "session_id": session.id,
        "student_name": student.full_name
    }
