from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


class QuestionOptionItem(BaseModel):
    key: str  # "A", "B", "C", "D"
    text: str


class QuizQuestionClientResponse(BaseModel):
    id: str
    requirement_id: str
    skill_name: str
    question_type: str  # "mcq" | "written"
    difficulty: str
    question_text: str
    options: List[QuestionOptionItem] = []  # Empty for written
    points: int
    order_index: int


class QuizClientResponse(BaseModel):
    id: str
    assessment_id: str
    title: str
    description: str
    total_questions: int
    total_points: int
    created_at: datetime
    questions: List[QuizQuestionClientResponse]


class QuestionAnswerSubmission(BaseModel):
    question_id: str
    answer_text: str  # Option key e.g. "A" for MCQ, or typed text for written


class QuizSubmitRequest(BaseModel):
    quiz_id: str
    answers: List[QuestionAnswerSubmission]


class QuestionResultResponse(BaseModel):
    question_id: str
    requirement_id: str
    skill_name: str
    question_type: str
    question_text: str
    user_answer: str
    correct_answer: Optional[str] = None  # Revealed after submission
    is_correct: Optional[bool] = None
    score_awarded: float
    max_points: float
    explanation: str
    evaluation_feedback: str
    rubric_breakdown: Dict[str, Any] = {}


class QuizAttemptResultResponse(BaseModel):
    id: str
    quiz_id: str
    assessment_id: str
    total_score: float
    max_score: float
    percentage: float
    passed: bool
    mcq_score: float
    written_score: float
    feedback_summary: str
    skill_observations: List[Dict[str, Any]] = []
    submitted_at: datetime
    answers: List[QuestionResultResponse]
    recommended_next_steps: List[str] = []
