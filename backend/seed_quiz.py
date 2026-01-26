"""Seed quiz data."""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from app.db.base import engine
from app.db.models import Quiz, QuizQuestion, QuizAnswer
from sqlmodel import Session, select

def seed_quiz():
    """Seed the 'Discover Your Hidden Skills' quiz."""
    with Session(engine) as session:
        # Check if quiz already exists
        existing_quiz = session.exec(select(Quiz).where(Quiz.slug == "discover-hidden-skills")).first()
        if existing_quiz:
            print("Quiz already exists. Skipping seed.")
            return
    
        # Create quiz
        quiz = Quiz(
            title="Discover Your Hidden Skills",
            description="Uncover talents you didn't know you had",
            slug="discover-hidden-skills"
        )
        session.add(quiz)
        session.commit()
        session.refresh(quiz)
    
        # Questions and answers
        questions_data = [
        {
            "question": "When you have free time, what do you naturally gravitate toward?",
            "answers": [
                {"text": "Creating something new (art, music, writing)", "score": 5},
                {"text": "Solving puzzles or problems", "score": 4},
                {"text": "Learning about new topics", "score": 3},
                {"text": "Organizing or planning things", "score": 2},
            ]
        },
        {
            "question": "How do you prefer to communicate complex ideas?",
            "answers": [
                {"text": "Through visual examples or diagrams", "score": 5},
                {"text": "By telling a story", "score": 4},
                {"text": "With data and facts", "score": 3},
                {"text": "Through hands-on demonstration", "score": 2},
            ]
        },
        {
            "question": "What type of feedback energizes you most?",
            "answers": [
                {"text": "People saying 'I never thought of it that way'", "score": 5},
                {"text": "Seeing someone use what you created", "score": 4},
                {"text": "Recognition for your expertise", "score": 3},
                {"text": "Being asked for your opinion", "score": 2},
            ]
        },
        {
            "question": "When facing a challenge, your first instinct is to:",
            "answers": [
                {"text": "Break it down into smaller pieces", "score": 5},
                {"text": "Look for patterns or connections", "score": 4},
                {"text": "Ask others for their perspective", "score": 3},
                {"text": "Try different approaches until one works", "score": 2},
            ]
        },
        {
            "question": "What makes you feel most accomplished?",
            "answers": [
                {"text": "Completing something creative and original", "score": 5},
                {"text": "Helping others achieve their goals", "score": 4},
                {"text": "Mastering a difficult skill", "score": 3},
                {"text": "Building something that lasts", "score": 2},
            ]
        },
        {
            "question": "How do you learn best?",
            "answers": [
                {"text": "By doing and experimenting", "score": 5},
                {"text": "Through observation and analysis", "score": 4},
                {"text": "By teaching others", "score": 3},
                {"text": "Following structured lessons", "score": 2},
            ]
        },
        {
            "question": "What type of work environment brings out your best?",
            "answers": [
                {"text": "Flexible, creative spaces with autonomy", "score": 5},
                {"text": "Collaborative teams with diverse perspectives", "score": 4},
                {"text": "Structured environments with clear goals", "score": 3},
                {"text": "Fast-paced, dynamic settings", "score": 2},
            ]
        },
        {
            "question": "When you look back at your past projects, what stands out?",
            "answers": [
                {"text": "The unique solutions you found", "score": 5},
                {"text": "The impact you had on others", "score": 4},
                {"text": "The skills you developed", "score": 3},
                {"text": "The consistency of your work", "score": 2},
            ]
        },
    ]
    
        # Create questions and answers
        for order, q_data in enumerate(questions_data, 1):
            question = QuizQuestion(
                quiz_id=quiz.id,
                question_text=q_data["question"],
                question_order=order
            )
            session.add(question)
            session.commit()
            session.refresh(question)
            
            # Add answers
            for ans_order, ans_data in enumerate(q_data["answers"], 1):
                answer = QuizAnswer(
                    question_id=question.id,
                    answer_text=ans_data["text"],
                    answer_order=ans_order,
                    score_value=ans_data["score"]
                )
                session.add(answer)
            
            session.commit()
        
        print(f"✅ Seeded quiz '{quiz.title}' with {len(questions_data)} questions")
        print(f"Quiz ID: {quiz.id}, Slug: {quiz.slug}")

if __name__ == "__main__":
    seed_quiz()
