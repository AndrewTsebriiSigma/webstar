'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setTokenValid(false);
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to reset password');
      }

      setSuccess(true);
      toast.success('Password reset successfully!');
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/auth');
      }, 2000);
    } catch (err: any) {
      if (err.message.includes('expired') || err.message.includes('invalid')) {
        setTokenValid(false);
      }
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
          {!tokenValid ? (
            // Invalid/Expired Token State
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" 
                style={{ background: 'rgba(255, 69, 58, 0.1)' }}>
                <svg className="w-8 h-8 text-[#FF453A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
                Link expired
              </h2>
              <p className="text-sm mb-6" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                This password reset link has expired or is invalid.<br />
                Please request a new one.
              </p>

              <Link
                href="/auth/forgot-password"
                className="inline-block w-full py-3.5 text-white font-semibold rounded-xl transition text-center"
                style={{
                  background: 'linear-gradient(135deg, #00C2FF 0%, #0A84FF 100%)',
                  boxShadow: '0 4px 20px rgba(0, 194, 255, 0.3)'
                }}
              >
                Request new link
              </Link>
            </div>
          ) : success ? (
            // Success State
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" 
                style={{ background: 'rgba(52, 199, 89, 0.1)' }}>
                <svg className="w-8 h-8 text-[#34C759]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
                Password reset!
              </h2>
              <p className="text-sm mb-4" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                Your password has been successfully reset.<br />
                Redirecting to login...
              </p>
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-500 mx-auto"></div>
            </div>
          ) : (
            // Reset Form
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" 
                  style={{ background: 'rgba(0, 194, 255, 0.1)' }}>
                  <svg className="w-8 h-8 text-[#00C2FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold mb-2" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
                  Set new password
                </h2>
                <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                  Must be at least 8 characters.
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
                {/* New Password */}
                <div 
                  className="mb-3 relative flex items-center"
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.06)'
                  }}
                >
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="New password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-10 text-center"
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
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'rgba(255, 255, 255, 0.4)' }}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>

                {/* Confirm Password */}
                <div 
                  className="mb-4 relative flex items-center"
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.06)'
                  }}
                >
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-10 text-center"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: 'rgba(255, 255, 255, 0.95)',
                      fontSize: '16px'
                    }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'rgba(255, 255, 255, 0.4)' }}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading || !password || !confirmPassword}
                  className="w-full py-3.5 text-white font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(135deg, #00C2FF 0%, #0A84FF 100%)',
                    boxShadow: '0 4px 20px rgba(0, 194, 255, 0.3)'
                  }}
                >
                  {loading ? 'Resetting...' : 'Reset password'}
                </button>
              </form>
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0B0B0C' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
