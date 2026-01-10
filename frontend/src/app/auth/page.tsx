'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authAPI } from '@/lib/api';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

// Matrix Rain Effect Component (optimized version from old register page)
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

type AuthState = 'initial' | 'login' | 'register';

export default function UnifiedAuthPage() {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>('initial');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingEmail, setCheckingEmail] = useState(false);

  // Check if email exists when user continues
  const handleEmailContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    // Validate email on submit
    if (!isValidEmail(email)) {
      validateEmail(email);
      return;
    }

    setEmailError('');
    setCheckingEmail(true);
    setError('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/check-email/${encodeURIComponent(email)}`);
      const data = await response.json();
      
      if (data.exists) {
        setAuthState('login');
      } else {
        setAuthState('register');
      }
    } catch (err) {
      setAuthState('register');
    } finally {
      setCheckingEmail(false);
    }
  };

  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authAPI.login({ email, password });
      if (response.data.user) {
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        if (!response.data.user.onboarding_completed) {
          router.push('/onboarding');
        } else {
          router.push(`/${response.data.user.username}`);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  // Handle register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password on submit
    if (password.length < 8) {
      validatePassword(password);
      return;
    }

    setPasswordError('');
    setLoading(true);
    setError('');

    try {
      const response = await authAPI.register({ email, password, username: '', full_name: '' });
      if (response.data.user) {
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        router.push('/onboarding');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // Handle Google OAuth
  const handleGoogleAuth = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/google`;
  };

  const [passwordError, setPasswordError] = useState('');
  const [emailError, setEmailError] = useState('');

  // Validate email
  const validateEmail = (email: string) => {
    if (email.length > 0 && !email.includes('@')) {
      setEmailError('Please include @ in the email address');
    } else if (email.length > 0 && email.includes('@') && !email.split('@')[1]) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  };

  // Validate password on register
  const validatePassword = (pwd: string) => {
    if (pwd.length > 0 && pwd.length < 8) {
      setPasswordError('Password must be at least 8 characters');
    } else {
      setPasswordError('');
    }
  };

  // Check if email is valid
  const isValidEmail = (email: string) => {
    return email.includes('@') && email.split('@')[1]?.length > 0;
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
        {/* Logo & Header - 4x spacing to card */}
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

          {/* Initial State - Google + Email */}
          {authState === 'initial' && (
            <>
              {/* Title inside card */}
              <div className="text-center mb-8">
                <h1 
                  className="text-3xl font-bold"
                  style={{ color: '#FFFFFF' }}
                >
                  Space to build<br />your life's work
                </h1>
              </div>

              {/* Google Sign In */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                className="w-full py-3 px-4 border border-gray-700 hover:border-gray-600 text-white font-semibold rounded-xl transition flex items-center justify-center gap-3"
                style={{ background: 'rgba(255, 255, 255, 0.05)' }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span>Continue with Google</span>
              </button>

              {/* OR Divider */}
              <div className="my-5 flex items-center gap-3">
                <div 
                  className="flex-1 h-px"
                  style={{ 
                    background: 'linear-gradient(90deg, transparent, rgba(0, 194, 255, 0.3))'
                  }}
                />
                <span 
                  className="px-4 py-1 rounded-full text-xs tracking-widest"
                  style={{ 
                    background: 'rgba(20, 20, 24, 0.9)',
                    color: 'rgba(255, 255, 255, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.06)'
                  }}
                >
                  OR
                </span>
                <div 
                  className="flex-1 h-px"
                  style={{ 
                    background: 'linear-gradient(90deg, rgba(0, 194, 255, 0.3), transparent)'
                  }}
                />
              </div>

              {/* Email Form */}
              <form onSubmit={handleEmailContinue} noValidate>
                <div 
                  className="onboarding-input-wrapper mb-2"
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '12px'
                  }}
                >
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailError(''); // Clear error when typing
                    }}
                    className="w-full px-4 py-3 text-center"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: 'rgba(255, 255, 255, 0.95)'
                    }}
                    autoFocus
                  />
                </div>

                <div 
                  className="overflow-hidden transition-all duration-300 ease-out"
                  style={{ 
                    maxHeight: emailError ? '24px' : '0',
                    opacity: emailError ? 1 : 0,
                    marginBottom: emailError ? '12px' : '16px'
                  }}
                >
                  <p 
                    className="text-[11px] text-center"
                    style={{ color: '#FFB366' }}
                  >
                    {emailError}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={checkingEmail || !email}
                  className="w-full py-3.5 text-white font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(135deg, #00C2FF 0%, #0A84FF 100%)',
                    boxShadow: '0 4px 20px rgba(0, 194, 255, 0.3)'
                  }}
                >
                  {checkingEmail ? 'Checking...' : 'Continue'}
                </button>
              </form>
            </>
          )}

          {/* Login State */}
          {authState === 'login' && (
            <form onSubmit={handleLogin} noValidate>
              {/* Title inside card */}
              <div className="text-center mb-8">
                <h1 
                  className="text-3xl font-bold mb-2"
                  style={{ color: '#FFFFFF' }}
                >
                  Welcome back, Hero!
                </h1>
                <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                  Enter your space to continue.
                </p>
              </div>

              <div 
                className="onboarding-input-wrapper mb-3"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '12px'
                }}
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 text-center"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: 'rgba(255, 255, 255, 0.95)'
                  }}
                  required
                />
              </div>

              <div 
                className="onboarding-input-wrapper mb-4 relative flex items-center"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '12px'
                }}
              >
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-10 text-center"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: 'rgba(255, 255, 255, 0.95)'
                  }}
                  required
                  autoFocus
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

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 text-white font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(135deg, #00C2FF 0%, #0A84FF 100%)',
                  boxShadow: '0 4px 20px rgba(0, 194, 255, 0.3)'
                }}
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>

              <div className="text-center mt-4">
                <Link href="/auth/forgot-password" className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                  Forgot password?
                </Link>
              </div>
            </form>
          )}

          {/* Register State */}
          {authState === 'register' && (
            <form onSubmit={handleRegister} noValidate>
              {/* Title inside card */}
              <div className="text-center mb-8">
                <h1 
                  className="text-3xl font-bold mb-2"
                  style={{ color: '#FFFFFF' }}
                >
                  Ready, Hero?
                </h1>
                <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                  Build your professional home in minutes...
                </p>
              </div>

              <div 
                className="onboarding-input-wrapper mb-3"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '12px'
                }}
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 text-center"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: 'rgba(255, 255, 255, 0.95)'
                  }}
                  required
                />
              </div>

              <div 
                className="onboarding-input-wrapper mb-2 relative flex items-center"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '12px'
                }}
              >
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError(''); // Clear error when typing
                  }}
                  className="w-full px-4 py-3 pr-10 text-center"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: 'rgba(255, 255, 255, 0.95)'
                  }}
                  autoFocus
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

              <div 
                className="overflow-hidden transition-all duration-300 ease-out"
                style={{ 
                  maxHeight: passwordError ? '24px' : '0',
                  opacity: passwordError ? 1 : 0,
                  marginBottom: passwordError ? '12px' : '16px'
                }}
              >
                <p 
                  className="text-[11px] text-center"
                  style={{ color: '#FFB366' }}
                >
                  {passwordError}
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !password}
                className="w-full py-3.5 text-white font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(135deg, #00C2FF 0%, #0A84FF 100%)',
                  boxShadow: '0 4px 20px rgba(0, 194, 255, 0.3)'
                }}
              >
                {loading ? 'Creating...' : 'Register'}
              </button>
            </form>
          )}
        </div>

        {/* Switch auth state links - OUTSIDE card */}
        {authState === 'login' && (
          <p className="mt-5 text-center text-sm" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
            New here?{' '}
            <button 
              type="button"
              onClick={() => setAuthState('register')}
              className="font-semibold transition-colors hover:brightness-110"
              style={{ color: '#00C2FF' }}
            >
              Create Your Space
            </button>
          </p>
        )}
        {authState === 'register' && (
          <p className="mt-5 text-center text-sm" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
            Already have a space?{' '}
            <button 
              type="button"
              onClick={() => setAuthState('login')}
              className="font-semibold transition-colors hover:brightness-110"
              style={{ color: '#00C2FF' }}
            >
              Login
            </button>
          </p>
        )}

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
