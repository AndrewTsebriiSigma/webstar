'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  const email = searchParams.get('email') || '';

  useEffect(() => {
    if (!email) {
      router.push('/auth');
      return;
    }
    
    inputRefs.current[0]?.focus();
    
    const timer = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [email, router]);

  const handleInputChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    
    if (value && index === 5 && newCode.every(d => d)) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length === 6) {
      const newCode = pastedData.split('');
      setCode(newCode);
      inputRefs.current[5]?.focus();
      handleVerify(pastedData);
    }
  };

  const handleVerify = async (verificationCode: string) => {
    setLoading(true);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/verify-email-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verificationCode })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Verification failed');
      }
      
      toast.success('Email verified!');
      sessionStorage.setItem('verified_email', email);
      router.push(`/auth?verified=true&email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      toast.error(err.message);
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/send-verification-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to resend');
      }
      
      toast.success('New code sent!');
      setResendTimer(60);
      setCanResend(false);
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
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
        {/* Logo & Header - mb-24 same as auth page */}
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

        {/* Progress Steps - Start → Confirm → Enter */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {/* Step 1 - Complete */}
          <div className="flex items-center gap-1.5">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
              style={{ background: 'rgba(52, 199, 89, 0.2)', color: '#34C759' }}
            >
              ✓
            </div>
            <span className="text-[11px] font-medium" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Start</span>
          </div>
          
          {/* Line 1 */}
          <div className="w-8 h-[2px] rounded-full" style={{ background: 'linear-gradient(90deg, rgba(52, 199, 89, 0.4), rgba(0, 194, 255, 0.4))' }} />
          
          {/* Step 2 - Active */}
          <div className="flex items-center gap-1.5">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ 
                background: 'rgba(0, 194, 255, 0.2)', 
                color: '#00C2FF',
                boxShadow: '0 0 12px rgba(0, 194, 255, 0.3)'
              }}
            >
              2
            </div>
            <span className="text-[11px] font-semibold" style={{ color: '#00C2FF' }}>Confirm</span>
          </div>
          
          {/* Line 2 */}
          <div className="w-8 h-[2px] rounded-full" style={{ background: 'rgba(255, 255, 255, 0.1)' }} />
          
          {/* Step 3 - Upcoming */}
          <div className="flex items-center gap-1.5">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
              style={{ background: 'rgba(255, 255, 255, 0.06)', color: 'rgba(255, 255, 255, 0.35)' }}
            >
              3
            </div>
            <span className="text-[11px]" style={{ color: 'rgba(255, 255, 255, 0.35)' }}>Enter</span>
          </div>
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
          {/* Title */}
          <div className="text-center mb-8">
            <h1 
              className="text-3xl font-bold mb-2"
              style={{ color: '#FFFFFF' }}
            >
              Grab your code
            </h1>
            <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              6 digits waiting at <span style={{ color: '#00C2FF' }}>{email}</span>
            </p>
          </div>

          {/* Code Input */}
          <div className="flex justify-center gap-3 mb-6" onPaste={handlePaste}>
            {code.map((digit, index) => (
              <input
                key={index}
                ref={el => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={loading}
                className="w-12 h-14 text-center text-2xl font-bold rounded-xl transition-all focus:outline-none"
                style={{
                  background: digit ? 'rgba(0, 194, 255, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                  border: digit ? '2px solid rgba(0, 194, 255, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#00C2FF',
                  fontSize: '16px'
                }}
              />
            ))}
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex justify-center mb-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-500"></div>
            </div>
          )}

          {/* Resend - matching "Forgot password?" style */}
          <div className="text-center h-6 flex items-center justify-center">
            {canResend ? (
              <button
                onClick={handleResend}
                disabled={loading}
                className="text-sm transition hover:opacity-80 disabled:opacity-50"
                style={{ color: 'rgba(255, 255, 255, 0.4)' }}
              >
                Resend code
              </button>
            ) : (
              <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                Resend in {resendTimer}s
              </p>
            )}
          </div>
        </div>

        {/* Back link - matching "Forgot password?" style */}
        <div className="mt-4 text-center">
          <button 
            type="button"
            onClick={() => router.push('/auth')}
            className="text-sm transition hover:opacity-80"
            style={{ color: 'rgba(255, 255, 255, 0.4)' }}
          >
            ← Different email
          </button>
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

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#111111' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
