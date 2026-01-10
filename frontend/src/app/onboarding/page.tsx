'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onboardingAPI } from '@/lib/api';

// Matrix Rain for Finale
const MatrixRain = () => {
  useEffect(() => {
    const canvas = document.getElementById('finale-matrix') as HTMLCanvasElement;
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

  return <canvas id="finale-matrix" className="absolute inset-0 pointer-events-none" />;
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

// Archetype data
const ARCHETYPES = [
  { id: 'engineer', icon: '🔧', label: 'Engineer' },
  { id: 'artist', icon: '🎨', label: 'Artist' },
  { id: 'sound', icon: '🎵', label: 'Sound' },
  { id: 'communicator', icon: '💬', label: 'Communicator' },
];

const POPULAR_ROLES = [
  'Product Designer', 'Software Engineer', 'Music Producer', 
  'Content Creator', 'Brand Strategist', 'Creative Director'
];

const EXPERTISE_LABELS = ['Emerging', 'Developing', 'Established'];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    archetype: '',
    role: '',
    expertise: 1,
    location: '',
    username: ''
  });
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [showFinale, setShowFinale] = useState(false);
  const [finaleProgress, setFinaleProgress] = useState(0);
  const [finaleSteps, setFinaleSteps] = useState<string[]>([]);
  const [error, setError] = useState('');

  // Check username availability
  useEffect(() => {
    if (!formData.username || formData.username.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingUsername(true);
      try {
        const response = await onboardingAPI.checkUsernameAvailability(formData.username);
        setUsernameAvailable(response.available);
      } catch {
        setUsernameAvailable(null);
      } finally {
        setCheckingUsername(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.username]);

  // Handle finale animation
  const startFinale = async () => {
    setShowFinale(true);
    
    const steps = [
      '⚡ Building your studio',
      '🎨 Loading your portfolio',
      '🔧 Configuring your tools',
      '⭐ Preparing your star'
    ];

    for (let i = 0; i <= 100; i += 2) {
      await new Promise(r => setTimeout(r, 50));
      setFinaleProgress(i);
      
      if (i === 20) setFinaleSteps([steps[0]]);
      if (i === 45) setFinaleSteps([steps[0], steps[1]]);
      if (i === 70) setFinaleSteps([steps[0], steps[1], steps[2]]);
      if (i === 90) setFinaleSteps([steps[0], steps[1], steps[2], steps[3]]);
    }

    // Complete onboarding
    try {
      // Map archetype IDs to backend values
      const archetypeMap: Record<string, string> = {
        'engineer': 'Engineer',
        'artist': 'Artist',
        'sound': 'Sound-Maker',
        'communicator': 'Communicator'
      };

      // Map expertise index to label
      const expertiseLabel = EXPERTISE_LABELS[formData.expertise];

      // Validate mapped values
      if (!archetypeMap[formData.archetype]) {
        throw new Error(`Invalid archetype: ${formData.archetype}`);
      }

      await onboardingAPI.complete({
        archetype: archetypeMap[formData.archetype],
        role: formData.role,
        expertise_level: expertiseLabel,
        username: formData.username || undefined,
        full_name: formData.fullName || undefined,
        location: formData.location || undefined
      });

      // Update local storage
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      user.full_name = formData.fullName;
      user.username = formData.username;
      user.onboarding_completed = true;
      localStorage.setItem('user', JSON.stringify(user));

      await new Promise(r => setTimeout(r, 500));
      router.push(`/${formData.username}`);
    } catch (err: any) {
      console.error('Failed to complete onboarding:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to complete onboarding. Please try again.';
      setError(errorMessage);
      // Don't hide finale screen immediately - let user see the error and go back
    }
  };

  // Calculate inverse progress (bar gets smaller)
  const getProgressWidth = () => {
    const progress = ((6 - step + 1) / 6) * 100;
    return `${progress}%`;
  };

  // Profile Preview Component
  const ProfilePreview = () => (
    <div 
      className="rounded-2xl p-4 mb-6"
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.05)'
      }}
    >
      <div className="flex items-center gap-3">
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
          style={{ background: 'rgba(255, 255, 255, 0.05)' }}
        >
          {formData.archetype ? ARCHETYPES.find(a => a.id === formData.archetype)?.icon : '👤'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
            {formData.fullName || 'Your Name'}
          </p>
          <p className="text-sm truncate" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
            @{formData.username || 'username'}
          </p>
          {formData.role && (
            <p className="text-xs mt-1 truncate" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              {formData.role}
            </p>
          )}
        </div>
      </div>
      {formData.location && (
        <p className="text-xs mt-3 flex items-center gap-1" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
          📍 {formData.location}
        </p>
      )}
      {step > 4 && (
        <div className="mt-3">
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.1)' }}>
            <div 
              className="h-full rounded-full transition-all"
              style={{ 
                width: `${(formData.expertise / 2) * 100}%`,
                background: 'linear-gradient(90deg, #00C2FF, #0088CC)'
              }}
            />
          </div>
          <p className="text-xs mt-1" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
            {EXPERTISE_LABELS[formData.expertise]}
          </p>
        </div>
      )}
    </div>
  );

  // Finale Screen
  if (showFinale) {
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden"
        style={{ background: '#0B0B0C' }}
      >
        <MatrixRain />
        
        <div className="relative z-10 text-center max-w-md">
          <div 
            className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #00C2FF 0%, #0088CC 100%)',
              boxShadow: '0 4px 30px rgba(0, 194, 255, 0.4)'
            }}
          >
            <span className="text-3xl">⭐</span>
          </div>
          
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
            WebSTAR
          </h1>
          <p className="text-lg mb-8" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
            Setting up your space...
          </p>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 rounded-xl text-sm text-center"
              style={{ 
                background: 'rgba(255, 69, 58, 0.1)', 
                color: '#FF453A',
                border: '1px solid rgba(255, 69, 58, 0.3)'
              }}
            >
              {error}
              <button
                onClick={() => {
                  setError('');
                  setShowFinale(false);
                  setFinaleProgress(0);
                  setFinaleSteps([]);
                  setStep(6); // Go back to username step
                }}
                className="mt-3 block w-full py-2 px-4 rounded-lg text-sm font-medium transition hover:opacity-80"
                style={{
                  background: 'rgba(255, 69, 58, 0.2)',
                  color: '#FF453A',
                  border: '1px solid rgba(255, 69, 58, 0.4)'
                }}
              >
                Go Back to Fix
              </button>
            </div>
          )}

          {/* Progress Bar */}
          {!error && (
            <div className="mb-8">
              <div 
                className="h-2 rounded-full overflow-hidden"
                style={{ background: 'rgba(255, 255, 255, 0.1)' }}
              >
                <div 
                  className="h-full rounded-full transition-all duration-100"
                  style={{ 
                    width: `${finaleProgress}%`,
                    background: 'linear-gradient(90deg, #00C2FF, #0088CC)'
                  }}
                />
              </div>
              <p className="text-sm mt-2" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                {finaleProgress}%
              </p>
            </div>
          )}

          {/* Steps */}
          {!error && (
            <div className="space-y-2 text-left">
              {finaleSteps.map((s, i) => (
                <div 
                  key={i}
                  className="flex items-center gap-2 text-sm animate-fade-in"
                  style={{ color: 'rgba(255, 255, 255, 0.7)' }}
                >
                  {s}
                  <span style={{ color: '#30D158' }}>✓</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex flex-col items-center px-4 py-8 relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at center, #0B0B0C 0%, #050506 100%)' }}
    >
      <FloatingOrbs />

      {/* Progress Bar - Inverse (gets smaller) */}
      <div className="w-full max-w-md mb-8 relative z-10">
        <div 
          className="h-2 rounded-full overflow-hidden"
          style={{ background: 'rgba(255, 255, 255, 0.1)' }}
        >
          <div 
            className="h-full rounded-full transition-all duration-500"
            style={{ 
              width: getProgressWidth(),
              background: 'linear-gradient(90deg, #00C2FF, #0088CC)'
            }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-md relative z-10 flex-1">
        {/* Profile Preview */}
        <ProfilePreview />

        {/* Step Content */}
        <div 
          className="rounded-2xl p-6"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}
        >
          {/* Error Display */}
          {error && !showFinale && (
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
          
          {/* Step 1: Name */}
          {step === 1 && (
            <>
              <div className="text-center mb-6">
                <span className="text-4xl mb-4 block">👋</span>
                <h2 className="text-xl font-bold mb-1" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
                  Let's start with you.
                </h2>
                <p style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                  What should we call you?
                </p>
              </div>

              <div 
                className="onboarding-input-wrapper mb-4"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '12px'
                }}
              >
                <input
                  type="text"
                  placeholder="Your name"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  className="w-full px-5 py-4 text-lg"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: 'rgba(255, 255, 255, 0.95)'
                  }}
                  autoFocus
                />
              </div>

              <p className="text-xs mb-6 text-center" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                This appears on your profile.
              </p>

              <button
                onClick={() => formData.fullName && setStep(2)}
                disabled={!formData.fullName}
                className="w-full py-4 font-semibold rounded-xl transition disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #00C2FF 0%, #0099CC 100%)',
                  color: '#FFF',
                  border: 'none'
                }}
              >
                Continue
              </button>
            </>
          )}

          {/* Step 2: Archetype */}
          {step === 2 && (
            <>
              <button
                onClick={() => setStep(1)}
                className="text-sm mb-4 flex items-center gap-1"
                style={{ color: 'rgba(255, 255, 255, 0.5)' }}
              >
                ← Back
              </button>

              <div className="text-center mb-6">
                <h2 className="text-xl font-bold" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
                  Pick your vibe.
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {ARCHETYPES.map(arch => (
                  <button
                    key={arch.id}
                    onClick={() => {
                      setFormData(prev => ({ ...prev, archetype: arch.id }));
                      setTimeout(() => setStep(3), 300);
                    }}
                    className="p-4 rounded-xl transition"
                    style={{
                      background: formData.archetype === arch.id 
                        ? 'rgba(0, 194, 255, 0.15)' 
                        : 'rgba(255, 255, 255, 0.02)',
                      border: formData.archetype === arch.id 
                        ? '1px solid rgba(0, 194, 255, 0.3)' 
                        : '1px solid rgba(255, 255, 255, 0.05)'
                    }}
                  >
                    <span className="text-3xl block mb-2">{arch.icon}</span>
                    <span className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                      {arch.label}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Step 3: Role */}
          {step === 3 && (
            <>
              <button
                onClick={() => setStep(2)}
                className="text-sm mb-4 flex items-center gap-1"
                style={{ color: 'rgba(255, 255, 255, 0.5)' }}
              >
                ← Back
              </button>

              <div className="text-center mb-6">
                <h2 className="text-xl font-bold" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
                  What do you do?
                </h2>
              </div>

              <div 
                className="onboarding-input-wrapper mb-4"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '12px'
                }}
              >
                <input
                  type="text"
                  placeholder="e.g., Product Designer"
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-5 py-4 text-lg"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: 'rgba(255, 255, 255, 0.95)'
                  }}
                  autoFocus
                />
              </div>

              <div className="mb-6">
                <p className="text-xs mb-3" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                  Suggestions:
                </p>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_ROLES.map(role => (
                    <button
                      key={role}
                      onClick={() => setFormData(prev => ({ ...prev, role }))}
                      className="px-3 py-1.5 text-xs rounded-lg transition"
                      style={{
                        background: formData.role === role 
                          ? 'rgba(0, 194, 255, 0.2)' 
                          : 'rgba(255, 255, 255, 0.05)',
                        color: 'rgba(255, 255, 255, 0.7)'
                      }}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => formData.role && setStep(4)}
                disabled={!formData.role}
                className="w-full py-4 font-semibold rounded-xl transition disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #00C2FF 0%, #0099CC 100%)',
                  color: '#FFF',
                  border: 'none'
                }}
              >
                Continue
              </button>
            </>
          )}

          {/* Step 4: Expertise */}
          {step === 4 && (
            <>
              <button
                onClick={() => setStep(3)}
                className="text-sm mb-4 flex items-center gap-1"
                style={{ color: 'rgba(255, 255, 255, 0.5)' }}
              >
                ← Back
              </button>

              <div className="text-center mb-6">
                <h2 className="text-xl font-bold mb-1" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
                  How seasoned are you?
                </h2>
                <p className="text-lg" style={{ color: '#00C2FF' }}>
                  {EXPERTISE_LABELS[formData.expertise]}
                </p>
              </div>

              <div className="mb-6 px-4">
                <input
                  type="range"
                  min="0"
                  max="2"
                  value={formData.expertise}
                  onChange={(e) => setFormData(prev => ({ ...prev, expertise: parseInt(e.target.value) }))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #00C2FF ${(formData.expertise / 2) * 100}%, rgba(255,255,255,0.1) ${(formData.expertise / 2) * 100}%)`
                  }}
                />
                <div className="flex justify-between mt-2">
                  {EXPERTISE_LABELS.map(label => (
                    <span key={label} className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              <p className="text-xs mb-6 text-center" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                Shows as a bar on your profile.
              </p>

              <button
                onClick={() => setStep(5)}
                className="w-full py-4 font-semibold rounded-xl transition"
                style={{
                  background: 'linear-gradient(135deg, #00C2FF 0%, #0099CC 100%)',
                  color: '#FFF',
                  border: 'none'
                }}
              >
                Continue
              </button>
            </>
          )}

          {/* Step 5: Location */}
          {step === 5 && (
            <>
              <button
                onClick={() => setStep(4)}
                className="text-sm mb-4 flex items-center gap-1"
                style={{ color: 'rgba(255, 255, 255, 0.5)' }}
              >
                ← Back
              </button>

              <div className="text-center mb-6">
                <span className="text-4xl mb-4 block">📍</span>
                <h2 className="text-xl font-bold" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
                  Where are you based?
                </h2>
              </div>

              <div 
                className="onboarding-input-wrapper mb-4"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '12px'
                }}
              >
                <input
                  type="text"
                  placeholder="e.g., Brooklyn, NY"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-5 py-4 text-lg"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: 'rgba(255, 255, 255, 0.95)'
                  }}
                  autoFocus
                />
              </div>

              <p className="text-xs mb-6 text-center" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                Optional. Helps people find you.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(6)}
                  className="flex-1 py-4 font-medium rounded-xl transition"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: 'rgba(255, 255, 255, 0.7)',
                    border: 'none'
                  }}
                >
                  Skip
                </button>
                <button
                  onClick={() => setStep(6)}
                  className="flex-1 py-4 font-semibold rounded-xl transition"
                  style={{
                    background: 'linear-gradient(135deg, #00C2FF 0%, #0099CC 100%)',
                    color: '#FFF',
                    border: 'none'
                  }}
                >
                  Continue
                </button>
              </div>
            </>
          )}

          {/* Step 6: Username */}
          {step === 6 && (
            <>
              <button
                onClick={() => setStep(5)}
                className="text-sm mb-4 flex items-center gap-1"
                style={{ color: 'rgba(255, 255, 255, 0.5)' }}
              >
                ← Back
              </button>

              <div className="text-center mb-6">
                <h2 className="text-xl font-bold mb-1" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
                  Claim your URL.
                </h2>
                <p style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                  Last step. Your space, your link.
                </p>
              </div>

              <div 
                className="onboarding-input-wrapper mb-2 flex items-center overflow-hidden"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '12px'
                }}
              >
                <span 
                  className="px-4 py-4 text-sm"
                  style={{ 
                    color: 'rgba(255, 255, 255, 0.4)',
                    borderRight: '1px solid rgba(255, 255, 255, 0.05)'
                  }}
                >
                  webstar.com/
                </span>
                <input
                  type="text"
                  placeholder="username"
                  value={formData.username}
                  onChange={(e) => {
                    const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                    setFormData(prev => ({ ...prev, username: value }));
                  }}
                  className="flex-1 px-4 py-4"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: 'rgba(255, 255, 255, 0.95)'
                  }}
                  autoFocus
                />
                {checkingUsername && (
                  <div className="px-4">
                    <div 
                      className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                      style={{ borderColor: '#00C2FF', borderTopColor: 'transparent' }}
                    />
                  </div>
                )}
                {!checkingUsername && usernameAvailable === true && (
                  <div className="px-4">
                    <svg className="w-5 h-5" fill="#30D158" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                {!checkingUsername && usernameAvailable === false && (
                  <div className="px-4">
                    <svg className="w-5 h-5" fill="#FF453A" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>

              {usernameAvailable === true && (
                <p className="text-xs mb-4" style={{ color: '#30D158' }}>
                  ✓ Available
                </p>
              )}
              {usernameAvailable === false && (
                <p className="text-xs mb-4" style={{ color: '#FF453A' }}>
                  ✗ Already taken
                </p>
              )}
              {usernameAvailable === null && formData.username && (
                <p className="text-xs mb-4" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                  &nbsp;
                </p>
              )}

              <button
                onClick={startFinale}
                disabled={!usernameAvailable || loading}
                className="w-full py-4 font-semibold rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #00C2FF 0%, #0099CC 100%)',
                  color: '#FFF',
                  border: 'none'
                }}
              >
                🚀 Launch Your Space
              </button>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(30px, -30px); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #00C2FF;
          cursor: pointer;
          border: 2px solid #FFF;
          box-shadow: 0 2px 8px rgba(0, 194, 255, 0.4);
        }
        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #00C2FF;
          cursor: pointer;
          border: 2px solid #FFF;
          box-shadow: 0 2px 8px rgba(0, 194, 255, 0.4);
        }
      `}</style>
    </div>
  );
}
