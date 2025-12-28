'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { authAPI } from '@/lib/api';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export default function LoginPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState<'credentials' | '2fa'>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authAPI.login({ email, password });
      const data = response.data;

      // Check if 2FA is required
      if (data.requires_2fa && data.temp_token) {
        setTempToken(data.temp_token);
        setStep('2fa');
        toast.success(data.message || 'Please enter your 2FA code');
      } else {
        // No 2FA required, complete login
        if (data.access_token && data.refresh_token && data.user) {
          localStorage.setItem('access_token', data.access_token);
          localStorage.setItem('refresh_token', data.refresh_token);
          localStorage.setItem('user', JSON.stringify(data.user));
          
          toast.success('Welcome back!');
          
          // Redirect based on onboarding status
          if (data.user.onboarding_completed) {
            router.push(`/${data.user.username}`);
          } else {
            router.push('/onboarding');
          }
          
          // Reload to update auth context
          window.location.href = data.user.onboarding_completed ? `/${data.user.username}` : '/onboarding';
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (totpCode.length !== 6) {
      toast.error('Please enter a 6-digit code');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.verify2FALogin(tempToken, totpCode);
      const data = response.data;

      // Store tokens and user
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      localStorage.setItem('user', JSON.stringify(data.user));

      toast.success('Welcome back!');

      // Redirect based on onboarding status
      if (data.user.onboarding_completed) {
        window.location.href = `/${data.user.username}`;
      } else {
        window.location.href = '/onboarding';
      }
    } catch (error: any) {
      console.error('2FA verification error:', error);
      toast.error(error.response?.data?.detail || 'Invalid 2FA code');
      setTotpCode(''); // Clear the code on error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: '#111111' }}
    >
      {/* Ambient Background Glow */}
      <div 
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #00C2FF 0%, transparent 70%)' }}
      />
      <div 
        className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #007EA7 0%, transparent 70%)' }}
      />

      <div className="max-w-md w-full relative z-10 animate-fade-in">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <Link 
            href="/" 
            className="inline-block text-4xl font-bold mb-6 transition-transform hover:scale-105"
            style={{ 
              background: 'linear-gradient(135deg, #00C2FF 0%, #33D1FF 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            CREATOR OS
          </Link>
          
          <h1 
            className="text-3xl font-bold mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            {step === 'credentials' ? 'Welcome back' : 'Two-Factor Authentication'}
          </h1>
          
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            {step === 'credentials' 
              ? 'Sign in to continue to your creative workspace' 
              : 'Enter the 6-digit code from your authenticator app'
            }
          </p>
        </div>

        {/* Main Card */}
        <div 
          className="glass rounded-2xl p-8 animate-slide-up"
          style={{ 
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            boxShadow: 'var(--shadow-md)'
          }}
        >
          {step === 'credentials' ? (
            <form onSubmit={handleCredentialsSubmit} className="space-y-5">
              {/* Email Input */}
              <div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full"
                  placeholder="Email address"
                  autoComplete="email"
                  disabled={loading}
                />
              </div>

              {/* Password Input */}
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pr-10"
                  placeholder="Password"
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle 
                        className="opacity-25" 
                        cx="12" 
                        cy="12" 
                        r="10" 
                        stroke="currentColor" 
                        strokeWidth="4"
                        fill="none"
                      />
                      <path 
                        className="opacity-75" 
                        fill="currentColor" 
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handle2FASubmit} className="space-y-6">
              {/* 2FA Code Input */}
              <div>
                <input
                  id="totp-code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  required
                  value={totpCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setTotpCode(value);
                  }}
                  className="w-full text-center text-2xl font-mono tracking-widest"
                  placeholder="000000"
                  autoFocus
                  autoComplete="off"
                  disabled={loading}
                />
                <p 
                  className="mt-3 text-xs text-center"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  Open your authenticator app to get your code
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setStep('credentials');
                    setTotpCode('');
                    setTempToken('');
                  }}
                  className="btn-secondary flex-1"
                  disabled={loading}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || totpCode.length !== 6}
                  className="btn-primary flex-1"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle 
                          className="opacity-25" 
                          cx="12" 
                          cy="12" 
                          r="10" 
                          stroke="currentColor" 
                          strokeWidth="4"
                          fill="none"
                        />
                        <path 
                          className="opacity-75" 
                          fill="currentColor" 
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Verifying...
                    </span>
                  ) : (
                    'Verify & Continue'
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Divider & Additional Options (Only on credentials step) */}
          {step === 'credentials' && (
            <>
              <div className="my-8 relative">
                <div className="absolute inset-0 flex items-center">
                  <div 
                    className="w-full border-t"
                    style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
                  />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span 
                    className="px-3 py-1 rounded-full"
                    style={{ 
                      background: '#111111',
                      color: 'var(--text-tertiary)',
                      letterSpacing: '0.5px'
                    }}
                  >
                    OR CONTINUE WITH
                  </span>
                </div>
              </div>

              {/* Google Sign In Button */}
              <button
                type="button"
                className="btn-secondary w-full flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              {/* Sign Up Link */}
              <p 
                className="mt-8 text-center text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                Don't have an account?{' '}
                <Link 
                  href="/auth/register" 
                  className="font-semibold transition-colors hover:brightness-110"
                  style={{ color: 'var(--blue)' }}
                >
                  Create account
                </Link>
              </p>
            </>
          )}
        </div>

        {/* Security Notice */}
        {step === '2fa' && (
          <div 
            className="mt-6 text-center text-xs p-4 rounded-lg"
            style={{ 
              color: 'var(--text-tertiary)',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}
          >
            <svg 
              className="w-4 h-4 inline-block mr-2 mb-1" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
              />
            </svg>
            Protected by two-factor authentication
          </div>
        )}
      </div>
    </div>
  );
}

