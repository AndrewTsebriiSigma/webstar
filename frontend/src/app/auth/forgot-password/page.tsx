'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

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
      toast.success('Reset email sent!');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
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
            <img 
              src="/webstar-logo.png" 
              alt="WebSTAR" 
              className="w-16 h-16 mx-auto"
              style={{ filter: 'drop-shadow(0 0 20px rgba(0, 194, 255, 0.3))' }}
            />
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
          {!sent ? (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" 
                  style={{ background: 'rgba(0, 194, 255, 0.1)' }}>
                  <svg className="w-8 h-8 text-[#00C2FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold mb-2" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
                  Forgot password?
                </h2>
                <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                  No worries, we'll send you reset instructions.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl text-sm text-center"
                  style={{ background: 'rgba(255, 69, 58, 0.1)', color: '#FF453A' }}
                >
                  {error}
                </div>
              )}

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
                    placeholder="Enter your email"
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
                  {loading ? 'Sending...' : 'Reset password'}
                </button>
              </form>
            </>
          ) : (
            <>
              {/* Success State */}
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" 
                  style={{ background: 'rgba(52, 199, 89, 0.1)' }}>
                  <svg className="w-8 h-8 text-[#34C759]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold mb-2" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
                  Check your email
                </h2>
                <p className="text-sm mb-6" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                  We sent a password reset link to<br />
                  <span style={{ color: '#00C2FF' }}>{email}</span>
                </p>

                <button
                  onClick={() => {
                    setSent(false);
                    setEmail('');
                  }}
                  className="text-sm font-medium transition hover:opacity-80"
                  style={{ color: 'rgba(255, 255, 255, 0.5)' }}
                >
                  Didn't receive the email? <span style={{ color: '#00C2FF' }}>Click to resend</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Back link */}
        <div className="text-center mt-6">
          <Link 
            href="/auth" 
            className="text-sm transition hover:opacity-80 flex items-center justify-center gap-2"
            style={{ color: 'rgba(255, 255, 255, 0.5)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0B0B0C' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    }>
      <ForgotPasswordContent />
    </Suspense>
  );
}
