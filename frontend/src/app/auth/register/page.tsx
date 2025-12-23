'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { onboardingAPI } from '@/lib/api';
import Link from 'next/link';
import toast from 'react-hot-toast';

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

  const handleFinalSubmit = async () => {
    if (!formData.archetype || !formData.role || !formData.expertiseLevel) {
      toast.error('Please complete all onboarding steps');
      return;
    }

    setLoading(true);
    try {
      // First, create the account
      await register(formData.email, formData.username, formData.password, formData.fullName);
      
      // Then complete onboarding
      const response = await onboardingAPI.complete({
        archetype: formData.archetype,
        role: formData.role,
        expertise_level: formData.expertiseLevel,
      });
      
      toast.success(`🎉 Welcome! You earned ${response.data.points_earned} points!`);
      router.push(`/${formData.username}`);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Registration failed');
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

  const handleBasicInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.email && formData.username && formData.fullName && formData.password) {
      setStep(2);
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
          <p className="mt-2" style={{ color: 'rgba(255, 255, 255, 0.75)' }}>Complete your profile to join WebStar</p>
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
                <label htmlFor="fullName" className="block text-sm font-medium" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
                  Full Name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-3 rounded-lg"
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.05)', 
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'rgba(255, 255, 255, 0.95)'
                  }}
                  placeholder="John Doe"
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="username" className="block text-sm font-medium" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-3 rounded-lg"
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.05)', 
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'rgba(255, 255, 255, 0.95)'
                  }}
                  placeholder="johndoe"
                />
                <p className="mt-1 text-xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Your unique URL: webstar.com/{formData.username || 'username'}</p>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
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
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-3 rounded-lg"
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.05)', 
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'rgba(255, 255, 255, 0.95)'
                  }}
                  placeholder="••••••••"
                  minLength={8}
                />
                <p className="mt-1 text-xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Minimum 8 characters</p>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-gradient-primary text-white font-semibold rounded-lg hover:shadow-lg transition"
              >
                Continue
              </button>
            </form>

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

            <h2 className="text-3xl font-bold text-center mb-4" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>Choose Your Archetype</h2>
            <p className="text-center mb-12" style={{ color: 'rgba(255, 255, 255, 0.75)' }}>
              How do you create? This helps us personalize your experience.
            </p>

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

            <h2 className="text-3xl font-bold text-center mb-4" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>What's Your Role?</h2>
            <p className="text-center mb-8" style={{ color: 'rgba(255, 255, 255, 0.75)' }}>
              Define your professional identity. This appears on your profile.
            </p>

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

            <h2 className="text-3xl font-bold text-center mb-4" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>Your Expertise Level</h2>
            <p className="text-center mb-8" style={{ color: 'rgba(255, 255, 255, 0.75)' }}>
              Where are you in your professional journey?
            </p>

            <div className="max-w-2xl mx-auto">
              {/* Current Level Display */}
              <div className="mb-12 p-6 rounded-xl border-2" style={{ 
                background: 'linear-gradient(135deg, rgba(0, 194, 255, 0.15) 0%, rgba(0, 122, 255, 0.15) 100%)',
                borderColor: 'rgba(0, 194, 255, 0.3)'
              }}>
                <h3 className="text-2xl font-bold text-center mb-2" style={{ color: '#00C2FF' }}>
                  {EXPERTISE_LEVELS[
                    formData.expertiseLevel 
                      ? EXPERTISE_LEVELS.findIndex(l => l.id === formData.expertiseLevel)
                      : 0
                  ]?.name || EXPERTISE_LEVELS[0].name}
                </h3>
                <p className="text-center" style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                  {EXPERTISE_LEVELS[
                    formData.expertiseLevel 
                      ? EXPERTISE_LEVELS.findIndex(l => l.id === formData.expertiseLevel)
                      : 0
                  ]?.description || EXPERTISE_LEVELS[0].description}
                </p>
              </div>

              {/* Slider */}
              <div className="px-4">
                <input
                  type="range"
                  min="0"
                  max="3"
                  value={
                    formData.expertiseLevel 
                      ? EXPERTISE_LEVELS.findIndex(l => l.id === formData.expertiseLevel)
                      : 0
                  }
                  onChange={(e) => {
                    const index = parseInt(e.target.value);
                    setFormData((prev) => ({ 
                      ...prev, 
                      expertiseLevel: EXPERTISE_LEVELS[index].id 
                    }));
                  }}
                  className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb"
                  style={{
                    background: `linear-gradient(to right, #0ea5e9 0%, #0ea5e9 ${
                      ((formData.expertiseLevel 
                        ? EXPERTISE_LEVELS.findIndex(l => l.id === formData.expertiseLevel)
                        : 0) / 3) * 100
                    }%, #e5e7eb ${
                      ((formData.expertiseLevel 
                        ? EXPERTISE_LEVELS.findIndex(l => l.id === formData.expertiseLevel)
                        : 0) / 3) * 100
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

