'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { onboardingAPI } from '@/lib/api';
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

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Raw slider value (0-99) for smooth dragging
  const [sliderValue, setSliderValue] = useState(33);
  
  const [formData, setFormData] = useState({
    archetype: '',
    role: '',
    expertiseLevel: '',
    location: '',
    bio: '',
  });

  useEffect(() => {
    if (!user) {
      router.push('/auth/register');
      return;
    }

    if (user.onboarding_completed) {
      router.push(`/${user.username}`);
      return;
    }

    // If user exists but hasn't completed onboarding, show the page
  }, [user, router]);

  // Map slider value to expertise level
  const getExpertiseLevelFromSlider = (value: number): string => {
    if (value < 25) return 'emerging';
    if (value < 50) return 'developing';
    if (value < 75) return 'established';
    return 'leading';
  };

  // Get the current expertise level based on slider
  const currentExpertiseLevel = formData.expertiseLevel || getExpertiseLevelFromSlider(sliderValue);
  const currentExpertiseIndex = EXPERTISE_LEVELS.findIndex(l => l.id === currentExpertiseLevel);

  const handleComplete = async () => {
    if (!formData.archetype || !formData.role || !currentExpertiseLevel) {
      toast.error('Please complete all steps');
      return;
    }

    setLoading(true);
    try {
      const response = await onboardingAPI.complete({
        archetype: formData.archetype,
        role: formData.role,
        expertise_level: currentExpertiseLevel,
        location: formData.location || undefined,
        bio: formData.bio || undefined,
      });
      
      toast.success(`🎉 Welcome! You earned ${response.data.points_earned} points!`);
      
      // Get the LATEST user data from localStorage (setup-profile may have updated username)
      // This is critical because the React state might have stale temp username
      const freshUserData = localStorage.getItem('user');
      const freshUser = freshUserData ? JSON.parse(freshUserData) : null;
      const currentUsername = freshUser?.username || user?.username;
      
      // Update user's onboarding status with FRESH data (not stale React state)
      if (freshUser) {
        const updatedUser = { ...freshUser, onboarding_completed: true };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      
      // Use the correct (updated) username for redirect
      window.location.href = `/${currentUsername}`;
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: '#111111' }}>
      <div className="max-w-4xl w-full">
        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className="h-2 flex-1 rounded-full transition"
                style={{ background: s <= step ? '#00C2FF' : 'rgba(255, 255, 255, 0.1)' }}
              />
            ))}
          </div>
          <p className="text-center mt-4" style={{ color: 'rgba(255, 255, 255, 0.75)' }}>
            Step {step} of 4
          </p>
        </div>

        {/* Step 1: Archetype */}
        {step === 1 && (
          <div className="glass rounded-2xl shadow-xl p-8 animate-fade-in">
            <h2 className="text-3xl font-bold text-center mb-12" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>Choose Your Archetype</h2>

            <div className="grid md:grid-cols-2 gap-6">
              {ARCHETYPES.map((archetype) => (
                <button
                  key={archetype.id}
                  onClick={() => {
                    setFormData((prev) => ({ ...prev, archetype: archetype.id }));
                    setTimeout(() => setStep(2), 300);
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

        {/* Step 2: Role */}
        {step === 2 && (
          <div className="glass rounded-2xl shadow-xl p-8 animate-fade-in">
            <button
              onClick={() => setStep(1)}
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
                onClick={() => formData.role && setStep(3)}
                disabled={!formData.role}
                className="mt-12 w-full py-4 bg-gradient-primary text-white font-semibold rounded-xl hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Expertise Level */}
        {step === 3 && (
          <div className="glass rounded-2xl shadow-xl p-8 animate-fade-in">
            <button
              onClick={() => setStep(2)}
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
                  {EXPERTISE_LEVELS[currentExpertiseIndex]?.name || EXPERTISE_LEVELS[1].name}
                </h3>
              </div>

              {/* Slider - 100 parts for fine-grained control, fully flexible */}
              <div className="px-4">
                <input
                  type="range"
                  min="0"
                  max="99"
                  value={sliderValue}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    setSliderValue(value);
                    // Also update the expertise level based on the value
                    setFormData((prev) => ({ 
                      ...prev, 
                      expertiseLevel: getExpertiseLevelFromSlider(value)
                    }));
                  }}
                  className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb"
                  style={{
                    background: `linear-gradient(to right, #0ea5e9 0%, #0ea5e9 ${sliderValue + 1}%, #e5e7eb ${sliderValue + 1}%, #e5e7eb 100%)`
                  }}
                />
                
                {/* Level Labels */}
                <div className="flex justify-between mt-4 px-1">
                  {EXPERTISE_LEVELS.map((level, index) => (
                    <button
                      key={level.id}
                      onClick={() => {
                        // Set slider to middle of the level's range
                        const newValue = index * 25 + 12;
                        setSliderValue(Math.min(newValue, 99));
                        setFormData((prev) => ({ ...prev, expertiseLevel: level.id }));
                      }}
                      className="text-xs font-medium transition cursor-pointer"
                      style={{ 
                        width: '22%', 
                        textAlign: 'center',
                        color: currentExpertiseLevel === level.id ? '#00C2FF' : 'rgba(255, 255, 255, 0.5)',
                        fontWeight: currentExpertiseLevel === level.id ? 'bold' : 'normal'
                      }}
                    >
                      {level.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Continue Button */}
              <div className="mt-12">
                <button
                  onClick={() => {
                    if (!formData.expertiseLevel) {
                      setFormData((prev) => ({ ...prev, expertiseLevel: getExpertiseLevelFromSlider(sliderValue) }));
                    }
                    setStep(4);
                  }}
                  className="w-full py-4 bg-gradient-to-r from-primary-600 to-accent-600 text-white text-lg font-semibold rounded-xl hover:shadow-2xl transition"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Location & Profile Preview */}
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
              {/* Profile Preview Card */}
              <div 
                className="mb-8 p-6 rounded-2xl text-center"
                style={{ 
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}
              >
                {/* Profile Picture */}
                <div 
                  className="w-24 h-24 mx-auto rounded-full mb-4 flex items-center justify-center"
                  style={{ 
                    background: 'linear-gradient(145deg, #2D2D2D, #1A1A1A)',
                    border: '2px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <span className="text-4xl">
                    {ARCHETYPES.find(a => a.id === formData.archetype)?.icon || '👤'}
                  </span>
                </div>
                
                {/* Username */}
                <h3 className="text-xl font-bold mb-1" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
                  @{user?.username || 'username'}
                </h3>
                
                {/* Role */}
                <p className="text-sm mb-2" style={{ color: '#00C2FF' }}>
                  {formData.role || 'Your Role'}
                </p>
                
                {/* Location */}
                {formData.location && (
                  <p className="text-sm flex items-center justify-center gap-1" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {formData.location}
                  </p>
                )}
                
                {/* Bio Preview */}
                {formData.bio && (
                  <p className="mt-3 text-sm" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    {formData.bio}
                  </p>
                )}
              </div>

              {/* Location Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2" style={{ color: 'rgba(255, 255, 255, 0.75)' }}>
                  Where are you based?
                </label>
                <input
                  type="text"
                  placeholder="e.g., Paris, France"
                  value={formData.location}
                  onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                  className="w-full px-5 py-3.5 border-2 rounded-xl"
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.05)', 
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    color: 'rgba(255, 255, 255, 0.95)'
                  }}
                />
              </div>

              {/* Bio Input */}
              <div className="mb-8">
                <label className="block text-sm font-medium mb-2" style={{ color: 'rgba(255, 255, 255, 0.75)' }}>
                  Tell about yourself
                </label>
                <div className="relative">
                  <textarea
                    placeholder="A brief description of who you are..."
                    value={formData.bio}
                    onChange={(e) => {
                      if (e.target.value.length <= 90) {
                        setFormData((prev) => ({ ...prev, bio: e.target.value }));
                      }
                    }}
                    maxLength={90}
                    rows={2}
                    className="w-full px-5 py-3.5 border-2 rounded-xl resize-none"
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.05)', 
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      color: 'rgba(255, 255, 255, 0.95)'
                    }}
                  />
                  <span 
                    className="absolute bottom-2 right-3 text-xs"
                    style={{ color: formData.bio.length > 80 ? '#FF9F0A' : 'rgba(255, 255, 255, 0.4)' }}
                  >
                    {formData.bio.length}/90
                  </span>
                </div>
              </div>

              {/* Complete Button */}
              <button
                onClick={handleComplete}
                disabled={loading}
                className="w-full py-4 text-white text-lg font-bold rounded-xl hover:shadow-2xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(135deg, #00C2FF 0%, #0A84FF 100%)',
                  boxShadow: '0 4px 20px rgba(0, 194, 255, 0.3)'
                }}
              >
                {loading ? 'Creating your profile...' : '🚀 LEVEL UP'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
