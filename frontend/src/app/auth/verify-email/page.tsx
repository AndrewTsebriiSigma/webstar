'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

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
    
    // Focus first input
    inputRefs.current[0]?.focus();
    
    // Start resend timer
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
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    
    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    
    // Auto-submit when all digits entered
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
      // Store verified email and redirect to complete registration
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
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0B0B0C' }}>
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              WebSTAR
            </h1>
          </Link>
        </div>

        {/* Card */}
        <div 
          className="rounded-3xl p-8"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(20px)'
          }}
        >
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" 
              style={{ background: 'rgba(0, 194, 255, 0.1)' }}>
              <svg className="w-8 h-8 text-[#00C2FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
              Check your email
            </h2>
            <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              We sent a code to <span style={{ color: '#00C2FF' }}>{email}</span>
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
                  fontSize: '16px' // Prevent iOS zoom
                }}
              />
            ))}
          </div>

          {/* Loading indicator */}
          {loading && (
            <div className="flex justify-center mb-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-500"></div>
            </div>
          )}

          {/* Resend */}
          <div className="text-center">
            {canResend ? (
              <button
                onClick={handleResend}
                disabled={loading}
                className="text-sm font-medium transition hover:opacity-80 disabled:opacity-50"
                style={{ color: '#00C2FF' }}
              >
                Resend code
              </button>
            ) : (
              <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                Resend code in <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>{resendTimer}s</span>
              </p>
            )}
          </div>
        </div>

        {/* Back link */}
        <div className="text-center mt-6">
          <Link 
            href="/auth" 
            className="text-sm transition hover:opacity-80"
            style={{ color: 'rgba(255, 255, 255, 0.5)' }}
          >
            ← Use a different email
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0B0B0C' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
