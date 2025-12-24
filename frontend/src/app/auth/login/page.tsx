'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { authAPI } from '@/lib/api';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState<'credentials' | '2fa'>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [loading, setLoading] = useState(false);

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
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#111111' }}>
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-gradient">
            WebStar
          </Link>
          <h2 className="mt-6 text-3xl font-bold" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
            {step === 'credentials' ? 'Welcome back' : 'Two-Factor Authentication'}
          </h2>
          <p className="mt-2" style={{ color: 'rgba(255, 255, 255, 0.75)' }}>
            {step === 'credentials' ? 'Sign in to your account' : 'Enter the code from your authenticator app'}
          </p>
        </div>

        <div className="glass rounded-2xl shadow-xl p-8">
          {step === 'credentials' ? (
            <form onSubmit={handleCredentialsSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-4 py-3 rounded-lg"
                style={{ 
                  background: 'rgba(255, 255, 255, 0.05)', 
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'rgba(255, 255, 255, 0.95)'
                }}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-4 py-3 rounded-lg"
                style={{ 
                  background: 'rgba(255, 255, 255, 0.05)', 
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'rgba(255, 255, 255, 0.95)'
                }}
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-primary text-white font-semibold rounded-lg hover:shadow-lg transition disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          ) : (
            <form onSubmit={handle2FASubmit} className="space-y-6">
              {/* 2FA Code Input */}
              <div>
                <label htmlFor="totp-code" className="block text-sm font-medium mb-2" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
                  Authentication Code
                </label>
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
                  className="block w-full px-4 py-3 rounded-lg text-center text-2xl font-mono tracking-widest"
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.05)', 
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'rgba(255, 255, 255, 0.95)'
                  }}
                  placeholder="000000"
                  autoFocus
                  autoComplete="off"
                />
                <p className="mt-2 text-xs text-center" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                  Enter the 6-digit code from your authenticator app
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
                  className="flex-1 py-3 px-4 font-semibold rounded-lg transition"
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.05)', 
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'rgba(255, 255, 255, 0.75)'
                  }}
                  disabled={loading}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || totpCode.length !== 6}
                  className="flex-1 py-3 px-4 bg-gradient-primary text-white font-semibold rounded-lg hover:shadow-lg transition disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify'}
                </button>
              </div>
            </form>
          )}

          {step === 'credentials' && (
            <>
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2" style={{ background: 'rgba(20, 20, 30, 0.95)', color: 'rgba(255, 255, 255, 0.5)' }}>Or</span>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    type="button"
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg transition"
                    style={{ 
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: 'rgba(255, 255, 255, 0.95)'
                    }}
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
                    Continue with Google
                  </button>
                </div>
              </div>

              <p className="mt-6 text-center text-sm" style={{ color: 'rgba(255, 255, 255, 0.75)' }}>
                Don't have an account?{' '}
                <Link href="/auth/register" className="font-semibold" style={{ color: '#00C2FF' }}>
                  Sign up
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

