'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

// Matrix Rain Effect Component (same as auth page)
function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const chars = '01アイウエオカキクケコサシスセソタチツテト10∆∇◊○●□■△▽☆★♦♢⬡⬢';
    const charArray = chars.split('');
    
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    
    const drops: number[] = [];
    for (let i = 0; i < columns; i++) {
      drops[i] = Math.random() * -100;
    }

    const colors = [
      'rgba(0, 194, 255, 0.9)',
      'rgba(0, 194, 255, 0.7)',
      'rgba(0, 126, 167, 0.8)',
      'rgba(0, 255, 229, 0.6)',
      'rgba(0, 194, 255, 0.4)',
    ];

    const draw = () => {
      ctx.fillStyle = 'rgba(5, 5, 8, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const char = charArray[Math.floor(Math.random() * charArray.length)];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        if (Math.random() > 0.95) {
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#00C2FF';
        } else {
          ctx.shadowBlur = 0;
        }

        ctx.fillStyle = color;
        ctx.fillText(char, x, y);
        ctx.shadowBlur = 0;

        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        
        drops[i] += 0.5 + Math.random() * 0.5;
      }
    };

    const interval = setInterval(draw, 50);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ opacity: 0.3 }}
    />
  );
}

function ForgotPasswordContent() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to send reset email');
      }

      setSent(true);
      toast.success('Reset link sent!');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to resend');
      }

      toast.success('Reset link sent again!');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center px-4 relative overflow-hidden"
      style={{ background: '#111111', paddingTop: '8vh' }}
    >
      {/* Deep Background Layer */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, #1a1a1e 0%, #111114 100%)'
        }}
      />

      {/* Matrix Rain Effect */}
      <MatrixRain />

      {/* Gradient Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 40%, transparent 0%, rgba(10, 10, 12, 0.7) 100%)'
        }}
      />

      {/* Subtle Vignette */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          boxShadow: 'inset 0 0 150px 50px rgba(0, 0, 0, 0.5)'
        }}
      />

      {/* Main Content */}
      <div className="max-w-md w-full relative z-10 animate-fade-in flex flex-col flex-1">
        {/* Logo & Header */}
        <div className="text-center">
          <Link href="/" className="inline-flex flex-col items-center mb-24 relative group">
            <div 
              className="absolute inset-0 rounded-full blur-2xl opacity-60 group-hover:opacity-80 transition-opacity duration-500"
              style={{ 
                background: 'radial-gradient(circle, rgba(0, 194, 255, 0.4) 0%, transparent 70%)',
                transform: 'scale(1.5)',
                top: '-40px'
              }}
            />
            <img 
              src="/webstar-logo.png" 
              alt="WebSTAR" 
              className="w-20 h-20 relative z-10 transition-transform duration-300 group-hover:scale-105"
              style={{ filter: 'drop-shadow(0 0 20px rgba(0, 194, 255, 0.3))' }}
            />
            <span 
              className="text-xl font-bold tracking-widest mt-2 relative z-10"
              style={{ 
                color: '#00C2FF',
                textShadow: '0 0 20px rgba(0, 194, 255, 0.4)'
              }}
            >
              WebSTAR
            </span>
          </Link>
        </div>

        {/* Main Card */}
        <div 
          className="glass rounded-2xl p-8 animate-slide-up"
          style={{ 
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
          }}
        >
          {error && (
            <div className="mb-4 p-3 rounded-xl text-sm text-center"
              style={{ background: 'rgba(255, 69, 58, 0.1)', color: '#FF453A' }}
            >
              {error}
            </div>
          )}

          {!sent ? (
            <>
              {/* Title */}
              <div className="text-center mb-8">
                <h1 
                  className="text-3xl font-bold mb-2"
                  style={{ color: '#FFFFFF' }}
                >
                  Forgot password?
                </h1>
                <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                  Enter your email to reset
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit}>
                <div 
                  className="mb-4"
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.06)'
                  }}
                >
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 text-center"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: 'rgba(255, 255, 255, 0.95)',
                      fontSize: '16px'
                    }}
                    autoFocus
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full py-3.5 text-white font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(135deg, #00C2FF 0%, #0A84FF 100%)',
                    boxShadow: '0 4px 20px rgba(0, 194, 255, 0.3)'
                  }}
                >
                  {loading ? 'Sending...' : 'Reset'}
                </button>
              </form>
            </>
          ) : (
            <>
              {/* Success State - Simplified */}
              <div className="text-center">
                <h1 
                  className="text-3xl font-bold mb-2"
                  style={{ color: '#FFFFFF' }}
                >
                  Check your inbox
                </h1>
                <p className="text-sm mb-6" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                  Reset link sent to <span style={{ color: '#00C2FF' }}>{email}</span>
                </p>

                <button
                  onClick={handleResend}
                  disabled={loading}
                  className="text-sm transition hover:opacity-80 disabled:opacity-50"
                  style={{ color: 'rgba(255, 255, 255, 0.4)' }}
                >
                  {loading ? 'Sending...' : 'Send again'}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Back link */}
        <div className="mt-4 text-center">
          <Link 
            href="/auth" 
            className="text-sm transition hover:opacity-80"
            style={{ color: 'rgba(255, 255, 255, 0.4)' }}
          >
            ← Back
          </Link>
        </div>

        {/* Footer - pushed down */}
        <div className="mt-auto pt-16 text-center">
          <div className="flex items-center justify-center gap-4 mb-2">
            <Link href="/terms" className="text-[10px] transition hover:text-white" style={{ color: 'rgba(255, 255, 255, 0.25)' }}>
              Terms
            </Link>
            <Link href="/privacy" className="text-[10px] transition hover:text-white" style={{ color: 'rgba(255, 255, 255, 0.25)' }}>
              Privacy
            </Link>
          </div>
          <p className="text-[10px]" style={{ color: 'rgba(255, 255, 255, 0.2)' }}>
            WebSTAR. All rights reserved.
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        .animate-slide-up {
          animation: slide-up 0.5s ease-out 0.1s both;
        }
      `}</style>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#111111' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    }>
      <ForgotPasswordContent />
    </Suspense>
  );
}
