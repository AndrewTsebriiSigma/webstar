'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { onboardingAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { MapPinIcon, BriefcaseIcon } from '@heroicons/react/24/outline';

// Talent/Archetype data
const TALENTS = [
  { id: 'engineer', icon: '🔧', label: 'Engineer' },
  { id: 'artist', icon: '🎨', label: 'Artist' },
  { id: 'sound', icon: '🎵', label: 'Sound' },
  { id: 'communicator', icon: '💬', label: 'Communicator' },
];

const POPULAR_ROLES = [
  'Beatmaker', 'Fashion Blogger', 'Writer', 
  'Artist', 'Photographer', 'Software Engineer'
];

// Get expertise label based on slider value (0-100)
const getExpertiseLabel = (value: number): string => {
  if (value < 33) return 'Emerging';
  if (value < 67) return 'Developing';
  return 'Established';
};

// Progress Bar - with 3 stepping stone checkpoints
const ProgressBar = ({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) => {
  // Cap at 98% for last step
  const progress = Math.min((currentStep / totalSteps) * 100, 98);
  
  // 3 checkpoint positions in the MIDDLE
  const checkpoints = [25, 50, 75];
  const barBg = 'rgba(255, 255, 255, 0.06)';
  const fillColor = '#00C2FF';
  
  return (
    <div className="w-full max-w-sm mx-auto mb-8">
      {/* Container with extra height for circles */}
      <div className="relative h-5 flex items-center">
        {/* Background bar */}
        <div 
          className="absolute left-0 right-0 h-[6px] rounded-full"
          style={{ background: barBg }}
        />
        
        {/* Fill bar */}
        <div 
          className="absolute left-0 h-[6px] rounded-full transition-all duration-500 ease-out"
          style={{ 
            width: `${progress}%`,
            background: fillColor
          }}
        />
        
        {/* Checkpoint circles - rendered on TOP, seamless with bar */}
        {checkpoints.map((pos, i) => {
          const isFilled = progress >= pos;
          return (
            <div
              key={i}
              className="absolute rounded-full transition-all duration-300"
              style={{
                left: `${pos}%`,
                transform: 'translateX(-50%)',
                width: '14px',
                height: '14px',
                background: isFilled ? fillColor : barBg,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

// Floating Orbs Background
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

// Input wrapper with focus highlight - OUTSIDE component to prevent re-renders
const InputWrapper = ({ focused, children }: { focused: boolean; children: React.ReactNode }) => (
  <div 
    className="transition-all duration-200"
    style={{
      background: 'rgba(255, 255, 255, 0.02)',
      borderRadius: '12px',
      border: focused ? '1px solid transparent' : '1px solid rgba(255, 255, 255, 0.06)',
      boxShadow: focused ? '0 0 0 1px rgba(0, 194, 255, 0.3)' : 'none'
    }}
  >
    {children}
  </div>
);

export default function OnboardingPage() {
  const router = useRouter();
  const { updateUser } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    archetype: '',
    role: '',
    headline: '',
    expertise: 50,
    location: '',
    username: '',
    avatarUrl: ''
  });
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [showFinale, setShowFinale] = useState(false);
  const [finaleLineIndex, setFinaleLineIndex] = useState(0);
  const [finaleText, setFinaleText] = useState('');
  const [hourglassEmoji, setHourglassEmoji] = useState('⏳');
  const [error, setError] = useState('');
  
  // Focus states for inputs
  const [nameFocused, setNameFocused] = useState(false);
  const [roleFocused, setRoleFocused] = useState(false);
  const [headlineFocused, setHeadlineFocused] = useState(false);
  const [locationFocused, setLocationFocused] = useState(false);
  const [usernameFocused, setUsernameFocused] = useState(false);
  
  
  // Mapbox location search state
  const [locationSuggestions, setLocationSuggestions] = useState<Array<{place_name: string; id: string}>>([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  
  const MAPBOX_TOKEN = 'pk.eyJ1Ijoid2Vic3RhcnVzZXIiLCJhIjoiY21rNmF2NDluMDFzaDNlcG5tOHVzN2xsMCJ9.VZVvRWxM2wScW3M1D299fQ';

  // Total steps: Talent(1) → Name(2) → Location(3) → Role+Expertise(4) → Description(5) → Username(6)
  const TOTAL_STEPS = 6;

  // Finale lines
  const finaleLines = [
    'Loading your universe...',
    'Stars aligning...',
    'One more thing...',
    'Welcome home.'
  ];

  const searchLocation = async (query: string) => {
    if (!query || query.length < 2) {
      setLocationSuggestions([]);
      setShowLocationDropdown(false);
      return;
    }

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&types=place,locality,neighborhood,address&limit=5`
      );
      const data = await response.json();
      
      if (data.features) {
        setLocationSuggestions(
          data.features.map((feature: any) => ({
            place_name: feature.place_name,
            id: feature.id
          }))
        );
        setShowLocationDropdown(true);
      }
    } catch (error) {
      console.error('Location search error:', error);
      setLocationSuggestions([]);
    }
  };

  const handleLocationSelect = (placeName: string) => {
    setFormData(prev => ({ ...prev, location: placeName }));
    setShowLocationDropdown(false);
    setLocationSuggestions([]);
  };

  // Check username availability
  useEffect(() => {
    if (!formData.username || formData.username.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingUsername(true);
      try {
        // Add timeout to prevent infinite hang (5 seconds max)
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 5000)
        );
        const apiPromise = onboardingAPI.checkUsernameAvailability(formData.username);
        
        const response = await Promise.race([apiPromise, timeoutPromise]) as { available: boolean };
        setUsernameAvailable(response.available);
      } catch {
        setUsernameAvailable(null); // Fail silently, user can retry
      } finally {
        setCheckingUsername(false); // Always stop spinner
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.username]);

  // Avatar upload handler
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatarUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Typewriter effect for finale
  const typeText = async (text: string) => {
    setFinaleText('');
    for (let i = 0; i <= text.length; i++) {
      await new Promise(r => setTimeout(r, 40));
      setFinaleText(text.slice(0, i));
    }
  };

  // Hourglass emoji loop
  useEffect(() => {
    if (!showFinale) return;
    const interval = setInterval(() => {
      setHourglassEmoji(prev => prev === '⏳' ? '⌛️' : '⏳');
    }, 500);
    return () => clearInterval(interval);
  }, [showFinale]);

  // Handle finale animation
  const startFinale = async () => {
    setShowFinale(true);
    setFinaleLineIndex(0);
    
    // Animate through each line
    for (let i = 0; i < finaleLines.length; i++) {
      setFinaleLineIndex(i);
      await typeText(finaleLines[i]);
      
      // Hold on last line longer
      if (i < finaleLines.length - 1) {
        await new Promise(r => setTimeout(r, 1200));
      } else {
        await new Promise(r => setTimeout(r, 800));
      }
    }

    // Complete onboarding
    try {
      const archetypeMap: Record<string, string> = {
        'engineer': 'Engineer',
        'artist': 'Artist',
        'sound': 'Sound-Maker',
        'communicator': 'Communicator'
      };

      const expertiseLabel = getExpertiseLabel(formData.expertise);

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

      const user = JSON.parse(localStorage.getItem('user') || '{}');
      user.full_name = formData.fullName;
      user.username = formData.username;
      user.onboarding_completed = true;
      localStorage.setItem('user', JSON.stringify(user));
      
      updateUser(user);

      await new Promise(r => setTimeout(r, 500));
      router.push(`/${formData.username}`);
    } catch (err: any) {
      console.error('Failed to complete onboarding:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to complete onboarding. Please try again.';
      setError(errorMessage);
    }
  };

  // Centered Profile Preview Component - MATCHES ACTUAL PROFILE PAGE STYLING
  // Shows PLACEHOLDERS when empty to signal what each field is about
  const ProfilePreview = () => {
    // Show section from that step onwards (with placeholder if empty)
    const showName = step >= 2;       // Show from step 2+ (placeholder or real)
    const showLocation = step >= 3;   // Show from step 3+ (placeholder or real)
    const showRole = step >= 4;       // Show from step 4+ (placeholder or real)
    const showHeadline = step >= 5 && formData.headline;  // Only show when filled
    
    return (
      <div 
        className="flex flex-col items-center mb-6 p-5 rounded-2xl"
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.06)'
        }}
      >
        {/* Avatar - CIRCLE shape, tappable on ANY step, SHOWS FIRST */}
        <label 
          className="w-20 h-20 rounded-full mb-3 flex items-center justify-center text-3xl overflow-hidden cursor-pointer hover:opacity-80 ring-2 ring-transparent hover:ring-cyan-500/50"
          style={{ 
            background: formData.avatarUrl 
              ? 'transparent' 
              : 'linear-gradient(135deg, rgba(0, 194, 255, 0.2) 0%, rgba(0, 136, 204, 0.2) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <input 
            type="file"
            onChange={handleAvatarChange}
            accept="image/*"
            style={{ position: 'absolute', left: '-9999px', opacity: 0 }}
          />
          {formData.avatarUrl ? (
            <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            formData.archetype ? TALENTS.find(t => t.id === formData.archetype)?.icon : '👤'
          )}
        </label>
        
        {/* Name - shows placeholder "Your Name" when empty */}
        {showName && (
          <h2 
            className="text-xl font-bold"
            style={{ 
              color: formData.fullName ? 'rgba(245, 245, 245, 0.95)' : 'rgba(255, 255, 255, 0.3)',
              letterSpacing: '-0.2px',
              marginBottom: '14px'
            }}
          >
            {formData.fullName || 'Your Name'}
          </h2>
        )}
        
        {/* Headline/Bio - only shows when filled */}
        {showHeadline && (
          <p 
            className="text-center px-2"
            style={{ 
              color: 'rgba(255, 255, 255, 0.75)',
              fontSize: '15px',
              lineHeight: '1.4',
              opacity: 0.9,
              marginBottom: '8px',
              maxWidth: '280px'
            }}
          >
            {formData.headline}
          </p>
        )}
        
        {/* Location + Role - shows placeholders when empty to signal purpose */}
        {(showLocation || showRole) && (
          <div className="flex items-center justify-center gap-2 flex-wrap px-2" style={{ marginBottom: '0px' }}>
            {showLocation && (
              <div 
                className="flex items-center gap-1" 
                style={{ 
                  color: formData.location ? 'rgba(255, 255, 255, 0.75)' : 'rgba(255, 255, 255, 0.3)', 
                  fontSize: '13px' 
                }}
              >
                <MapPinIcon className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{formData.location ? formData.location.split(',')[0] : 'Location'}</span>
              </div>
            )}
            
            {showRole && showLocation && (
              <span style={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: '12px', opacity: 0.5 }}>•</span>
            )}
            
            {showRole && (
              <div 
                className="flex items-center gap-1" 
                style={{ 
                  color: formData.role ? 'rgba(255, 255, 255, 0.75)' : 'rgba(255, 255, 255, 0.3)', 
                  fontSize: '13px' 
                }}
              >
                <BriefcaseIcon className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{formData.role || 'Role'}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Finale Screen
  if (showFinale) {
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden"
        style={{ background: '#0B0B0C' }}
      >
        <FloatingOrbs />
        
        <div className="relative z-10 text-center max-w-md">
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
                  setFinaleLineIndex(0);
                  setFinaleText('');
                  setStep(6);
                }}
                className="mt-3 block w-full py-2 px-4 rounded-lg text-sm font-medium transition hover:opacity-80"
                style={{
                  background: 'rgba(255, 69, 58, 0.2)',
                  color: '#FF453A',
                  border: '1px solid rgba(255, 69, 58, 0.4)'
                }}
              >
                Go Back
              </button>
            </div>
          )}

          {/* BIG hourglass icon on TOP */}
          {!error && (
            <>
              <div 
                className="text-7xl mb-6 transition-transform duration-300"
                style={{ 
                  filter: 'drop-shadow(0 0 30px rgba(0, 194, 255, 0.5))'
                }}
              >
                {finaleLineIndex === 3 ? '✨' : hourglassEmoji}
              </div>
              
              {/* Typing text BELOW */}
              <div className="h-12 flex items-center justify-center">
                <p 
                  className="text-xl font-medium"
                  style={{ color: finaleLineIndex === 3 ? '#00C2FF' : 'rgba(255, 255, 255, 0.8)' }}
                >
                  {finaleText}
                  <span 
                    className="inline-block w-[2px] h-5 ml-1 animate-pulse"
                    style={{ 
                      background: '#00C2FF',
                      verticalAlign: 'middle',
                      opacity: finaleText.length < finaleLines[finaleLineIndex]?.length ? 1 : 0
                    }}
                  />
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen min-h-screen-safe flex flex-col items-center px-4 sm:px-6 py-6 sm:py-8 relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at center, #0B0B0C 0%, #050506 100%)' }}
    >
      <FloatingOrbs />

      {/* Main Content - Responsive container with explicit max-width for all sizes */}
      <div className="w-full relative z-10 flex-1 flex flex-col" style={{ maxWidth: 'min(460px, calc(100% - 32px))' }}>
        {/* Progress Bar - simple filler line */}
        <ProgressBar currentStep={step} totalSteps={TOTAL_STEPS} />


        {/* Centered Profile Preview */}
        <ProfilePreview />

        {/* Step Content Card - Responsive padding */}
        <div 
          className="rounded-2xl p-5 sm:p-6 lg:p-8"
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
          
          {/* Step 1: Talent (Archetype) */}
          {step === 1 && (
            <>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
                  Pick your vibe.
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {TALENTS.map(talent => (
                  <button
                    key={talent.id}
                    onClick={() => {
                      setFormData(prev => ({ ...prev, archetype: talent.id }));
                      setTimeout(() => setStep(2), 300);
                    }}
                    className="p-4 rounded-xl transition"
                    style={{
                      background: formData.archetype === talent.id 
                        ? 'rgba(0, 194, 255, 0.15)' 
                        : 'rgba(255, 255, 255, 0.02)',
                      border: formData.archetype === talent.id 
                        ? '1px solid rgba(0, 194, 255, 0.3)' 
                        : '1px solid rgba(255, 255, 255, 0.05)'
                    }}
                  >
                    <span className="text-3xl block mb-2">{talent.icon}</span>
                    <span className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                      {talent.label}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Step 2: Name + Tappable Avatar */}
          {step === 2 && (
            <>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
                  What should we call you?
                </h2>
              </div>

              <InputWrapper focused={nameFocused}>
                <input
                  type="text"
                  placeholder="Your name"
                  value={formData.fullName}
                  onChange={(e) => {
                    if (e.target.value.length <= 30) {
                      setFormData(prev => ({ ...prev, fullName: e.target.value }));
                    }
                  }}
                  onFocus={() => setNameFocused(true)}
                  onBlur={() => setNameFocused(false)}
                  className="w-full px-5 py-4 text-lg text-center"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: 'rgba(255, 255, 255, 0.95)'
                  }}
                  autoFocus
                  maxLength={30}
                />
              </InputWrapper>

              <button
                onClick={() => formData.fullName && setStep(3)}
                disabled={!formData.fullName}
                className="w-full mt-4 py-4 font-semibold rounded-xl transition disabled:opacity-50"
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

          {/* Step 3: Location (BEFORE Role) */}
          {step === 3 && (
            <>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
                  Working from where?
                </h2>
              </div>

              <InputWrapper focused={locationFocused}>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search your city..."
                    value={formData.location}
                    onChange={(e) => {
                      if (e.target.value.length <= 50) {
                        setFormData(prev => ({ ...prev, location: e.target.value }));
                        searchLocation(e.target.value);
                      }
                    }}
                    onFocus={() => {
                      setLocationFocused(true);
                      if (locationSuggestions.length > 0) setShowLocationDropdown(true);
                    }}
                    onBlur={() => {
                      setLocationFocused(false);
                      setTimeout(() => setShowLocationDropdown(false), 200);
                    }}
                    className="w-full px-5 py-4 text-lg text-center"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: 'rgba(255, 255, 255, 0.95)'
                    }}
                    autoFocus
                    maxLength={50}
                  />
                  
                  {/* Location suggestions dropdown */}
                  {showLocationDropdown && locationSuggestions.length > 0 && (
                    <div 
                      className="absolute left-0 right-0 mt-1 rounded-xl overflow-hidden shadow-xl"
                      style={{
                        background: 'rgba(20, 25, 35, 0.98)',
                        border: '1px solid rgba(0, 194, 255, 0.3)',
                        backdropFilter: 'blur(20px)',
                        zIndex: 100,
                        top: '100%'
                      }}
                    >
                      {locationSuggestions.map((suggestion) => (
                        <button
                          key={suggestion.id}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault(); // Prevent blur from firing
                            handleLocationSelect(suggestion.place_name);
                          }}
                          className="w-full text-left px-4 py-3 transition-all duration-150 hover:bg-[#00C2FF]/20"
                          style={{
                            color: 'rgba(255, 255, 255, 0.9)',
                            fontSize: '14px',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                          }}
                        >
                          <span className="flex items-center gap-3">
                            <svg className="w-4 h-4 text-[#00C2FF] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="truncate">{suggestion.place_name}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </InputWrapper>

              <button
                onClick={() => formData.location && setStep(4)}
                disabled={!formData.location}
                className="w-full mt-4 py-4 font-semibold rounded-xl transition disabled:opacity-50"
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

          {/* Step 4: Role + Expertise (combined - expertise is sub-element) */}
          {step === 4 && (
            <>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
                  What's your talent?
                </h2>
              </div>

              <InputWrapper focused={roleFocused}>
                <input
                  type="text"
                  placeholder="e.g., Product Designer"
                  value={formData.role}
                  onChange={(e) => {
                    if (e.target.value.length <= 30) {
                      setFormData(prev => ({ ...prev, role: e.target.value }));
                    }
                  }}
                  onFocus={() => setRoleFocused(true)}
                  onBlur={() => setRoleFocused(false)}
                  className="w-full px-5 py-4 text-lg text-center"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: 'rgba(255, 255, 255, 0.95)'
                  }}
                  autoFocus
                  maxLength={30}
                />
              </InputWrapper>

              <div className="mt-4 mb-4">
                <div className="flex flex-wrap justify-center gap-2">
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

              {/* Expertise sub-element - slides out when role is filled */}
              {formData.role && (
                <div 
                  className="mt-6 pt-6 transition-all duration-300"
                  style={{ 
                    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                    animation: 'slideIn 0.3s ease-out'
                  }}
                >
                  <p className="text-sm text-center mb-4" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                    New to this or years deep?
                  </p>
                  
                  <div className="px-2 relative">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={formData.expertise}
                      onChange={(e) => setFormData(prev => ({ ...prev, expertise: parseInt(e.target.value) }))}
                      className="w-full h-2 rounded-full appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, 
                          hsl(200, ${60 + (formData.expertise * 0.4)}%, ${25 + (formData.expertise * 0.35)}%) ${formData.expertise}%, 
                          rgba(255,255,255,0.06) ${formData.expertise}%)`
                      }}
                    />
                    {/* Custom thumb overlay - NO transition, instant response, proper centering */}
                    {(() => {
                      const thumbSize = 16 + (formData.expertise * 0.056);
                      return (
                        <div 
                          className="absolute pointer-events-none"
                          style={{
                            // Maps 0-100% to track, accounting for thumb width at edges
                            left: `calc(${formData.expertise}% - ${formData.expertise * thumbSize / 100}px)`,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: `${thumbSize}px`,
                            height: `${thumbSize}px`,
                            borderRadius: '50%',
                            background: `linear-gradient(135deg, 
                              hsl(200, ${70 + (formData.expertise * 0.3)}%, ${40 + (formData.expertise * 0.25)}%), 
                              hsl(195, 100%, ${50 + (formData.expertise * 0.15)}%))`,
                            border: '2px solid rgba(255, 255, 255, 0.9)',
                            boxShadow: `0 0 ${6 + (formData.expertise * 0.12)}px rgba(0, 194, 255, ${0.2 + (formData.expertise * 0.005)})`
                          }}
                        />
                      );
                    })()}
                  </div>
                </div>
              )}

              <button
                onClick={() => formData.role && setStep(5)}
                disabled={!formData.role}
                className="w-full mt-6 py-4 font-semibold rounded-xl transition disabled:opacity-50"
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

          {/* Step 5: Headline - clean, no examples */}
          {step === 5 && (
            <>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
                  What will they remember?
                </h2>
              </div>

              <InputWrapper focused={headlineFocused}>
                <div className="relative">
                  <textarea
                    placeholder="Your one-liner..."
                    value={formData.headline}
                    onChange={(e) => {
                      if (e.target.value.length <= 70) {
                        setFormData(prev => ({ ...prev, headline: e.target.value }));
                      }
                    }}
                    onFocus={() => setHeadlineFocused(true)}
                    onBlur={() => setHeadlineFocused(false)}
                    className="w-full px-5 py-4 text-lg resize-none"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: 'rgba(255, 255, 255, 0.95)',
                      minHeight: '80px',
                      textAlign: 'left'
                    }}
                    autoFocus
                    maxLength={70}
                    rows={2}
                  />
                  {/* Character count INSIDE the frame */}
                  <span 
                    className="absolute bottom-2 right-3 text-xs"
                    style={{ color: 'rgba(255, 255, 255, 0.3)' }}
                  >
                    {formData.headline.length}/70
                  </span>
                </div>
              </InputWrapper>

              <button
                onClick={() => setStep(6)}
                className="w-full mt-4 py-4 font-semibold rounded-xl transition"
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

          {/* Step 6: Username */}
          {step === 6 && (
            <>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
                  Claim your space.
                </h2>
              </div>

              <InputWrapper focused={usernameFocused}>
                <div className="flex items-center overflow-hidden">
                  <span 
                    className="px-4 py-4 text-sm"
                    style={{ 
                      color: 'rgba(255, 255, 255, 0.4)',
                      borderRight: '1px solid rgba(255, 255, 255, 0.05)'
                    }}
                  >
                    webstar.bio/
                  </span>
                  <input
                    type="text"
                    placeholder="username"
                    value={formData.username}
                    onChange={(e) => {
                      const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                      if (value.length <= 15) {
                        setFormData(prev => ({ ...prev, username: value }));
                      }
                    }}
                    onFocus={() => setUsernameFocused(true)}
                    onBlur={() => setUsernameFocused(false)}
                    className="flex-1 px-4 py-4"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: 'rgba(255, 255, 255, 0.95)'
                    }}
                    autoFocus
                    maxLength={15}
                  />
                  {checkingUsername && (
                    <div className="pr-3">
                      <div 
                        className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                        style={{ borderColor: '#00C2FF', borderTopColor: 'transparent' }}
                      />
                    </div>
                  )}
                  {!checkingUsername && usernameAvailable === true && (
                    <div className="pr-3">
                      <svg className="w-5 h-5" fill="#30D158" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  {!checkingUsername && usernameAvailable === false && (
                    <div className="pr-3">
                      <svg className="w-5 h-5" fill="#FF453A" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </InputWrapper>

              <button
                onClick={startFinale}
                disabled={!usernameAvailable || loading}
                className="w-full mt-4 py-4 font-semibold rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #00C2FF 0%, #0099CC 100%)',
                  color: '#FFF',
                  border: 'none'
                }}
              >
                🚀 Launch
              </button>
            </>
          )}
        </div>

        {/* Back button - BELOW the frame */}
        {step > 1 && (
          <button
            onClick={() => setStep(step - 1)}
            className="w-full mt-4 py-2 text-sm transition"
            style={{ color: 'rgba(255, 255, 255, 0.25)' }}
          >
            ← Back
          </button>
        )}
      </div>

      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(30px, -30px); }
        }
        @keyframes slideIn {
          from { 
            opacity: 0; 
            transform: translateY(-10px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        /* Hide native slider thumb - we use custom overlay */
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: transparent;
          cursor: pointer;
          border: none;
        }
        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: transparent;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
}
