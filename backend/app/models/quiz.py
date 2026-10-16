import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Integer, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.db.session import Base


class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    assessment_id = Column(String(36), ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False, default="")
    total_questions = Column(Integer, nullable=False, default=0)
    total_points = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    assessment = relationship("Assessment", back_populates="quizzes")
    user = relationship("User", back_populates="quizzes")
    questions = relationship("QuizQuestion", back_populates="quiz", cascade="all, delete-orphan", order_by="QuizQuestion.order_index")
    attempts = relationship("QuizAttempt", back_populates="quiz", cascade="all, delete-orphan", order_by="QuizAttempt.submitted_at.desc()")


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    quiz_id = Column(String(36), ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False, index=True)
    requirement_id = Column(String(50), nullable=False)
    skill_name = Column(String(255), nullable=False)
    question_type = Column(String(50), nullable=False)  # "mcq" | "written"
    difficulty = Column(String(50), nullable=False, default="medium")  # "easy" | "medium" | "hard"
    question_text = Column(Text, nullable=False)
    options_json = Column(Text, nullable=False, default="[]")  # JSON list for MCQ options
    correct_answer = Column(Text, nullable=False)  # Answer key (hidden from unsubmitted responses)
    scoring_rubric_json = Column(Text, nullable=False, default="{}")  # Rubric for written questions
    explanation = Column(Text, nullable=False, default="")
    points = Column(Integer, nullable=False, default=10)
    order_index = Column(Integer, nullable=False, default=0)

    quiz = relationship("Quiz", back_populates="questions")
    answers = relationship("QuizAttemptAnswer", back_populates="question", cascade="all, delete-orphan")


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    quiz_id = Column(String(36), ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False, index=True)
    assessment_id = Column(String(36), ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    total_score = Column(Float, nullable=False, default=0.0)
    max_score = Column(Float, nullable=False, default=0.0)
    percentage = Column(Float, nullable=False, default=0.0)
    passed = Column(Boolean, nullable=False, default=False)
    mcq_score = Column(Float, nullable=False, default=0.0)
    written_score = Column(Float, nullable=False, default=0.0)
    feedback_summary = Column(Text, nullable=False, default="")
    skill_observations_json = Column(Text, nullable=False, default="[]")
    submitted_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    quiz = relationship("Quiz", back_populates="attempts")
    user = relationship("User")
    assessment = relationship("Assessment")
    answers = relationship("QuizAttemptAnswer", back_populates="attempt", cascade="all, delete-orphan")


class QuizAttemptAnswer(Base):
    __tablename__ = "quiz_attempt_answers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    attempt_id = Column(String(36), ForeignKey("quiz_attempts.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(String(36), ForeignKey("quiz_questions.id", ondelete="CASCADE"), nullable=False, index=True)
    
    user_answer = Column(Text, nullable=False)
    is_correct = Column(Boolean, nullable=True)  # True/False for MCQ, None or score-based for written
    score_awarded = Column(Float, nullable=False, default=0.0)
    max_points = Column(Float, nullable=False, default=10.0)
    evaluation_feedback = Column(Text, nullable=False, default="")
    rubric_breakdown_json = Column(Text, nullable=False, default="{}")

    attempt = relationship("QuizAttempt", back_populates="answers")
    question = relationship("QuizQuestion", back_populates="answers")
