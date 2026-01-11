'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { authAPI } from '@/lib/api';
import { useKeyboardScroll } from '@/hooks/useKeyboardScroll';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

// Matrix Rain Effect Component
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

// Floating Orb Component
function FloatingOrb({ 
  size, 
  color, 
  initialX, 
  initialY, 
  duration 
}: { 
  size: number; 
  color: string; 
  initialX: string; 
  initialY: string; 
  duration: number;
}) {
  return (
    <div
      className="absolute rounded-full pointer-events-none floating-orb"
      style={{
        width: size,
        height: size,
        left: initialX,
        top: initialY,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        filter: 'blur(40px)',
        animation: `float ${duration}s ease-in-out infinite`,
        animationDelay: `${Math.random() * duration}s`
      }}
    />
  );
}

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
  
  // Handle mobile keyboard scroll behavior
  useKeyboardScroll();
  
  const [rememberMe, setRememberMe] = useState(() => {
    // Check if user previously opted for remember me
    if (typeof window !== 'undefined') {
      return localStorage.getItem('remember_me') === 'true';
    }
    return false;
  });

  // Pre-fill email if user chose "Remember Me" previously
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('remembered_email');
    if (rememberedEmail && rememberMe) {
      setEmail(rememberedEmail);
    }
  }, []);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authAPI.login({ email, password });
      const data = response.data;

      if (data.requires_2fa && data.temp_token) {
        setTempToken(data.temp_token);
        setStep('2fa');
        toast.success(data.message || 'Please enter your 2FA code');
      } else {
        if (data.access_token && data.refresh_token && data.user) {
          localStorage.setItem('access_token', data.access_token);
          localStorage.setItem('refresh_token', data.refresh_token);
          localStorage.setItem('user', JSON.stringify(data.user));
          
          // Save remember me preference
          if (rememberMe) {
            localStorage.setItem('remember_me', 'true');
            // Store credentials hint for auto-fill (encrypted email only)
            localStorage.setItem('remembered_email', email);
          } else {
            localStorage.removeItem('remember_me');
            localStorage.removeItem('remembered_email');
          }
          
          toast.success('Welcome back!');
          
          if (data.user.onboarding_completed) {
            router.push(`/${data.user.username}`);
          } else {
            router.push('/onboarding');
          }
          
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

      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Save remember me preference for 2FA flow too
      if (rememberMe) {
        localStorage.setItem('remember_me', 'true');
        localStorage.setItem('remembered_email', email);
      } else {
        localStorage.removeItem('remember_me');
        localStorage.removeItem('remembered_email');
      }

      toast.success('Welcome back!');

      if (data.user.onboarding_completed) {
        window.location.href = `/${data.user.username}`;
      } else {
        window.location.href = '/onboarding';
      }
    } catch (error: any) {
      console.error('2FA verification error:', error);
      toast.error(error.response?.data?.detail || 'Invalid 2FA code');
      setTotpCode('');
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

      {/* Floating Orbs */}
      <FloatingOrb size={500} color="rgba(0, 194, 255, 0.08)" initialX="5%" initialY="15%" duration={12} />
      <FloatingOrb size={400} color="rgba(0, 126, 167, 0.06)" initialX="75%" initialY="55%" duration={15} />
      <FloatingOrb size={300} color="rgba(0, 255, 229, 0.05)" initialX="85%" initialY="5%" duration={10} />

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
      <div className="max-w-md w-full relative z-10 animate-fade-in">
        {/* Logo & Header */}
        <div className="text-center">
          {/* Logo + Name as one unit - stays at top */}
          <Link href="/" className="inline-flex flex-col items-center mb-16 relative group">
            <div 
              className="absolute inset-0 rounded-full blur-2xl opacity-60 group-hover:opacity-80 transition-opacity duration-500 logo-glow"
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
            {/* WebSTAR name - tight to logo */}
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
          
        {/* Welcome text + Card - pushed down */}
        <div style={{ marginTop: '1vh' }}>
          <div className="text-center mb-8">
          <h1 
            className="text-3xl font-bold mb-2"
              style={{ color: '#FFFFFF' }}
          >
              {step === 'credentials' ? 'Welcome back, Hero!' : 'Two-Factor Authentication'}
          </h1>
          
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            {step === 'credentials' 
                ? 'Enter your space to continue building.' 
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
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
          }}
        >
          {step === 'credentials' ? (
            <form onSubmit={handleCredentialsSubmit} className="space-y-5">
              <div 
                className="input-wrapper"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid transparent',
                  borderRadius: '12px',
                  transition: 'border-color 0.15s, box-shadow 0.15s'
                }}
              >
                <input
                  id="email"
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: 'rgba(255, 255, 255, 0.95)'
                  }}
                  placeholder="Email or username"
                  autoComplete="username"
                  disabled={loading}
                  onFocus={(e) => {
                    const wrapper = e.currentTarget.parentElement;
                    if (wrapper) {
                      wrapper.style.borderColor = 'rgba(10, 132, 255, 0.5)';
                      wrapper.style.boxShadow = '0 0 0 3px rgba(10, 132, 255, 0.1), 0 0 12px rgba(10, 132, 255, 0.1)';
                    }
                  }}
                  onBlur={(e) => {
                    const wrapper = e.currentTarget.parentElement;
                    if (wrapper) {
                      wrapper.style.borderColor = 'transparent';
                      wrapper.style.boxShadow = 'none';
                    }
                  }}
                />
              </div>

              <div 
                className="input-wrapper relative"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid transparent',
                  borderRadius: '12px',
                  transition: 'border-color 0.15s, box-shadow 0.15s'
                }}
              >
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-10"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: 'rgba(255, 255, 255, 0.95)'
                  }}
                  placeholder="Password"
                  autoComplete="current-password"
                  disabled={loading}
                  onFocus={(e) => {
                    const wrapper = e.currentTarget.parentElement;
                    if (wrapper) {
                      wrapper.style.borderColor = 'rgba(10, 132, 255, 0.5)';
                      wrapper.style.boxShadow = '0 0 0 3px rgba(10, 132, 255, 0.1), 0 0 12px rgba(10, 132, 255, 0.1)';
                    }
                  }}
                  onBlur={(e) => {
                    const wrapper = e.currentTarget.parentElement;
                    if (wrapper) {
                      wrapper.style.borderColor = 'transparent';
                      wrapper.style.boxShadow = 'none';
                    }
                  }}
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

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between">
                <label 
                  className="flex items-center gap-2 cursor-pointer select-none"
                  style={{ color: 'rgba(255, 255, 255, 0.6)' }}
                >
                  <div
                    onClick={() => setRememberMe(!rememberMe)}
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '5px',
                      border: rememberMe ? '1px solid #00C2FF' : '1px solid rgba(255, 255, 255, 0.2)',
                      background: rememberMe ? 'rgba(0, 194, 255, 0.15)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 150ms ease',
                      cursor: 'pointer'
                    }}
                  >
                    {rememberMe && (
                      <svg 
                        width="12" 
                        height="12" 
                        viewBox="0 0 12 12" 
                        fill="none"
                      >
                        <path 
                          d="M2.5 6L5 8.5L9.5 4" 
                          stroke="#00C2FF" 
                          strokeWidth="1.5" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                  <span style={{ fontSize: '13px' }}>Remember me</span>
                </label>
              </div>

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
                  {loading ? 'Verifying...' : 'Verify & Continue'}
                </button>
              </div>
            </form>
          )}

          {step === 'credentials' && (
            <>
              {/* OR Divider - Pill style */}
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

              {/* Google Sign In */}
              <button
                type="button"
                onClick={() => {
                  window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/google`;
                }}
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
                className="mt-5 text-center text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                New here?{' '}
                <Link 
                  href="/auth/register" 
                  className="font-semibold transition-colors hover:brightness-110"
                  style={{ color: 'var(--blue)' }}
                >
                  Create your space
                </Link>
              </p>
            </>
          )}
        </div>

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

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }
          25% {
            transform: translateY(-15px) translateX(8px);
          }
          50% {
            transform: translateY(-8px) translateX(-8px);
          }
          75% {
            transform: translateY(-20px) translateX(4px);
          }
        }
      `}</style>
    </div>
  );
}
