'use client';

import { useState, useEffect, useRef } from 'react';
import { PlusIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { profileAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import SimpleCalendar from './SimpleCalendar';

interface AboutSectionProps {
  isOwnProfile: boolean;
  isCustomizeMode: boolean; // NEW: Controls when editing is enabled
  profile: any;
  onUpdate: () => void;
}

interface Skill {
  name: string;
  level: number; // 0-100
}

interface Experience {
  id: string;
  title: string;
  company: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD or empty for "Present"
  description: string;
}

// Dynamic placeholder texts for About section
const PLACEHOLDER_TEXTS = [
  'Tell me about yourself',
  'What sections are you good at?',
  'Describe your expertise',
  'Share your background',
  'What do you specialize in?'
];

// GripVertical Icon component
const GripVerticalIcon = ({ size = 16, strokeWidth = 2.5 }: { size?: number; strokeWidth?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="5" r="1" fill="currentColor" />
    <circle cx="9" cy="12" r="1" fill="currentColor" />
    <circle cx="9" cy="19" r="1" fill="currentColor" />
    <circle cx="15" cy="5" r="1" fill="currentColor" />
    <circle cx="15" cy="12" r="1" fill="currentColor" />
    <circle cx="15" cy="19" r="1" fill="currentColor" />
  </svg>
);

// Minus Icon component
const MinusIcon = ({ size = 12, strokeWidth = 3 }: { size?: number; strokeWidth?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export default function AboutSection({ isOwnProfile, isCustomizeMode, profile, onUpdate }: AboutSectionProps) {
  // About editing
  const [aboutText, setAboutText] = useState('');
  const [displayPlaceholder, setDisplayPlaceholder] = useState(PLACEHOLDER_TEXTS[0]);
  const placeholderIndexRef = useRef(0);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showFullAbout, setShowFullAbout] = useState(false);
  const [isSavingAbout, setIsSavingAbout] = useState(false);

  // Skills editing
  const [skills, setSkills] = useState<Skill[]>([]);
  const [newSkillName, setNewSkillName] = useState('');
  const [isSavingSkills, setIsSavingSkills] = useState(false);

  // Experience editing
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [isSavingExperience, setIsSavingExperience] = useState(false);

  // Connect editing
  const [showAddConnect, setShowAddConnect] = useState(false);
  const [selectedPlatformForLink, setSelectedPlatformForLink] = useState<string | null>(null);
  const [linkUsername, setLinkUsername] = useState('');
  const [savedLinks, setSavedLinks] = useState<Record<string, string>>({});
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    social: true,
    professional: true,
    creative: true,
  });

  // Track if we've already initialized for this customize session
  const hasInitializedRef = useRef(false);
  const prevCustomizeModeRef = useRef(false);

  // Initialize data from profile when customize mode FIRST activates (not on every profile change)
  useEffect(() => {
    // Detect when customize mode turns ON
    const justTurnedOn = isCustomizeMode && !prevCustomizeModeRef.current;
    prevCustomizeModeRef.current = isCustomizeMode;
    
    if (justTurnedOn && isOwnProfile) {
      hasInitializedRef.current = true;
      
      // Initialize about text
      setAboutText(profile?.about || '');
      
      // Initialize skills
      if (profile?.skills) {
        try {
          const parsed = JSON.parse(profile.skills);
          if (Array.isArray(parsed)) {
            setSkills(parsed);
          } else {
            setSkills(profile.skills.split(',').map((s: string) => ({ name: s.trim(), level: 85 })));
          }
        } catch {
          setSkills(profile.skills.split(',').map((s: string) => ({ name: s.trim(), level: 85 })));
        }
      } else {
        setSkills([]);
      }
      
      // Initialize experiences
      let existingExperiences: Experience[] = [];
      try {
        if (profile?.experience) {
          const exp = JSON.parse(profile.experience);
          existingExperiences = exp.map((item: any) => ({
            id: item.id || Date.now().toString() + Math.random(),
            title: item.title || '',
            company: item.company || '',
            startDate: item.startDate || (item.period ? item.period.split(' - ')[0] : ''),
            endDate: item.endDate || (item.period && item.period.includes('Present') ? '' : (item.period ? item.period.split(' - ')[1] : '')),
            description: item.description || '',
          }));
        }
      } catch {
        existingExperiences = [];
      }
      setExperiences(existingExperiences);
    }
    
    // Reset flag when customize mode turns OFF
    if (!isCustomizeMode) {
      hasInitializedRef.current = false;
    }
  }, [isCustomizeMode, isOwnProfile, profile]);

  // Auto-save about when user stops typing (debounced) - but don't reset text
  const aboutSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (!isCustomizeMode || !isOwnProfile) return;
    // Skip if not initialized yet or text matches original
    if (!hasInitializedRef.current) return;
    if (aboutText === (profile?.about || '')) return;
    
    if (aboutSaveTimeoutRef.current) {
      clearTimeout(aboutSaveTimeoutRef.current);
    }
    
    aboutSaveTimeoutRef.current = setTimeout(async () => {
      setIsSavingAbout(true);
      try {
        await profileAPI.updateMe({ about: aboutText });
        // Don't call onUpdate() - it triggers profile reload which resets text!
      } catch (error) {
        console.error('Failed to save about:', error);
      } finally {
        setIsSavingAbout(false);
      }
    }, 1500); // Increased to 1.5 seconds for better typing experience
    
    return () => {
      if (aboutSaveTimeoutRef.current) {
        clearTimeout(aboutSaveTimeoutRef.current);
      }
    };
  }, [aboutText, isCustomizeMode, isOwnProfile]);

  // Dynamic placeholder animation
  useEffect(() => {
    if (!isCustomizeMode) {
      setDisplayPlaceholder(PLACEHOLDER_TEXTS[0]);
      placeholderIndexRef.current = 0;
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
      return;
    }

    let currentTextIndex = placeholderIndexRef.current;
    let currentText = PLACEHOLDER_TEXTS[currentTextIndex];
    let charIndex = currentText.length;
    let isDeleting = true;

    const animate = () => {
      if (!isCustomizeMode) return;

      if (isDeleting) {
        if (charIndex > 0) {
          charIndex--;
          setDisplayPlaceholder(currentText.substring(0, charIndex));
          animationTimeoutRef.current = setTimeout(animate, 50);
        } else {
          isDeleting = false;
          currentTextIndex = (currentTextIndex + 1) % PLACEHOLDER_TEXTS.length;
          placeholderIndexRef.current = currentTextIndex;
          currentText = PLACEHOLDER_TEXTS[currentTextIndex];
          charIndex = 0;
          animationTimeoutRef.current = setTimeout(animate, 500);
        }
      } else {
        if (charIndex < currentText.length) {
          charIndex++;
          setDisplayPlaceholder(currentText.substring(0, charIndex));
          animationTimeoutRef.current = setTimeout(animate, 50);
        } else {
          isDeleting = true;
          animationTimeoutRef.current = setTimeout(animate, 3000);
        }
      }
    };

    animationTimeoutRef.current = setTimeout(animate, 3000);

    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, [isCustomizeMode]);

  // Platform categories configuration with image icons
  const PLATFORM_CATEGORIES = {
    social: {
      label: 'SOCIAL',
      platforms: [
        { id: 'instagram', name: 'Instagram', icon: '/icons/social (1).png', color: '#E4405F', domain: 'instagram.com' },
        { id: 'facebook', name: 'Facebook', icon: '/icons/facebook.png', color: '#1877F2', domain: 'facebook.com' },
        { id: 'x', name: 'X', icon: '/icons/social.png', color: '#000000', domain: 'x.com' },
        { id: 'snapchat', name: 'Snapchat', icon: '👻', color: '#FFFC00', domain: 'snapchat.com' },
        { id: 'pinterest', name: 'Pinterest', icon: '/icons/pinterest.png', color: '#E60023', domain: 'pinterest.com' },
        { id: 'tiktok', name: 'TikTok', icon: '/icons/tik-tok.png', color: '#000000', domain: 'tiktok.com' },
        { id: 'reddit', name: 'Reddit', icon: '/icons/reddit.png', color: '#FF4500', domain: 'reddit.com' },
      ]
    },
    professional: {
      label: 'PROFESSIONAL',
      platforms: [
        { id: 'linkedin', name: 'LinkedIn', icon: '/icons/linkedin.png', color: '#0A66C2', domain: 'linkedin.com' },
        { id: 'github', name: 'GitHub', icon: '/icons/github.png', color: '#181717', domain: 'github.com' },
        { id: 'behance', name: 'Behance', icon: '/icons/behance.png', color: '#1769FF', domain: 'behance.net' },
        { id: 'dribbble', name: 'Dribbble', icon: '/icons/dribbble.png', color: '#EA4C89', domain: 'dribbble.com' },
      ]
    },
    creative: {
      label: 'CREATIVE',
      platforms: [
        { id: 'youtube', name: 'YouTube', icon: '/icons/youtube.png', color: '#FF0000', domain: 'youtube.com' },
        { id: 'spotify', name: 'Spotify', icon: '/icons/spotify.png', color: '#1DB954', domain: 'spotify.com' },
        { id: 'soundcloud', name: 'SoundCloud', icon: '/icons/soundcloud.png', color: '#FF3300', domain: 'soundcloud.com' },
      ]
    }
  };

  // Helper function to render platform icon
  const renderPlatformIcon = (icon: string, size: number = 24) => {
    if (icon.startsWith('/icons/')) {
      return (
        <img 
          src={icon} 
          alt="" 
          style={{ 
            width: `${size}px`, 
            height: `${size}px`, 
            objectFit: 'contain',
            filter: 'none'
          }} 
        />
      );
    }
    return <span style={{ fontSize: `${size}px` }}>{icon}</span>;
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handlePlatformClick = (platformId: string) => {
    setSelectedPlatformForLink(platformId);
    setLinkUsername('');
  };

  const savePlatformLink = async () => {
    if (!selectedPlatformForLink || !linkUsername.trim()) {
      toast.error('Please enter your username');
      return;
    }

    try {
      let platformDomain = '';
      for (const category of Object.values(PLATFORM_CATEGORIES)) {
        const platform = category.platforms.find(p => p.id === selectedPlatformForLink);
        if (platform) {
          platformDomain = platform.domain;
          break;
        }
      }

      const link = `${platformDomain}/${linkUsername.trim()}`;
      const updatedLinks = { ...savedLinks, [selectedPlatformForLink]: link };
      
      await profileAPI.updateMe({ social_links: JSON.stringify(updatedLinks) });
      
      setSavedLinks(updatedLinks);
      setShowAddConnect(false);
      setSelectedPlatformForLink(null);
      setLinkUsername('');
      toast.success('Social link added!');
      onUpdate();
    } catch (error) {
      toast.error('Failed to save social link');
    }
  };

  // Experience CRUD
  const addExperience = async () => {
    const newExp: Experience = {
      id: Date.now().toString() + Math.random(),
      title: '',
      company: '',
      startDate: '',
      endDate: '',
      description: '',
    };
    const updated = [...experiences, newExp];
    setExperiences(updated);
    // Auto-save
    setIsSavingExperience(true);
    try {
      await profileAPI.updateMe({ experience: JSON.stringify(updated) });
      onUpdate();
    } catch (error) {
      console.error('Failed to add experience:', error);
    } finally {
      setIsSavingExperience(false);
    }
  };

  const updateExperience = (index: number, field: keyof Experience, value: string) => {
    const updated = [...experiences];
    updated[index] = { ...updated[index], [field]: value };
    setExperiences(updated);
  };

  // Debounced save for experience fields
  const experienceSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const saveExperienceDebounced = (updatedExperiences: Experience[]) => {
    if (experienceSaveTimeoutRef.current) {
      clearTimeout(experienceSaveTimeoutRef.current);
    }
    experienceSaveTimeoutRef.current = setTimeout(async () => {
      setIsSavingExperience(true);
      try {
        await profileAPI.updateMe({ experience: JSON.stringify(updatedExperiences) });
        // Don't call onUpdate() - it resets the form data!
      } catch (error) {
        console.error('Failed to save experience:', error);
      } finally {
        setIsSavingExperience(false);
      }
    }, 1500); // Increased to 1.5 seconds
  };

  useEffect(() => {
    if (!isCustomizeMode || !isOwnProfile) return;
    if (!hasInitializedRef.current) return; // Skip if not initialized yet
    saveExperienceDebounced(experiences);
    return () => {
      if (experienceSaveTimeoutRef.current) {
        clearTimeout(experienceSaveTimeoutRef.current);
      }
    };
  }, [experiences, isCustomizeMode, isOwnProfile]);

  const removeExperience = async (index: number) => {
    const updated = experiences.filter((_, i) => i !== index);
    setExperiences(updated);
    setIsSavingExperience(true);
    try {
      await profileAPI.updateMe({ experience: JSON.stringify(updated) });
      onUpdate();
      toast.success('Experience removed');
    } catch (error) {
      toast.error('Failed to remove experience');
    } finally {
      setIsSavingExperience(false);
    }
  };

  // Skills CRUD
  const addSkill = async () => {
    if (!newSkillName.trim()) return;
    if (skills.length >= 6) {
      toast.error('Maximum 6 skills allowed');
      return;
    }
    const updated = [...skills, { name: newSkillName.trim(), level: 85 }];
    setSkills(updated);
    setNewSkillName('');
    setIsSavingSkills(true);
    try {
      await profileAPI.updateMe({ skills: JSON.stringify(updated) });
      onUpdate();
    } catch (error) {
      toast.error('Failed to add skill');
    } finally {
      setIsSavingSkills(false);
    }
  };

  const removeSkill = async (index: number) => {
    const updated = skills.filter((_, i) => i !== index);
    setSkills(updated);
    setIsSavingSkills(true);
    try {
      await profileAPI.updateMe({ skills: JSON.stringify(updated) });
      onUpdate();
      toast.success('Skill removed');
    } catch (error) {
      toast.error('Failed to remove skill');
    } finally {
      setIsSavingSkills(false);
    }
  };

  const updateSkillLevel = (index: number, level: number) => {
    const updated = [...skills];
    updated[index].level = level;
    setSkills(updated);
  };

  // Debounced save for skill levels
  const skillsSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (!isCustomizeMode || !isOwnProfile || skills.length === 0) return;
    if (!hasInitializedRef.current) return; // Skip if not initialized yet
    
    if (skillsSaveTimeoutRef.current) {
      clearTimeout(skillsSaveTimeoutRef.current);
    }
    skillsSaveTimeoutRef.current = setTimeout(async () => {
      setIsSavingSkills(true);
      try {
        await profileAPI.updateMe({ skills: JSON.stringify(skills) });
        // Don't call onUpdate() - it resets the form data!
      } catch (error) {
        console.error('Failed to save skills:', error);
      } finally {
        setIsSavingSkills(false);
      }
    }, 1500); // Increased to 1.5 seconds
    
    return () => {
      if (skillsSaveTimeoutRef.current) {
        clearTimeout(skillsSaveTimeoutRef.current);
      }
    };
  }, [skills, isCustomizeMode, isOwnProfile]);

  const formatExperiencePeriod = (startDate: string, endDate: string): string => {
    if (!startDate) return '';
    try {
      const start = new Date(startDate);
      const startYear = start.getFullYear();
      const end = endDate ? new Date(endDate) : null;
      const endYear = end ? end.getFullYear() : null;
      
      if (endYear) {
        return `${startYear} - ${endYear}`;
      } else {
        return `${startYear} - Present`;
      }
    } catch {
      return startDate && endDate ? `${startDate} - ${endDate}` : (startDate || '');
    }
  };

  // Map expertise badge to percentage level
  const getExpertiseLevel = (badge: string | null | undefined): number => {
    const expertiseMap: Record<string, number> = {
      'emerging': 25,
      'developing': 50,
      'established': 75,
      'leading': 100,
    };
    return badge ? (expertiseMap[badge.toLowerCase()] || 50) : 50;
  };

  // Parse skills for display (backward compatible)
  const getDisplaySkills = (): Skill[] => {
    const userSkills: Skill[] = [];
    
    // Add role + expertise as first skill if available
    if (profile?.role && profile?.expertise_badge) {
      const expertiseLevel = getExpertiseLevel(profile.expertise_badge);
      userSkills.push({ 
        name: profile.role, 
        level: expertiseLevel 
      });
    }
    
    // Parse user-added skills
    if (profile?.skills) {
      try {
        const parsed = JSON.parse(profile.skills);
        if (Array.isArray(parsed)) {
          userSkills.push(...parsed);
        } else {
          userSkills.push(...profile.skills.split(',').map((s: string) => ({ name: s.trim(), level: 85 })));
        }
      } catch {
        userSkills.push(...profile.skills.split(',').map((s: string) => ({ name: s.trim(), level: 85 })));
      }
    }
    
    return userSkills;
  };

  // Parse experiences for display
  const getDisplayExperiences = (): Experience[] => {
    if (!profile?.experience) return [];
    try {
      const exp = JSON.parse(profile.experience);
      return exp.map((item: any) => ({
        id: item.id || Date.now().toString() + Math.random(),
        title: item.title || '',
        company: item.company || '',
        startDate: item.startDate || (item.period ? item.period.split(' - ')[0] : ''),
        endDate: item.endDate || (item.period && item.period.includes('Present') ? '' : (item.period ? item.period.split(' - ')[1] : '')),
        description: item.description || '',
      }));
    } catch {
      return [];
    }
  };

  // Initialize saved links from profile
  useEffect(() => {
    if (profile?.social_links) {
      try {
        const links = JSON.parse(profile.social_links);
        setSavedLinks(links || {});
      } catch {
        setSavedLinks({});
      }
    }
  }, [profile]);

  const removeConnect = async (platform: string) => {
    try {
      const updatedLinks = { ...savedLinks };
      delete updatedLinks[platform];
      await profileAPI.updateMe({ social_links: JSON.stringify(updatedLinks) });
      setSavedLinks(updatedLinks);
      toast.success('Social link removed!');
      onUpdate();
    } catch (error) {
      toast.error('Failed to remove social link');
    }
  };

  // Get platform details by ID
  const getPlatformDetails = (platformId: string) => {
    for (const category of Object.values(PLATFORM_CATEGORIES)) {
      const platform = category.platforms.find(p => p.id === platformId);
      if (platform) return platform;
    }
    return null;
  };

  const displaySkills = getDisplaySkills();
  const displayExperiences = getDisplayExperiences();

  // Check if customize mode is active for editing
  const canEdit = isCustomizeMode && isOwnProfile;

  return (
    <div className="space-y-6">
      {/* About Section */}
      <div 
        className="rounded-xl border relative"
        style={{
          background: 'var(--bg-surface)',
          borderColor: canEdit ? 'rgba(0, 194, 255, 0.3)' : 'var(--border)',
          borderRadius: 'var(--radius-xl)',
        }}
      >
        {/* Drag Handle - only in customize mode */}
        {canEdit && (
          <div 
            className="drag-handle"
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: '32px',
              background: 'linear-gradient(90deg, rgba(0, 194, 255, 0.12) 0%, rgba(0, 194, 255, 0.04) 100%)',
              borderRight: '1px solid rgba(0, 194, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(0, 194, 255, 0.7)',
              cursor: 'grab',
              borderTopLeftRadius: 'var(--radius-xl)',
              borderBottomLeftRadius: 'var(--radius-xl)',
            }}
          >
            <GripVerticalIcon size={16} strokeWidth={2.5} />
          </div>
        )}
        
        <div 
          style={{ 
            padding: 'var(--space-4)',
            marginLeft: canEdit ? '32px' : '0',
            transition: 'margin-left 0.2s ease',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 
              className="font-semibold"
              style={{ 
                fontSize: '18px',
                lineHeight: '24px',
                fontWeight: '600',
                color: 'var(--text-primary)'
              }}
            >
              About
            </h3>
            {isSavingAbout && (
              <span style={{ fontSize: '12px', color: 'var(--blue)' }}>Saving...</span>
            )}
          </div>

          {canEdit ? (
            // Editable mode
            <div>
              <textarea
                value={aboutText}
                onChange={(e) => setAboutText(e.target.value)}
                maxLength={250}
                rows={4}
                placeholder={displayPlaceholder}
                className="edit-field w-full resize-none transition"
                style={{
                  padding: 'var(--space-3) var(--space-4)',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  lineHeight: '22px',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(0, 194, 255, 0.4)';
                  e.target.style.background = 'rgba(255, 255, 255, 0.06)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(0, 194, 255, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  e.target.style.background = 'rgba(255, 255, 255, 0.04)';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <div style={{ marginTop: 'var(--space-2)', textAlign: 'right' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{aboutText.length}/250</span>
              </div>
            </div>
          ) : (
            // Display mode
            <div>
              {profile?.about ? (
                <>
                  <p 
                    className="whitespace-pre-wrap"
                    style={{
                      color: 'var(--text-secondary)',
                      fontSize: '15px',
                      lineHeight: '22px',
                      marginBottom: 'var(--space-2)',
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                      width: '100%',
                    }}
                  >
                    {profile.about.length > 150 && !showFullAbout
                      ? profile.about.substring(0, 150) + '...'
                      : profile.about}
                  </p>
                  {profile.about.length > 150 && (
                    <button 
                      onClick={() => setShowFullAbout(!showFullAbout)}
                      className="transition"
                      style={{
                        color: 'var(--blue)',
                        fontSize: '15px',
                        fontWeight: '600',
                      }}
                    >
                      {showFullAbout ? 'Read less' : 'Read more'}
                    </button>
                  )}
                </>
              ) : (
                // Placeholder for empty about (visible to all)
                <p 
                  style={{
                    color: 'var(--text-tertiary)',
                    fontSize: '15px',
                    fontStyle: 'italic',
                  }}
                >
                  {isOwnProfile ? 'Tap Customize to add your bio' : 'No bio added yet'}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Experience Section */}
      <div 
        className="border relative"
        style={{
          background: 'var(--bg-surface)',
          borderColor: canEdit ? 'rgba(0, 194, 255, 0.3)' : 'var(--border)',
          borderRadius: 'var(--radius-xl)',
        }}
      >
        {/* Drag Handle */}
        {canEdit && (
          <div 
            className="drag-handle"
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: '32px',
              background: 'linear-gradient(90deg, rgba(0, 194, 255, 0.12) 0%, rgba(0, 194, 255, 0.04) 100%)',
              borderRight: '1px solid rgba(0, 194, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(0, 194, 255, 0.7)',
              cursor: 'grab',
              borderTopLeftRadius: 'var(--radius-xl)',
              borderBottomLeftRadius: 'var(--radius-xl)',
            }}
          >
            <GripVerticalIcon size={16} strokeWidth={2.5} />
          </div>
        )}

        <div 
          style={{ 
            padding: 'var(--space-4)',
            marginLeft: canEdit ? '32px' : '0',
            transition: 'margin-left 0.2s ease',
          }}
        >
          <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-4)' }}>
            <h3 
              className="font-semibold"
              style={{
                fontSize: '18px',
                lineHeight: '24px',
                fontWeight: '600',
                color: 'var(--text-primary)',
              }}
            >
              Experience
            </h3>
            {isSavingExperience && (
              <span style={{ fontSize: '12px', color: 'var(--blue)' }}>Saving...</span>
            )}
          </div>

          {canEdit ? (
            // Editable mode
            <div style={{ maxWidth: '336px', margin: '0 auto' }}>
              {experiences.length > 0 && (
                <div style={{ marginBottom: 'var(--space-4)' }}>
                  {experiences.map((exp, index) => (
                    <div 
                      key={exp.id} 
                      className="border relative"
                      style={{
                        padding: 'var(--space-4)',
                        background: 'var(--bg-surface-strong)',
                        borderRadius: 'var(--radius-xl)',
                        borderColor: 'var(--border)',
                        marginBottom: index < experiences.length - 1 ? 'var(--space-4)' : '0',
                      }}
                    >
                      {/* Minus Badge - Delete button */}
                      <div 
                        className="minus-badge"
                        onClick={() => removeExperience(index)}
                        style={{
                          position: 'absolute',
                          top: '-6px',
                          right: '-6px',
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: 'rgba(255, 59, 48, 0.95)',
                          border: '2px solid var(--bg-primary)',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          zIndex: 10,
                          boxShadow: '0 2px 8px rgba(255, 59, 48, 0.4)',
                        }}
                      >
                        <MinusIcon size={12} strokeWidth={3} />
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                        <input
                          type="text"
                          placeholder="Job Title"
                          value={exp.title}
                          onChange={(e) => updateExperience(index, 'title', e.target.value)}
                          maxLength={30}
                          className="edit-field title-field w-full"
                          style={{
                            padding: '8px 12px',
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '8px',
                            color: 'var(--text-primary)',
                            fontSize: '14px',
                          }}
                        />
                        <input
                          type="text"
                          placeholder="Company Name"
                          value={exp.company}
                          onChange={(e) => updateExperience(index, 'company', e.target.value)}
                          maxLength={30}
                          className="edit-field w-full"
                          style={{
                            padding: '8px 12px',
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '8px',
                            color: 'var(--text-primary)',
                            fontSize: '14px',
                          }}
                        />
                        <div className="grid grid-cols-2" style={{ gap: 'var(--space-3)' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--text-tertiary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Start</label>
                            <SimpleCalendar
                              value={exp.startDate}
                              onChange={(date) => updateExperience(index, 'startDate', date)}
                              placeholder="Start"
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--text-tertiary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>End</label>
                            <SimpleCalendar
                              value={exp.endDate}
                              onChange={(date) => updateExperience(index, 'endDate', date)}
                              placeholder="Present"
                            />
                          </div>
                        </div>
                        <textarea
                          placeholder="Description (optional)"
                          value={exp.description}
                          onChange={(e) => updateExperience(index, 'description', e.target.value)}
                          rows={2}
                          className="edit-field w-full resize-none"
                          style={{
                            padding: '8px 12px',
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '8px',
                            color: 'var(--text-primary)',
                            fontSize: '14px',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Card Button */}
              <button 
                onClick={addExperience}
                className="add-card w-full"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '14px',
                  borderRadius: '12px',
                  background: 'rgba(0, 194, 255, 0.08)',
                  border: '1.5px dashed rgba(0, 194, 255, 0.3)',
                  color: 'var(--blue)',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                <PlusIcon className="w-4 h-4" />
                Add Experience
              </button>
            </div>
          ) : (
            // Display mode
            <div style={{ maxWidth: '336px', margin: '0 auto' }}>
              {displayExperiences.length > 0 ? (
                <div className="relative" style={{ paddingLeft: '32px' }}>
                  <div 
                    className="absolute top-0 bottom-0 w-px" 
                    style={{ left: '8px', background: 'var(--border)' }}
                  ></div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                    {displayExperiences.map((item, index) => (
                      <div key={item.id || index} className="relative">
                        <div 
                          className="absolute top-0 rounded-full" 
                          style={{ 
                            left: '-28px', 
                            marginTop: '2px',
                            width: '8px',
                            height: '8px',
                            background: 'var(--blue)'
                          }}
                        ></div>
                        <div>
                          <h4 
                            className="font-semibold"
                            style={{
                              fontSize: '20px',
                              lineHeight: '26px',
                              color: 'var(--text-primary)',
                              marginBottom: 'var(--space-2)',
                            }}
                          >
                            {item.title || 'Untitled Position'}
                          </h4>
                          <div className="flex items-center gap-2" style={{ marginBottom: 'var(--space-2)' }}>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                              {item.company || 'Company'}
                            </p>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '12px', opacity: 0.6 }}>•</span>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                              {formatExperiencePeriod(item.startDate, item.endDate) || 'Date'}
                            </p>
                          </div>
                          {item.description && (
                            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '20px' }}>
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                // Placeholder for empty experience
                <p 
                  style={{
                    color: 'var(--text-tertiary)',
                    fontSize: '15px',
                    fontStyle: 'italic',
                    textAlign: 'center',
                    padding: 'var(--space-6) 0',
                  }}
                >
                  {isOwnProfile ? 'Tap Customize to add experience' : 'No experience added yet'}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Skills Section */}
      <div 
        className="border relative"
        style={{
          background: 'var(--bg-surface)',
          borderColor: canEdit ? 'rgba(0, 194, 255, 0.3)' : 'var(--border)',
          borderRadius: 'var(--radius-xl)',
        }}
      >
        {/* Drag Handle */}
        {canEdit && (
          <div 
            className="drag-handle"
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: '32px',
              background: 'linear-gradient(90deg, rgba(0, 194, 255, 0.12) 0%, rgba(0, 194, 255, 0.04) 100%)',
              borderRight: '1px solid rgba(0, 194, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(0, 194, 255, 0.7)',
              cursor: 'grab',
              borderTopLeftRadius: 'var(--radius-xl)',
              borderBottomLeftRadius: 'var(--radius-xl)',
            }}
          >
            <GripVerticalIcon size={16} strokeWidth={2.5} />
          </div>
        )}

        <div 
          style={{ 
            padding: 'var(--space-4)',
            marginLeft: canEdit ? '32px' : '0',
            transition: 'margin-left 0.2s ease',
          }}
        >
          <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-4)' }}>
            <h3 
              className="font-semibold"
              style={{
                fontSize: '18px',
                lineHeight: '24px',
                fontWeight: '600',
                color: 'var(--text-primary)',
              }}
            >
              Skills
            </h3>
            {isSavingSkills && (
              <span style={{ fontSize: '12px', color: 'var(--blue)' }}>Saving...</span>
            )}
          </div>

          {canEdit ? (
            // Editable mode
            <div style={{ maxWidth: '336px', margin: '0 auto' }}>
              {skills.length > 0 && (
                <div style={{ marginBottom: 'var(--space-4)' }}>
                  {skills.map((skill, index) => (
                    <div 
                      key={index} 
                      className="relative"
                      style={{ 
                        marginBottom: index < skills.length - 1 ? 'var(--space-4)' : '0',
                        padding: '12px',
                        background: 'var(--bg-surface-strong)',
                        borderRadius: '12px',
                        border: '1px solid var(--border)',
                      }}
                    >
                      {/* Minus Badge */}
                      <div 
                        className="minus-badge"
                        onClick={() => removeSkill(index)}
                        style={{
                          position: 'absolute',
                          top: '-6px',
                          right: '-6px',
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: 'rgba(255, 59, 48, 0.95)',
                          border: '2px solid var(--bg-primary)',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          zIndex: 10,
                          boxShadow: '0 2px 8px rgba(255, 59, 48, 0.4)',
                        }}
                      >
                        <MinusIcon size={12} strokeWidth={3} />
                      </div>
                      
                      <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-2)' }}>
                        <span style={{ color: 'var(--text-primary)', fontSize: '15px', fontWeight: '600' }}>{skill.name}</span>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{skill.level}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={skill.level}
                        onChange={(e) => updateSkillLevel(index, parseInt(e.target.value))}
                        className="w-full appearance-none cursor-pointer compact-slider"
                        style={{
                          height: '4px',
                          background: 'rgba(255, 255, 255, 0.08)',
                          borderRadius: '2px',
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Add Skill Input */}
              {skills.length < 6 && (
                <div className="flex" style={{ gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                  <input
                    type="text"
                    value={newSkillName}
                    onChange={(e) => setNewSkillName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                    placeholder="Add a skill"
                    className="edit-field flex-1"
                    style={{
                      padding: '8px 12px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                    }}
                  />
                  <button
                    onClick={addSkill}
                    disabled={!newSkillName.trim()}
                    style={{
                      padding: '8px 16px',
                      background: newSkillName.trim() ? 'var(--blue)' : 'rgba(255, 255, 255, 0.04)',
                      border: 'none',
                      borderRadius: '8px',
                      color: newSkillName.trim() ? 'white' : 'var(--text-tertiary)',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: newSkillName.trim() ? 'pointer' : 'not-allowed',
                    }}
                  >
                    Add
                  </button>
                </div>
              )}

              {/* Add Card placeholder if no skills */}
              {skills.length === 0 && (
                <button 
                  onClick={() => document.querySelector<HTMLInputElement>('.edit-field.flex-1')?.focus()}
                  className="add-card w-full"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '14px',
                    borderRadius: '12px',
                    background: 'rgba(0, 194, 255, 0.08)',
                    border: '1.5px dashed rgba(0, 194, 255, 0.3)',
                    color: 'var(--blue)',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  <PlusIcon className="w-4 h-4" />
                  Add Skills
                </button>
              )}
            </div>
          ) : (
            // Display mode
            <div style={{ maxWidth: '336px', margin: '0 auto' }}>
              {displaySkills.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  {displaySkills.map((skill, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-2)' }}>
                        <span style={{ color: 'var(--text-primary)', fontSize: '15px', fontWeight: '600' }}>{skill.name}</span>
                      </div>
                      <div 
                        className="w-full rounded-full overflow-hidden"
                        style={{
                          height: '8px',
                          background: 'var(--bg-surface-strong)',
                        }}
                      >
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ 
                            width: `${skill.level}%`,
                            background: 'linear-gradient(90deg, #00C2FF 0%, #0099CC 100%)',
                            boxShadow: '0 0 8px rgba(0, 194, 255, 0.4)',
                            transitionDuration: '500ms',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Placeholder for empty skills
                <p 
                  style={{
                    color: 'var(--text-tertiary)',
                    fontSize: '15px',
                    fontStyle: 'italic',
                    textAlign: 'center',
                    padding: 'var(--space-6) 0',
                  }}
                >
                  {isOwnProfile ? 'Tap Customize to add skills' : 'No skills added yet'}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Connect Section */}
      <div 
        className="border relative"
        style={{
          background: 'var(--bg-surface)',
          borderColor: canEdit ? 'rgba(0, 194, 255, 0.3)' : 'var(--border)',
          borderRadius: 'var(--radius-xl)',
        }}
      >
        {/* Drag Handle */}
        {canEdit && (
          <div 
            className="drag-handle"
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: '32px',
              background: 'linear-gradient(90deg, rgba(0, 194, 255, 0.12) 0%, rgba(0, 194, 255, 0.04) 100%)',
              borderRight: '1px solid rgba(0, 194, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(0, 194, 255, 0.7)',
              cursor: 'grab',
              borderTopLeftRadius: 'var(--radius-xl)',
              borderBottomLeftRadius: 'var(--radius-xl)',
            }}
          >
            <GripVerticalIcon size={16} strokeWidth={2.5} />
          </div>
        )}

        <div 
          style={{ 
            padding: 'var(--space-4)',
            marginLeft: canEdit ? '32px' : '0',
            transition: 'margin-left 0.2s ease',
          }}
        >
          <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-4)' }}>
            <h3 
              className="font-semibold"
              style={{
                fontSize: '18px',
                lineHeight: '24px',
                fontWeight: '600',
                color: 'var(--text-primary)',
              }}
            >
              Connect
            </h3>
            {canEdit && !showAddConnect && (
              <button
                onClick={() => setShowAddConnect(true)}
                style={{
                  padding: '6px 12px',
                  background: 'rgba(0, 194, 255, 0.1)',
                  border: '1px solid rgba(0, 194, 255, 0.3)',
                  borderRadius: '8px',
                  color: 'var(--blue)',
                  fontSize: '13px',
                  fontWeight: '600',
                }}
              >
                + Add
              </button>
            )}
          </div>

          {showAddConnect && canEdit ? (
            <div style={{ maxWidth: '336px', margin: '0 auto', position: 'relative', minHeight: '300px' }}>
              
              {/* Step 1: Platform Grid */}
              <div
                style={{
                  opacity: selectedPlatformForLink ? 0 : 1,
                  transform: selectedPlatformForLink ? 'scale(0.95)' : 'scale(1)',
                  transition: 'all 200ms cubic-bezier(0.25, 0.8, 0.25, 1)',
                  pointerEvents: selectedPlatformForLink ? 'none' : 'auto',
                  position: selectedPlatformForLink ? 'absolute' : 'relative',
                  inset: 0,
                }}
              >
                {Object.entries(PLATFORM_CATEGORIES).map(([categoryKey, category]) => (
                  <div key={categoryKey} style={{ marginBottom: 'var(--space-4)' }}>
                    <button
                      onClick={() => toggleCategory(categoryKey)}
                      className="w-full flex items-center justify-between transition"
                      style={{
                        padding: 'var(--space-2) 0',
                        color: 'var(--text-secondary)',
                        fontSize: '11px',
                        fontWeight: '700',
                        letterSpacing: '0.8px',
                        textAlign: 'left',
                      }}
                    >
                      <span>{category.label}</span>
                      <span style={{ 
                        transform: expandedCategories[categoryKey] ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 200ms',
                      }}>▼</span>
                    </button>

                    {expandedCategories[categoryKey] && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-3)' }}>
                        {category.platforms.map((platform) => {
                          const isConnected = savedLinks.hasOwnProperty(platform.id);
                          return (
                            <button
                              key={platform.id}
                              onClick={() => !isConnected && handlePlatformClick(platform.id)}
                              disabled={isConnected}
                              className="transition"
                              style={{
                                aspectRatio: '1',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: isConnected ? 'var(--bg-surface-strong)' : 'var(--bg-surface)',
                                border: isConnected ? '2px solid var(--blue)' : '1px solid var(--border)',
                                borderRadius: 'var(--radius-lg)',
                                cursor: isConnected ? 'not-allowed' : 'pointer',
                                opacity: isConnected ? 0.5 : 1,
                                position: 'relative',
                              }}
                              title={platform.name}
                            >
                              <div style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {renderPlatformIcon(platform.icon, 28)}
                              </div>
                              {isConnected && (
                                <div style={{
                                  position: 'absolute',
                                  top: '4px',
                                  right: '4px',
                                  width: '16px',
                                  height: '16px',
                                  borderRadius: '50%',
                                  background: 'var(--blue)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '10px',
                                }}>✓</div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}

                <button
                  onClick={() => { setShowAddConnect(false); setSelectedPlatformForLink(null); setLinkUsername(''); }}
                  className="w-full transition"
                  style={{
                    height: 'var(--height-primary-btn)',
                    background: 'var(--bg-surface-strong)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: '15px',
                    fontWeight: '600',
                    marginTop: 'var(--space-4)',
                  }}
                >
                  Cancel
                </button>
              </div>

              {/* Step 2: Username Input */}
              <div
                style={{
                  opacity: selectedPlatformForLink ? 1 : 0,
                  transform: selectedPlatformForLink ? 'scale(1)' : 'scale(0.95)',
                  transition: 'all 200ms cubic-bezier(0.25, 0.8, 0.25, 1)',
                  pointerEvents: selectedPlatformForLink ? 'auto' : 'none',
                  position: selectedPlatformForLink ? 'relative' : 'absolute',
                  inset: 0,
                }}
              >
                {selectedPlatformForLink && getPlatformDetails(selectedPlatformForLink) && (
                  <div style={{ padding: 'var(--space-4)', background: 'var(--bg-surface-strong)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {renderPlatformIcon(getPlatformDetails(selectedPlatformForLink)!.icon, 32)}
                      </div>
                      <div>
                        <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '2px' }}>
                          {getPlatformDetails(selectedPlatformForLink)!.name}
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                          {getPlatformDetails(selectedPlatformForLink)!.domain}
                        </div>
                      </div>
                    </div>

                    <div style={{ marginBottom: 'var(--space-4)' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
                        Enter your username
                      </label>
                      <input
                        type="text"
                        value={linkUsername}
                        onChange={(e) => setLinkUsername(e.target.value)}
                        placeholder="yourhandle"
                        autoFocus
                        onKeyPress={(e) => e.key === 'Enter' && savePlatformLink()}
                        className="edit-field w-full"
                        style={{
                          padding: '8px 12px',
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '8px',
                          color: 'var(--text-primary)',
                          fontSize: '14px',
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <button
                        onClick={() => { setSelectedPlatformForLink(null); setLinkUsername(''); }}
                        className="flex-1 transition"
                        style={{
                          height: 'var(--height-primary-btn)',
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-md)',
                          color: 'var(--text-primary)',
                          fontSize: '15px',
                          fontWeight: '600',
                        }}
                      >
                        ← Back
                      </button>
                      <button
                        onClick={savePlatformLink}
                        disabled={!linkUsername.trim()}
                        className="flex-1 transition"
                        style={{
                          height: 'var(--height-primary-btn)',
                          background: linkUsername.trim() ? 'var(--blue)' : 'var(--bg-surface-strong)',
                          border: 'none',
                          borderRadius: 'var(--radius-md)',
                          color: linkUsername.trim() ? 'white' : 'var(--text-secondary)',
                          fontSize: '15px',
                          fontWeight: '600',
                          opacity: linkUsername.trim() ? 1 : 0.5,
                          cursor: linkUsername.trim() ? 'pointer' : 'not-allowed',
                        }}
                      >
                        Connect
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ maxWidth: '336px', margin: '0 auto' }}>
              {Object.keys(savedLinks).length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-3)' }}>
                  {Object.entries(savedLinks).map(([platformId, link]) => {
                    const platformDetails = getPlatformDetails(platformId);
                    if (!platformDetails) return null;
                    
                    return (
                      <div key={platformId} className="relative group">
                        <a
                          href={`https://${link}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="transition"
                          style={{
                            aspectRatio: '1',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'var(--bg-surface-strong)',
                            border: '2px solid var(--blue)',
                            borderRadius: 'var(--radius-lg)',
                            fontSize: '24px',
                            boxShadow: '0 0 0 4px var(--blue-10)',
                            position: 'relative',
                          }}
                          title={`${platformDetails.name}: ${link}`}
                        >
                          {renderPlatformIcon(platformDetails.icon, 28)}
                          <div style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            background: 'var(--blue)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '10px',
                            color: 'white',
                          }}>✓</div>
                        </a>
                        
                        {/* Remove button - only in customize mode */}
                        {canEdit && (
                          <div
                            onClick={() => removeConnect(platformId)}
                            className="minus-badge"
                            style={{
                              position: 'absolute',
                              top: '-6px',
                              left: '-6px',
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              background: 'rgba(255, 59, 48, 0.95)',
                              border: '2px solid var(--bg-primary)',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              zIndex: 10,
                              boxShadow: '0 2px 8px rgba(255, 59, 48, 0.4)',
                            }}
                          >
                            <MinusIcon size={12} strokeWidth={3} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                // Placeholder for empty connect
                <p 
                  style={{
                    color: 'var(--text-tertiary)',
                    fontSize: '15px',
                    fontStyle: 'italic',
                    textAlign: 'center',
                    padding: 'var(--space-6) 0',
                  }}
                >
                  {isOwnProfile ? 'Tap Customize to add social links' : 'No social links added yet'}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
