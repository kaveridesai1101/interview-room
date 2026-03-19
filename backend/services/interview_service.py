import json
import re
from datetime import datetime
from sqlalchemy.orm import Session
from ..models.interview import (
    InterviewSession, Question, QuestionAnswer,
    EmotionLog, EyeContactLog, CopyDetectionEvent
)
from ..models.user import User


class InterviewService:

    def seed_questions(self, db: Session):
        """Seed default questions if DB is empty."""
        if db.query(Question).count() > 0:
            return
        
        defaults = [
            # Technical
            {"text": "Explain the difference between REST and GraphQL.", "category": "technical", "difficulty": "Medium"},
            {"text": "What is Big O notation? Give an example.", "category": "technical", "difficulty": "Easy"},
            {"text": "How does a hash table work?", "category": "technical", "difficulty": "Medium"},
            {"text": "What is the difference between SQL and NoSQL databases?", "category": "technical", "difficulty": "Medium"},
            {"text": "Describe the SOLID principles with examples.", "category": "technical", "difficulty": "Hard"},
            {"text": "What is the difference between synchronous and asynchronous programming?", "category": "technical", "difficulty": "Medium"},
            {"text": "Explain how garbage collection works in Python.", "category": "technical", "difficulty": "Medium"},
            {"text": "What is Docker and when would you use it?", "category": "technical", "difficulty": "Easy"},

            # HR
            {"text": "Tell me about yourself.", "category": "hr", "difficulty": "Easy"},
            {"text": "What are your greatest strengths and weaknesses?", "category": "hr", "difficulty": "Easy"},
            {"text": "Where do you see yourself in 5 years?", "category": "hr", "difficulty": "Easy"},
            {"text": "Why do you want to work for our company?", "category": "hr", "difficulty": "Easy"},
            {"text": "Describe your ideal work environment.", "category": "hr", "difficulty": "Easy"},

            # Behavioral
            {"text": "Tell me about a time you handled a difficult team situation.", "category": "behavioral", "difficulty": "Medium"},
            {"text": "Describe a project where you had to meet tight deadlines.", "category": "behavioral", "difficulty": "Medium"},
            {"text": "How do you handle failure or setbacks?", "category": "behavioral", "difficulty": "Medium"},
            {"text": "Give an example of when you showed leadership.", "category": "behavioral", "difficulty": "Medium"},

            # General
            {"text": "What motivates you in your work?", "category": "general", "difficulty": "Easy"},
            {"text": "How do you prioritize tasks when you have multiple deadlines?", "category": "general", "difficulty": "Easy"},
            {"text": "How do you keep your technical skills up to date?", "category": "general", "difficulty": "Easy"},

            # Custom
            {"text": "Explain a personal project you're proud of.", "category": "custom", "difficulty": "Medium"},
            {"text": "What would you build if given a week of free time?", "category": "custom", "difficulty": "Easy"},
        ]

        for q in defaults:
            db.add(Question(**q))
        db.commit()
        print("INFO: Default interview questions seeded.")

    def score_answer(self, question_text: str, answer_text: str) -> float:
        """Simple AI scoring heuristic (words/structure based). 0-10."""
        if not answer_text or len(answer_text.strip()) < 10:
            return 0.0
        word_count = len(answer_text.split())
        score = min(10.0, word_count / 15)  # 150 words = 10/10 baseline

        # Bonus for structured answers (STAR method keywords)
        keywords = ["because", "example", "when", "result", "therefore", "however", "achieved", "implemented"]
        keyword_hits = sum(1 for k in keywords if k.lower() in answer_text.lower())
        score = min(10.0, score + keyword_hits * 0.5)
        return round(score, 1)

    def compute_ai_feedback(self, session: InterviewSession, answers: list, avg_emotion: str, eye_percent: float) -> str:
        """Generate text-based AI feedback from session data."""
        level_text = session.level or "unknown"
        score = session.overall_score or 0
        
        feedback = f"Candidate performed at a {level_text} level with an overall score of {score:.1f}%. "
        
        if session.confidence_score >= 70:
            feedback += "They demonstrated strong confidence throughout the session. "
        else:
            feedback += "Confidence could be improved — the candidate appeared hesitant at times. "

        if session.communication_score >= 75:
            feedback += "Communication was clear and articulate. "
        else:
            feedback += "Communication skills need development. "

        if eye_percent >= 70:
            feedback += "Eye contact was maintained well, suggesting engagement. "
        else:
            feedback += "Limited eye contact was observed; candidate may have been reading from notes. "

        answered = [a for a in answers if a.answer_text and len(a.answer_text) > 20]
        feedback += f"{len(answered)}/{len(answers)} questions were answered substantively. "

        if session.copy_detected:
            feedback += "⚠️ Copy detection incidents were flagged during this session — please review the copy report."

        return feedback

    def compute_recommendation(self, overall_score: float, copy_detected: bool) -> str:
        if copy_detected:
            return "On Hold"
        if overall_score >= 70:
            return "Shortlist"
        elif overall_score >= 45:
            return "On Hold"
        else:
            return "Reject"

    def compute_level(self, score: float) -> str:
        if score >= 71:
            return "Professional"
        elif score >= 41:
            return "Intermediate"
        else:
            return "Beginner"

    def finalize_session(self, db: Session, session_id: int) -> InterviewSession:
        session = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
        if not session:
            return None

        answers = db.query(QuestionAnswer).filter(QuestionAnswer.session_id == session_id).all()
        emotion_logs = db.query(EmotionLog).filter(EmotionLog.session_id == session_id).all()
        eye_logs = db.query(EyeContactLog).filter(EyeContactLog.session_id == session_id).all()

        # Score individual answers and compute avg
        for ans in answers:
            ans.ai_score = self.score_answer(ans.question_text, ans.answer_text or "")

        # Technical score = avg Q&A score * 10
        if answers:
            avg_qa = sum(a.ai_score for a in answers) / len(answers)
            session.technical_score = round(avg_qa * 10, 1)
        else:
            session.technical_score = 0

        # Confidence score from emotion logs
        if emotion_logs:
            confident_emotions = ["happy", "neutral"]
            confidence_count = sum(1 for e in emotion_logs if e.emotion.lower() in confident_emotions)
            session.confidence_score = round((confidence_count / len(emotion_logs)) * 100, 1)
        
        # Communication score: answer length + structure
        if answers:
            avg_words = sum(len((a.answer_text or "").split()) for a in answers) / max(len(answers), 1)
            session.communication_score = min(100, round(avg_words / 1.5, 1))

        # Overall
        session.overall_score = round(
            (session.technical_score * 0.5 + session.confidence_score * 0.3 + session.communication_score * 0.2),
            1
        )
        session.level = self.compute_level(session.overall_score)

        # Eye contact percent
        eye_percent = 0
        if eye_logs:
            eye_percent = round((sum(1 for e in eye_logs if e.is_present) / len(eye_logs)) * 100, 1)

        # Avg dominant emotion
        avg_emotion = "neutral"
        if emotion_logs:
            from collections import Counter
            emotion_counter = Counter(e.emotion for e in emotion_logs)
            avg_emotion = emotion_counter.most_common(1)[0][0]

        # Copy detection
        copy_events = db.query(CopyDetectionEvent).filter(CopyDetectionEvent.session_id == session_id).all()
        session.copy_detected = len(copy_events) > 0

        # AI Feedback text
        session.ai_feedback = self.compute_ai_feedback(session, answers, avg_emotion, eye_percent)
        session.recommendation = self.compute_recommendation(session.overall_score, session.copy_detected)
        session.status = "completed"
        session.completed_at = datetime.utcnow()

        # Compute duration
        if session.created_at:
            delta = datetime.utcnow() - session.created_at
            session.duration_minutes = int(delta.total_seconds() / 60)

        # Build transcript JSON
        transcript_data = [
            {
                "q": a.question_text,
                "a": a.answer_text or "",
                "score": a.ai_score,
                "idx": a.order_index
            }
            for a in sorted(answers, key=lambda x: x.order_index)
        ]
        session.transcript = json.dumps(transcript_data)

        db.commit()
        db.refresh(session)
        return session


interview_service = InterviewService()
