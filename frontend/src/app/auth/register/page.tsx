'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { onboardingAPI, authAPI } from '@/lib/api';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const ARCHETYPES = [
  { id: 'Engineer', name: 'Engineer', icon: '🔧', description: 'Build and create technical solutions' },
  { id: 'Artist', name: 'Artist', icon: '🎨', description: 'Design visual experiences' },
  { id: 'Sound-Maker', name: 'Sound-Maker', icon: '🎵', description: 'Craft audio experiences' },
  { id: 'Communicator', name: 'Communicator', icon: '💬', description: 'Tell stories and connect' },
];

const EXPERTISE_LEVELS = [
  { id: 'emerging', name: 'Emerging Creator', description: 'Just starting your journey' },
  { id: 'developing', name: 'Developing Professional', description: 'Building your portfolio' },
  { id: 'established', name: 'Established Expert', description: 'Proven track record' },
  { id: 'leading', name: 'Leading Authority', description: 'Industry recognized' },
];

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    fullName: '',
    password: '',
    archetype: '',
    role: '',
    expertiseLevel: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleFinalSubmit = async () => {
    if (!formData.archetype || !formData.role || !formData.expertiseLevel) {
      toast.error('Please complete all onboarding steps');
      return;
    }

    setLoading(true);
    try {
      // Complete onboarding (account already created in step 1)
      const response = await onboardingAPI.complete({
        archetype: formData.archetype,
        role: formData.role,
        expertise_level: formData.expertiseLevel,
      });
      
      toast.success(`🎉 Welcome! You earned ${response.data.points_earned} points!`);
      router.push(`/${formData.username}`);
    } catch (error: any) {
      // Handle connection errors more gracefully
      if (error.message?.includes('Backend server is not running') || 
          error.code === 'ERR_NETWORK' || 
          error.code === 'ECONNREFUSED') {
        toast.error('Backend server is not running. Please start the backend server on port 8000.');
      } else {
        toast.error(error.response?.data?.detail || error.message || 'Onboarding failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleBasicInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.email && formData.username && formData.fullName && formData.password) {
      // Check if email already exists before proceeding
      setLoading(true);
      try {
        // Call the register endpoint to check if email/username exists
        await register(formData.email, formData.username, formData.password, formData.fullName);
        // If successful, proceed to next step
        setStep(2);
      } catch (error: any) {
        // Check if error is about email/username already existing
        const errorMessage = error.response?.data?.detail || error.message || '';
        if (errorMessage.toLowerCase().includes('email') && errorMessage.toLowerCase().includes('already')) {
          toast.error('Email already exists. Please use a different email or sign in.');
        } else if (errorMessage.toLowerCase().includes('username') && errorMessage.toLowerCase().includes('taken')) {
          toast.error('Username is already taken. Please choose a different username.');
        } else {
          toast.error(errorMessage || 'Registration failed. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: '#111111' }}>
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-gradient">
            WebStar
          </Link>
          <h2 className="mt-6 text-3xl font-bold" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>Create your account</h2>
        </div>

        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className="h-2 flex-1 max-w-xs rounded-full transition"
                style={{ background: s <= step ? '#00C2FF' : 'rgba(255, 255, 255, 0.1)' }}
              />
            ))}
          </div>
          <p className="text-center mt-4" style={{ color: 'rgba(255, 255, 255, 0.75)' }}>
            Step {step} of 4
          </p>
        </div>

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="glass rounded-2xl shadow-xl p-8 animate-fade-in max-w-md mx-auto">
            <h3 className="text-2xl font-bold text-center mb-6" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>Basic Information</h3>
            <form onSubmit={handleBasicInfoSubmit} className="space-y-5">
              <div>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  className="block w-full px-4 py-3 rounded-xl"
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.05)', 
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'rgba(255, 255, 255, 0.95)'
                  }}
                  placeholder="Full Name"
                  autoFocus
                />
              </div>

              <div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="block w-full px-4 py-3 rounded-xl"
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.05)', 
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'rgba(255, 255, 255, 0.95)'
                  }}
                  placeholder="Username"
                />
                <p className="mt-2 text-xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Your unique URL: webstar.com/{formData.username || 'username'}</p>
              </div>

              <div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full px-4 py-3 rounded-xl"
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.05)', 
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'rgba(255, 255, 255, 0.95)'
                  }}
                  placeholder="Email"
                />
              </div>

              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full px-4 py-3 pr-10 rounded-xl"
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.05)', 
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'rgba(255, 255, 255, 0.95)'
                  }}
                  placeholder="Password"
                  minLength={8}
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

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-primary text-white font-semibold rounded-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Checking...' : 'Continue'}
              </button>
            </form>

            {/* Divider */}
            <div className="my-6 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 py-1 rounded-full" style={{ background: '#111111', color: 'rgba(255, 255, 255, 0.5)', letterSpacing: '0.5px' }}>
                  OR CONTINUE WITH
                </span>
              </div>
            </div>

            {/* Google Sign Up Button */}
            <button
              type="button"
              onClick={() => {
                window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/google`;
              }}
              className="w-full py-3 px-4 border border-gray-700 hover:border-gray-600 text-white font-semibold rounded-lg transition flex items-center justify-center gap-3"
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

            <p className="mt-6 text-center text-sm" style={{ color: 'rgba(255, 255, 255, 0.75)' }}>
              Already have an account?{' '}
              <Link href="/auth/login" className="font-semibold" style={{ color: '#00C2FF' }}>
                Sign in
              </Link>
            </p>
          </div>
        )}

        {/* Step 2: Archetype */}
        {step === 2 && (
          <div className="glass rounded-2xl shadow-xl p-8 animate-fade-in">
            <button
              onClick={() => setStep(1)}
              className="mb-6 flex items-center gap-2"
              style={{ color: '#00C2FF' }}
            >
              ← Back
            </button>

            <h2 className="text-3xl font-bold text-center mb-12" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>Choose Your Archetype</h2>

            <div className="grid md:grid-cols-2 gap-6">
              {ARCHETYPES.map((archetype) => (
                <button
                  key={archetype.id}
                  onClick={() => {
                    setFormData((prev) => ({ ...prev, archetype: archetype.id }));
                    setTimeout(() => setStep(3), 300);
                  }}
                  className="p-8 border-2 rounded-xl transition transform hover:scale-105 hover:shadow-lg"
                  style={{
                    borderColor: formData.archetype === archetype.id ? '#00C2FF' : 'rgba(255, 255, 255, 0.1)',
                    background: formData.archetype === archetype.id ? 'rgba(0, 194, 255, 0.1)' : 'rgba(255, 255, 255, 0.02)'
                  }}
                >
                  <div className="text-6xl mb-4">{archetype.icon}</div>
                  <h3 className="text-xl font-semibold mb-2" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>{archetype.name}</h3>
                  <p style={{ color: 'rgba(255, 255, 255, 0.75)' }}>{archetype.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Role */}
        {step === 3 && (
          <div className="glass rounded-2xl shadow-xl p-8 animate-fade-in">
            <button
              onClick={() => setStep(2)}
              className="mb-6 flex items-center gap-2"
              style={{ color: '#00C2FF' }}
            >
              ← Back
            </button>

            <h2 className="text-3xl font-bold text-center mb-8" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>What's Your Role?</h2>

            <div className="max-w-md mx-auto">
              <input
                type="text"
                placeholder="e.g., Product Designer, Music Producer, Software Engineer..."
                value={formData.role}
                onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
                className="w-full px-6 py-4 text-lg border-2 rounded-xl"
                style={{ 
                  background: 'rgba(255, 255, 255, 0.05)', 
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'rgba(255, 255, 255, 0.95)'
                }}
                autoFocus
              />

              <div className="mt-8">
                <p className="text-sm mb-4" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Popular roles:</p>
                <div className="flex flex-wrap gap-2">
                  {['Product Designer', 'Software Engineer', 'Music Producer', 'Content Creator', 'Photographer', 'Video Editor'].map(
                    (role) => (
                      <button
                        key={role}
                        onClick={() => setFormData((prev) => ({ ...prev, role }))}
                        className="px-4 py-2 rounded-lg transition text-sm"
                        style={{ 
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: 'rgba(255, 255, 255, 0.95)'
                        }}
                      >
                        {role}
                      </button>
                    )
                  )}
                </div>
              </div>

              <button
                onClick={() => formData.role && setStep(4)}
                disabled={!formData.role}
                className="mt-12 w-full py-4 bg-gradient-primary text-white font-semibold rounded-xl hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Expertise Level */}
        {step === 4 && (
          <div className="glass rounded-2xl shadow-xl p-8 animate-fade-in">
            <button
              onClick={() => setStep(3)}
              className="mb-6 flex items-center gap-2"
              style={{ color: '#00C2FF' }}
            >
              ← Back
            </button>

            <div className="max-w-2xl mx-auto">
              {/* Current Level Display */}
              <div className="mb-12 text-center">
                <p className="text-lg mb-3" style={{ color: 'rgba(255, 255, 255, 0.75)' }}>
                  Your expertise level is:
                </p>
                <h3 className="text-3xl font-bold" style={{ color: '#00C2FF' }}>
                  {EXPERTISE_LEVELS[
                    formData.expertiseLevel 
                      ? EXPERTISE_LEVELS.findIndex(l => l.id === formData.expertiseLevel)
                      : 1
                  ]?.name || EXPERTISE_LEVELS[1].name}
                </h3>
              </div>

              {/* Slider */}
              <div className="px-4">
                <input
                  type="range"
                  min="0"
                  max="99"
                  value={
                    formData.expertiseLevel 
                      ? EXPERTISE_LEVELS.findIndex(l => l.id === formData.expertiseLevel) * 33
                      : 33
                  }
                  onChange={(e) => {
                    const sliderValue = parseInt(e.target.value);
                    // Map 100 positions (0-99) to 4 categories
                    let index;
                    if (sliderValue < 25) {
                      index = 0; // emerging
                    } else if (sliderValue < 50) {
                      index = 1; // developing
                    } else if (sliderValue < 75) {
                      index = 2; // established
                    } else {
                      index = 3; // leading
                    }
                    setFormData((prev) => ({ 
                      ...prev, 
                      expertiseLevel: EXPERTISE_LEVELS[index].id 
                    }));
                  }}
                  onMouseUp={() => {
                    // Set default value on first interaction if not set
                    if (!formData.expertiseLevel) {
                      setFormData((prev) => ({ 
                        ...prev, 
                        expertiseLevel: EXPERTISE_LEVELS[1].id 
                      }));
                    }
                  }}
                  className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb"
                  style={{
                    background: `linear-gradient(to right, #0ea5e9 0%, #0ea5e9 ${
                      ((formData.expertiseLevel 
                        ? EXPERTISE_LEVELS.findIndex(l => l.id === formData.expertiseLevel)
                        : 1) / 3) * 100
                    }%, #e5e7eb ${
                      ((formData.expertiseLevel 
                        ? EXPERTISE_LEVELS.findIndex(l => l.id === formData.expertiseLevel)
                        : 1) / 3) * 100
                    }%, #e5e7eb 100%)`
                  }}
                />
                
                {/* Level Labels */}
                <div className="flex justify-between mt-4 px-1">
                  {EXPERTISE_LEVELS.map((level, index) => (
                    <button
                      key={level.id}
                      onClick={() => setFormData((prev) => ({ ...prev, expertiseLevel: level.id }))}
                      className="text-xs font-medium transition cursor-pointer"
                      style={{ 
                        width: '22%', 
                        textAlign: 'center',
                        color: formData.expertiseLevel === level.id ? '#00C2FF' : 'rgba(255, 255, 255, 0.5)',
                        fontWeight: formData.expertiseLevel === level.id ? 'bold' : 'normal'
                      }}
                    >
                      {level.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Complete Button */}
              <div className="mt-12">
                <button
                  onClick={handleFinalSubmit}
                  disabled={!formData.expertiseLevel || loading}
                  className="w-full py-4 bg-gradient-to-r from-primary-600 to-accent-600 text-white text-lg font-semibold rounded-xl hover:shadow-2xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating your account...' : '🚀 Create My Account'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

