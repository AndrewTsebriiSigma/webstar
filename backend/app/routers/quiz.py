"""Quiz router."""
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from pydantic import BaseModel

from app.db.base import get_session
from app.db.models import User, Quiz, QuizQuestion, QuizAnswer, QuizResult
from app.deps.auth import get_current_user_optional

router = APIRouter()


class QuizQuestionResponse(BaseModel):
    """Quiz question response."""
    id: int
    question_text: str
    question_order: int
    answers: List[dict]


class QuizResponse(BaseModel):
    """Quiz response."""
    id: int
    title: str
    description: Optional[str]
    questions: List[QuizQuestionResponse]


class SubmitQuizRequest(BaseModel):
    """Submit quiz answers."""
    quiz_id: int
    answers: List[dict]  # [{"question_id": 1, "answer_id": 3}, ...]
    session_id: Optional[str] = None  # For anonymous users


class QuizResultResponse(BaseModel):
    """Quiz result response."""
    id: int
    quiz_id: int
    quiz_title: str
    total_score: int
    result_summary: Optional[str]
    created_at: str


# IMPORTANT: More specific routes must come BEFORE parameterized routes
# to avoid route conflicts (e.g., /quizzes/results before /quizzes/{slug})

@router.get("/quizzes/results", response_model=List[QuizResultResponse])
async def get_user_quiz_results(
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Get all quiz results for current user."""
    if not current_user:
        return []
    
    results = session.exec(
        select(QuizResult)
        .where(QuizResult.user_id == current_user.id)
        .order_by(QuizResult.created_at.desc())
    ).all()
    
    # Get quiz titles
    response_list = []
    for result in results:
        quiz = session.exec(select(Quiz).where(Quiz.id == result.quiz_id)).first()
        response_list.append(QuizResultResponse(
            id=result.id,
            quiz_id=result.quiz_id,
            quiz_title=quiz.title if quiz else "Unknown Quiz",
            total_score=result.total_score,
            result_summary=result.result_summary,
            created_at=result.created_at.isoformat()
        ))
    
    return response_list


@router.get("/quizzes/{slug}", response_model=QuizResponse)
async def get_quiz(
    slug: str,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Get quiz by slug with all questions and answers."""
    quiz = session.exec(select(Quiz).where(Quiz.slug == slug)).first()
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found"
        )
    
    # Get all questions for this quiz
    questions = session.exec(
        select(QuizQuestion)
        .where(QuizQuestion.quiz_id == quiz.id)
        .order_by(QuizQuestion.question_order)
    ).all()
    
    # Get answers for each question
    question_responses = []
    for question in questions:
        answers = session.exec(
            select(QuizAnswer)
            .where(QuizAnswer.question_id == question.id)
            .order_by(QuizAnswer.answer_order)
        ).all()
        
        question_responses.append(QuizQuestionResponse(
            id=question.id,
            question_text=question.question_text,
            question_order=question.question_order,
            answers=[
                {
                    "id": ans.id,
                    "answer_text": ans.answer_text,
                    "answer_order": ans.answer_order,
                    "score_value": ans.score_value
                }
                for ans in answers
            ]
        ))
    
    return QuizResponse(
        id=quiz.id,
        title=quiz.title,
        description=quiz.description,
        questions=question_responses
    )


@router.post("/quizzes/submit")
async def submit_quiz(
    data: SubmitQuizRequest,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Submit quiz answers and calculate result."""
    # Verify quiz exists
    quiz = session.exec(select(Quiz).where(Quiz.id == data.quiz_id)).first()
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found"
        )
    
    # Calculate total score
    total_score = 0
    import json
    
    # Validate and calculate score
    for answer_data in data.answers:
        question_id = answer_data.get("question_id")
        answer_id = answer_data.get("answer_id")
        
        # Verify question belongs to quiz
        question = session.exec(
            select(QuizQuestion)
            .where(QuizQuestion.id == question_id)
            .where(QuizQuestion.quiz_id == data.quiz_id)
        ).first()
        
        if not question:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Question {question_id} not found in quiz"
            )
        
        # Get answer and add score
        answer = session.exec(
            select(QuizAnswer)
            .where(QuizAnswer.id == answer_id)
            .where(QuizAnswer.question_id == question_id)
        ).first()
        
        if not answer:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Answer {answer_id} not found for question {question_id}"
            )
        
        total_score += answer.score_value
    
    # Generate result summary based on score
    result_summary = generate_result_summary(quiz.slug, total_score, len(data.answers))
    
    # Save result
    quiz_result = QuizResult(
        user_id=current_user.id if current_user else None,
        quiz_id=data.quiz_id,
        answers_json=json.dumps(data.answers),
        total_score=total_score,
        result_summary=result_summary,
        session_id=data.session_id if not current_user else None
    )
    session.add(quiz_result)
    session.commit()
    session.refresh(quiz_result)
    
    return {
        "result_id": quiz_result.id,
        "total_score": total_score,
        "result_summary": result_summary,
        "message": "Quiz submitted successfully"
    }


class TransferSessionRequest(BaseModel):
    """Transfer session request."""
    session_id: str


@router.post("/quizzes/transfer-session")
async def transfer_session_results(
    data: TransferSessionRequest,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Transfer anonymous quiz results to user account after signup."""
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    # Find all results with this session_id
    results = session.exec(
        select(QuizResult)
        .where(QuizResult.session_id == data.session_id)
        .where(QuizResult.user_id == None)
    ).all()
    
    # Transfer to user
    for result in results:
        result.user_id = current_user.id
        result.session_id = None
        session.add(result)
    
    session.commit()
    
    return {
        "message": f"Transferred {len(results)} quiz results to your account",
        "count": len(results)
    }


def generate_result_summary(quiz_slug: str, total_score: int, num_questions: int) -> str:
    """Generate result summary based on quiz and score."""
    if quiz_slug == "discover-hidden-skills":
        # Score range: 0 to (num_questions * max_score_per_answer)
        # Assuming max score per answer is 5, max total would be num_questions * 5
        max_possible = num_questions * 5
        percentage = (total_score / max_possible * 100) if max_possible > 0 else 0
        
        if percentage >= 80:
            return "You have exceptional hidden skills! Your natural talents span multiple areas, and you're likely underutilizing your potential. Consider exploring creative projects, leadership roles, or cross-disciplinary work."
        elif percentage >= 60:
            return "You have strong hidden skills waiting to be developed. You show aptitude in several areas that you might not be fully aware of. Try new challenges and pay attention to what comes naturally."
        elif percentage >= 40:
            return "You have solid foundational skills with room to grow. Your hidden talents are there, but they need nurturing. Experiment with different activities and see what resonates."
        else:
            return "Your hidden skills are just beginning to emerge. This is an opportunity for discovery! Try new experiences, take on different challenges, and be open to learning about yourself."
    
    return f"Your quiz score: {total_score}/{max_possible}. Keep exploring to discover more about yourself!"
