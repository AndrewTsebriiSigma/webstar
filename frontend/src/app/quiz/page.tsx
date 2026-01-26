'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { quizAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

// Matrix Rain for Finale
const MatrixRain = () => {
  useEffect(() => {
    const canvas = document.getElementById('quiz-matrix') as HTMLCanvasElement;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789';
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    const drops: number[] = Array(columns).fill(1);

    const draw = () => {
      ctx.fillStyle = 'rgba(11, 11, 12, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#00C2FF';
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;
        
        ctx.fillStyle = `rgba(0, 194, 255, ${Math.random() * 0.5})`;
        ctx.fillText(text, x, y);

        if (y > canvas.height && Math.random() > 0.98) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 50);
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return <canvas id="quiz-matrix" className="absolute inset-0 pointer-events-none" />;
};

// Floating Orbs
const FloatingOrbs = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div 
      className="absolute w-[500px] h-[500px] rounded-full"
      style={{
        background: 'radial-gradient(circle, rgba(0, 194, 255, 0.12) 0%, transparent 70%)',
        top: '10%',
        left: '20%',
        filter: 'blur(60px)',
        animation: 'float 20s ease-in-out infinite'
      }}
    />
    <div 
      className="absolute w-[400px] h-[400px] rounded-full"
      style={{
        background: 'radial-gradient(circle, rgba(255, 100, 200, 0.08) 0%, transparent 70%)',
        bottom: '20%',
        right: '10%',
        filter: 'blur(80px)',
        animation: 'float 25s ease-in-out infinite reverse'
      }}
    />
  </div>
);

interface QuizQuestion {
  id: number;
  question_text: string;
  question_order: number;
  answers: Array<{
    id: number;
    answer_text: string;
    answer_order: number;
    score_value: number;
  }>;
}

interface Quiz {
  id: number;
  title: string;
  description: string | null;
  questions: QuizQuestion[];
}

export default function QuizPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [error, setError] = useState('');

  // Generate session ID for anonymous users
  const [sessionId] = useState(() => {
    if (typeof window !== 'undefined') {
      let sid = localStorage.getItem('quiz_session_id');
      if (!sid) {
        sid = `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('quiz_session_id', sid);
      }
      return sid;
    }
    return '';
  });

  useEffect(() => {
    loadQuiz();
  }, []);

  const loadQuiz = async () => {
    try {
      const response = await quizAPI.getQuiz('discover-hidden-skills');
      setQuiz(response.data);
      setLoading(false);
    } catch (err: any) {
      console.error('Failed to load quiz:', err);
      setError('Failed to load quiz. Please try again.');
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentQuestion < (quiz?.questions.length || 0) - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleAnswerSelect = (questionId: number, answerId: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: answerId }));
  };

  const handleSubmit = async () => {
    if (!quiz) return;
    
    // Check all questions are answered
    const allAnswered = quiz.questions.every(q => answers[q.id] !== undefined);
    if (!allAnswered) {
      setError('Please answer all questions before submitting.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const answersArray = quiz.questions.map(q => ({
        question_id: q.id,
        answer_id: answers[q.id]
      }));

      await quizAPI.submitQuiz({
        quiz_id: quiz.id,
        answers: answersArray,
        session_id: user ? undefined : sessionId
      });

      // Store result in localStorage for transfer after signup
      if (!user) {
        localStorage.setItem('pending_quiz_result', JSON.stringify({
          quiz_id: quiz.id,
          session_id: sessionId
        }));
      }

      setShowCompletion(true);
    } catch (err: any) {
      console.error('Failed to submit quiz:', err);
      setError('Failed to submit quiz. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoToAuth = () => {
    router.push('/auth');
  };

  // Calculate progress
  const progress = quiz ? ((currentQuestion + 1) / quiz.questions.length) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0B0B0C' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#00C2FF' }}></div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0B0B0C' }}>
        <div className="text-center">
          <p className="text-lg mb-4" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
            {error || 'Quiz not found'}
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02]"
            style={{
              background: 'linear-gradient(180deg, rgba(0, 194, 255, 0.9) 0%, rgba(0, 160, 210, 0.95) 100%)',
              color: '#fff'
            }}
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  // Completion Screen
  if (showCompletion) {
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden"
        style={{ background: '#0B0B0C' }}
      >
        <MatrixRain />
        <FloatingOrbs />
        
        <div className="relative z-10 text-center max-w-md">
          <div 
            className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #00C2FF 0%, #0088CC 100%)',
              boxShadow: '0 4px 30px rgba(0, 194, 255, 0.4)'
            }}
          >
            <span className="text-3xl">🎉</span>
          </div>
          
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
            Congratulations!
          </h1>
          <p className="text-lg mb-4" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
            You've completed the quiz
          </p>
          <p className="text-sm mb-8" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
            {user 
              ? 'Check your analytics page to see your results!'
              : 'To discover your results, please create an account'
            }
          </p>

          {user ? (
            <Link
              href="/analytics"
              className="inline-block px-8 py-3 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02]"
              style={{
                background: 'linear-gradient(180deg, rgba(0, 194, 255, 0.9) 0%, rgba(0, 160, 210, 0.95) 100%)',
                color: '#fff',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 2px 8px rgba(0,0,0,0.35)'
              }}
            >
              View Results
            </Link>
          ) : (
            <button
              onClick={handleGoToAuth}
              className="inline-block px-8 py-3 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02]"
              style={{
                background: 'linear-gradient(180deg, rgba(0, 194, 255, 0.9) 0%, rgba(0, 160, 210, 0.95) 100%)',
                color: '#fff',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 2px 8px rgba(0,0,0,0.35)'
              }}
            >
              Create Account
            </button>
          )}
        </div>
      </div>
    );
  }

  const question = quiz.questions[currentQuestion];
  const selectedAnswer = answers[question.id];

  return (
    <div 
      className="min-h-screen flex flex-col items-center px-4 py-8 relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at center, #0B0B0C 0%, #050506 100%)' }}
    >
      <FloatingOrbs />

      {/* Progress Bar */}
      <div className="w-full max-w-md mb-8 relative z-10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
            Question {currentQuestion + 1} of {quiz.questions.length}
          </span>
          <span className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
            {Math.round(progress)}%
          </span>
        </div>
        <div 
          className="h-2 rounded-full overflow-hidden"
          style={{ background: 'rgba(255, 255, 255, 0.1)' }}
        >
          <div 
            className="h-full rounded-full transition-all duration-500"
            style={{ 
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #00C2FF, #0088CC)'
            }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-md relative z-10 flex-1 flex flex-col">
        <div 
          className="rounded-2xl p-6 flex-1 flex flex-col"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}
        >
          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 rounded-xl text-sm text-center"
              style={{ 
                background: 'rgba(255, 69, 58, 0.1)', 
                color: '#FF453A',
                border: '1px solid rgba(255, 69, 58, 0.3)'
              }}
            >
              {error}
            </div>
          )}

          {/* Question */}
          <div className="mb-6 flex-1">
            <h2 className="text-xl font-bold mb-6" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
              {question.question_text}
            </h2>

            {/* Answer Options */}
            <div className="space-y-3">
              {question.answers.map((answer) => (
                <button
                  key={answer.id}
                  onClick={() => handleAnswerSelect(question.id, answer.id)}
                  className="w-full text-left p-4 rounded-xl transition-all duration-200"
                  style={{
                    background: selectedAnswer === answer.id
                      ? 'rgba(0, 194, 255, 0.15)'
                      : 'rgba(255, 255, 255, 0.02)',
                    border: selectedAnswer === answer.id
                      ? '1px solid rgba(0, 194, 255, 0.4)'
                      : '1px solid rgba(255, 255, 255, 0.05)',
                    color: 'rgba(255, 255, 255, 0.9)'
                  }}
                >
                  {answer.answer_text}
                </button>
              ))}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-6">
            {currentQuestion > 0 && (
              <button
                onClick={handlePrevious}
                className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'rgba(255, 255, 255, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                Previous
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={!selectedAnswer || submitting}
              className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: selectedAnswer && !submitting
                  ? 'linear-gradient(180deg, rgba(0, 194, 255, 0.9) 0%, rgba(0, 160, 210, 0.95) 100%)'
                  : 'rgba(255, 255, 255, 0.1)',
                color: '#fff',
                boxShadow: selectedAnswer && !submitting
                  ? 'inset 0 1px 0 rgba(255,255,255,0.2), 0 2px 8px rgba(0,0,0,0.35)'
                  : 'none'
              }}
            >
              {submitting ? 'Submitting...' : currentQuestion === quiz.questions.length - 1 ? 'Submit' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
