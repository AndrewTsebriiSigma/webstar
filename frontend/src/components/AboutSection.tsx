'use client';

import { useState, useEffect, useRef } from 'react';
import { PencilIcon, PlusIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { profileAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import SimpleCalendar from './SimpleCalendar';

interface AboutSectionProps {
  isOwnProfile: boolean;
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

export default function AboutSection({ isOwnProfile, profile, onUpdate }: AboutSectionProps) {
  // About editing
  const [editingAbout, setEditingAbout] = useState(false);
  const [aboutText, setAboutText] = useState('');
  const [displayPlaceholder, setDisplayPlaceholder] = useState(PLACEHOLDER_TEXTS[0]);
  const placeholderIndexRef = useRef(0);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showFullAbout, setShowFullAbout] = useState(false);

  // Skills editing
  const [editingSkills, setEditingSkills] = useState(false);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [newSkillName, setNewSkillName] = useState('');

  // Experience editing
  const [editingExperience, setEditingExperience] = useState(false);
  const [experiences, setExperiences] = useState<Experience[]>([]);

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

  // Dynamic placeholder animation
  useEffect(() => {
    if (!editingAbout) {
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
      if (!editingAbout) return;

      if (isDeleting) {
        if (charIndex > 0) {
          charIndex--;
          setDisplayPlaceholder(currentText.substring(0, charIndex));
          animationTimeoutRef.current = setTimeout(animate, 50);
        } else {
          // Switch to next text
          isDeleting = false;
          currentTextIndex = (currentTextIndex + 1) % PLACEHOLDER_TEXTS.length;
          placeholderIndexRef.current = currentTextIndex;
          currentText = PLACEHOLDER_TEXTS[currentTextIndex];
          charIndex = 0;
          // Wait 500ms before typing
          animationTimeoutRef.current = setTimeout(animate, 500);
        }
      } else {
        if (charIndex < currentText.length) {
          charIndex++;
          setDisplayPlaceholder(currentText.substring(0, charIndex));
          animationTimeoutRef.current = setTimeout(animate, 50);
        } else {
          // Wait 3 seconds before deleting
          isDeleting = true;
          animationTimeoutRef.current = setTimeout(animate, 3000);
        }
      }
    };

    // Start animation after initial delay
    animationTimeoutRef.current = setTimeout(animate, 3000);

    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, [editingAbout]);

  // Platform categories configuration
  const PLATFORM_CATEGORIES = {
    social: {
      label: 'SOCIAL',
      platforms: [
        { id: 'instagram', name: 'Instagram', icon: '📷', color: '#E4405F', domain: 'instagram.com' },
        { id: 'facebook', name: 'Facebook', icon: '👤', color: '#1877F2', domain: 'facebook.com' },
        { id: 'x', name: 'X', icon: '𝕏', color: '#000000', domain: 'x.com' },
        { id: 'snapchat', name: 'Snapchat', icon: '👻', color: '#FFFC00', domain: 'snapchat.com' },
        { id: 'pinterest', name: 'Pinterest', icon: '📌', color: '#E60023', domain: 'pinterest.com' },
        { id: 'tiktok', name: 'TikTok', icon: '🎵', color: '#000000', domain: 'tiktok.com' },
        { id: 'reddit', name: 'Reddit', icon: '🤖', color: '#FF4500', domain: 'reddit.com' },
      ]
    },
    professional: {
      label: 'PROFESSIONAL',
      platforms: [
        { id: 'linkedin', name: 'LinkedIn', icon: 'in', color: '#0A66C2', domain: 'linkedin.com' },
        { id: 'github', name: 'GitHub', icon: '⚡', color: '#181717', domain: 'github.com' },
        { id: 'behance', name: 'Behance', icon: 'Be', color: '#1769FF', domain: 'behance.net' },
        { id: 'dribbble', name: 'Dribbble', icon: '🏀', color: '#EA4C89', domain: 'dribbble.com' },
      ]
    },
    creative: {
      label: 'CREATIVE',
      platforms: [
        { id: 'youtube', name: 'YouTube', icon: '▶️', color: '#FF0000', domain: 'youtube.com' },
        { id: 'spotify', name: 'Spotify', icon: '🎧', color: '#1DB954', domain: 'spotify.com' },
        { id: 'soundcloud', name: 'SoundCloud', icon: '☁️', color: '#FF3300', domain: 'soundcloud.com' },
      ]
    }
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
      // Find platform details
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

  const startEditingAbout = () => {
    setAboutText(profile?.about || '');
    setEditingAbout(true);
  };

  const startEditingSkills = () => {
    if (profile?.skills) {
      try {
        // Try parsing as JSON first (new format with levels)
        const parsed = JSON.parse(profile.skills);
        if (Array.isArray(parsed)) {
          setSkills(parsed);
        } else {
          // Fallback to comma-separated (old format)
          setSkills(profile.skills.split(',').map((s: string) => ({ name: s.trim(), level: 85 })));
        }
      } catch {
        // Comma-separated format
        setSkills(profile.skills.split(',').map((s: string) => ({ name: s.trim(), level: 85 })));
      }
    } else {
      setSkills([]);
    }
    setEditingSkills(true);
  };

  const startEditingExperience = () => {
    let existingExperiences: Experience[] = [];
    try {
      if (profile?.experience) {
        const exp = JSON.parse(profile.experience);
        // Migrate old format to new format if needed
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
    // Automatically add a new empty experience item when editing starts
    setExperiences([
      ...existingExperiences,
      {
        id: Date.now().toString() + Math.random(),
        title: '',
        company: '',
        startDate: '',
        endDate: '',
        description: '',
      },
    ]);
    setEditingExperience(true);
  };

  const saveAbout = async () => {
    try {
      await profileAPI.updateMe({ about: aboutText });
      toast.success('About updated!');
      setEditingAbout(false);
      onUpdate();
    } catch (error) {
      toast.error('Failed to update about');
    }
  };

  const saveSkills = async () => {
    try {
      // Auto-add new skill if user typed one but didn't click "Add"
      let skillsToSave = [...skills];
      if (newSkillName.trim() && skillsToSave.length < 6) {
        skillsToSave.push({ name: newSkillName.trim(), level: 85 });
        setNewSkillName('');
      }
      
      // Store as JSON string with levels
      await profileAPI.updateMe({ skills: JSON.stringify(skillsToSave) });
      toast.success('Skills updated!');
      setEditingSkills(false);
      setSkills(skillsToSave);
      onUpdate();
    } catch (error) {
      toast.error('Failed to update skills');
    }
  };

  const saveExperience = async () => {
    try {
      await profileAPI.updateMe({ experience: JSON.stringify(experiences) });
      toast.success('Experience updated!');
      setEditingExperience(false);
      onUpdate();
    } catch (error) {
      toast.error('Failed to update experience');
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

  const addSkill = () => {
    if (!newSkillName.trim()) return;
    if (skills.length >= 6) {
      toast.error('Maximum 6 skills allowed');
      return;
    }
    setSkills([...skills, { name: newSkillName.trim(), level: 85 }]);
    setNewSkillName('');
  };

  const removeSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const updateSkillLevel = (index: number, level: number) => {
    const updated = [...skills];
    updated[index].level = level;
    setSkills(updated);
  };

  const addExperience = () => {
    setExperiences([
      ...experiences,
      {
        id: Date.now().toString() + Math.random(),
        title: '',
        company: '',
        startDate: '',
        endDate: '',
        description: '',
      },
    ]);
  };

  const updateExperience = (index: number, field: keyof Experience, value: string) => {
    const updated = [...experiences];
    updated[index] = { ...updated[index], [field]: value };
    setExperiences(updated);
  };

  const removeExperience = (index: number) => {
    setExperiences(experiences.filter((_, i) => i !== index));
  };

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
  // Adds role + expertise as the first skill if available
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

  // Parse experiences for display (backward compatible)
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

  const displaySkills = getDisplaySkills();
  const displayExperiences = getDisplayExperiences();

  return (
    <div className="space-y-6">
      {/* About Section */}
      <div 
        className="rounded-xl p-4 border"
        style={{
          background: 'var(--bg-surface)',
          borderColor: 'var(--border)',
          borderRadius: 'var(--radius-xl)',
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
          {isOwnProfile && !editingAbout && (
            <button
              onClick={startEditingAbout}
              className="flex items-center justify-center transition"
              style={{
                width: 'var(--height-icon-button)',
                height: 'var(--height-icon-button)',
                borderRadius: 'var(--radius-md)',
              }}
              title="Edit about"
            >
              <PencilIcon className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
            </button>
          )}
        </div>

        {editingAbout ? (
          <div>
            <textarea
              value={aboutText}
              onChange={(e) => setAboutText(e.target.value)}
              maxLength={250}
              rows={4}
              placeholder={displayPlaceholder}
              className="w-full resize-none transition"
              style={{
                padding: 'var(--space-3) var(--space-4)',
                background: 'var(--bg-surface-strong)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontSize: '15px',
                lineHeight: '22px',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--blue)';
                e.target.style.boxShadow = '0 0 0 4px var(--blue-10)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border)';
                e.target.style.boxShadow = 'none';
              }}
            />
            <div className="flex items-center justify-between" style={{ marginTop: 'var(--space-2)' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{aboutText.length}/250</span>
              <div className="flex" style={{ gap: 'var(--space-2)' }}>
                <button
                  onClick={() => {
                    setEditingAbout(false);
                    setAboutText(profile?.about || '');
                  }}
                  className="transition"
                  style={{
                    padding: 'var(--space-2) var(--space-4)',
                    height: 'var(--height-primary-btn)',
                    background: 'var(--bg-surface-strong)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    color: 'var(--text-primary)',
                    fontSize: '15px',
                    fontWeight: '600',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={saveAbout}
                  className="transition"
                  style={{
                    padding: 'var(--space-2) var(--space-4)',
                    height: 'var(--height-primary-btn)',
                    background: 'var(--blue)',
                    border: 'none',
                    borderRadius: 'var(--radius-lg)',
                    color: 'white',
                    fontSize: '15px',
                    fontWeight: '600',
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        ) : (
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
              isOwnProfile && (
                <button
                  onClick={startEditingAbout}
                  className="w-full transition"
                  style={{
                    padding: 'var(--space-6) 0',
                    border: '2px dashed var(--border)',
                    borderRadius: 'var(--radius-md)',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <PlusIcon className="w-5 h-5 mx-auto" style={{ marginBottom: 'var(--space-1)' }} />
                  <p style={{ fontSize: '13px', fontWeight: '600' }}>Add About</p>
                </button>
              )
            )}
          </div>
        )}
      </div>

      {/* Experience Section */}
      <div 
        className="border"
        style={{
          background: 'var(--bg-surface)',
          borderColor: 'var(--border)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-4)',
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
          {isOwnProfile && !editingExperience && (
            <button
              onClick={startEditingExperience}
              className="flex items-center justify-center transition"
              style={{
                width: 'var(--height-icon-button)',
                height: 'var(--height-icon-button)',
                borderRadius: 'var(--radius-md)',
              }}
              title="Edit experience"
            >
              <PencilIcon className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
            </button>
          )}
        </div>

        {editingExperience ? (
          <div style={{ maxWidth: '336px', margin: '0 auto' }}>
            <div style={{ marginBottom: 'var(--space-4)' }}>
              {experiences.map((exp, index) => (
                <div 
                  key={exp.id} 
                  className="border"
                  style={{
                    padding: 'var(--space-4)',
                    background: 'var(--bg-surface-strong)',
                    borderRadius: 'var(--radius-xl)',
                    borderColor: 'var(--border)',
                    marginBottom: index < experiences.length - 1 ? 'var(--space-4)' : '0',
                  }}
                >
                    <div className="flex justify-between items-start" style={{ marginBottom: 'var(--space-3)' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--blue)' }}>Experience {index + 1}</h4>
                      <button
                        onClick={() => removeExperience(index)}
                        className="transition"
                        style={{ color: 'var(--error)' }}
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                      <input
                        type="text"
                        placeholder="Creative Director"
                        value={exp.title}
                        onChange={(e) => updateExperience(index, 'title', e.target.value)}
                        maxLength={30}
                        className="w-full transition"
                        style={{
                          padding: 'var(--space-2) var(--space-3)',
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-md)',
                          color: 'var(--text-primary)',
                          fontSize: '15px',
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Vogue International"
                        value={exp.company}
                        onChange={(e) => updateExperience(index, 'company', e.target.value)}
                        maxLength={30}
                        className="w-full transition"
                        style={{
                          padding: 'var(--space-2) var(--space-3)',
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-md)',
                          color: 'var(--text-primary)',
                          fontSize: '15px',
                        }}
                      />
                      <div className="grid grid-cols-2" style={{ gap: 'var(--space-3)' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>Start Date</label>
                          <SimpleCalendar
                            value={exp.startDate}
                            onChange={(date) => updateExperience(index, 'startDate', date)}
                            placeholder="Start date"
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>End Date</label>
                          <SimpleCalendar
                            value={exp.endDate}
                            onChange={(date) => updateExperience(index, 'endDate', date)}
                            placeholder="End date"
                          />
                        </div>
                      </div>
                      <textarea
                        placeholder="Leading creative vision for editorial campaigns across Europe and Asia markets."
                        value={exp.description}
                        onChange={(e) => updateExperience(index, 'description', e.target.value)}
                        rows={2}
                        className="w-full resize-none transition"
                        style={{
                          padding: 'var(--space-2) var(--space-3)',
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-md)',
                          color: 'var(--text-primary)',
                          fontSize: '15px',
                        }}
                      />
                    </div>
                  </div>
                ))}
            </div>

            <div className="flex" style={{ gap: 'var(--space-2)' }}>
              <button
                onClick={() => {
                  setEditingExperience(false);
                }}
                className="flex-1 transition"
                style={{
                  height: 'var(--height-primary-btn)',
                  background: 'var(--bg-surface-strong)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '15px',
                  fontWeight: '600',
                }}
              >
                Cancel
              </button>
              <button
                onClick={saveExperience}
                className="flex-1 transition"
                style={{
                  height: 'var(--height-primary-btn)',
                  background: 'var(--blue)',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  color: 'white',
                  fontSize: '15px',
                  fontWeight: '600',
                }}
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: '336px', margin: '0 auto' }}>
            {displayExperiences.length > 0 ? (
              <div className="relative" style={{ paddingLeft: '32px' }}>
                {/* Vertical line - positioned to pass through circle center at 8px from container edge */}
                <div 
                  className="absolute top-0 bottom-0 w-px" 
                  style={{ left: '8px', background: 'var(--border)' }}
                ></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                  {displayExperiences.map((item, index) => (
                    <div key={item.id || index} className="relative">
                      {/* Blue dot - 8px circle centered at 8px (left edge at 4px) */}
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
                          {item.title}
                        </h4>
                        <div className="flex items-center gap-2" style={{ marginBottom: 'var(--space-2)' }}>
                          <p 
                            style={{
                              color: 'var(--text-secondary)',
                              fontSize: '14px',
                            }}
                          >
                            {item.company}
                          </p>
                          <span 
                            style={{
                              color: 'var(--text-secondary)',
                              fontSize: '12px',
                              opacity: 0.6,
                            }}
                          >
                            •
                          </span>
                          <p 
                            style={{
                              color: 'var(--text-secondary)',
                              fontSize: '12px',
                            }}
                          >
                            {formatExperiencePeriod(item.startDate, item.endDate)}
                          </p>
                        </div>
                        {item.description && (
                          <p 
                            style={{
                              color: 'var(--text-secondary)',
                              fontSize: '14px',
                              lineHeight: '20px',
                            }}
                          >
                            {item.description}
                          </p>
                        )}
                      </div>
                        </div>
                      ))}
                    </div>
              </div>
            ) : (
              isOwnProfile && (
                <button
                  onClick={startEditingExperience}
                  className="w-full transition"
                  style={{
                    padding: 'var(--space-8) 0',
                    border: '2px dashed var(--border)',
                    borderRadius: 'var(--radius-xl)',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <PlusIcon className="w-6 h-6 mx-auto" style={{ marginBottom: 'var(--space-2)' }} />
                  <p style={{ fontSize: '15px', fontWeight: '600' }}>Add Experience</p>
                </button>
              )
            )}
          </div>
        )}
      </div>

      {/* Skills Section */}
      <div 
        className="border"
        style={{
          background: 'var(--bg-surface)',
          borderColor: 'var(--border)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-4)',
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
          {isOwnProfile && !editingSkills && (
            <button
              onClick={startEditingSkills}
              className="flex items-center justify-center transition"
              style={{
                width: 'var(--height-icon-button)',
                height: 'var(--height-icon-button)',
                borderRadius: 'var(--radius-md)',
              }}
              title="Edit skills"
            >
              <PencilIcon className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
            </button>
          )}
        </div>

        {editingSkills ? (
          <div style={{ maxWidth: '336px', margin: '0 auto' }}>
            {skills.length > 0 && (
              <div style={{ marginBottom: 'var(--space-4)' }}>
                {skills.map((skill, index) => (
                  <div key={index} style={{ marginBottom: index < skills.length - 1 ? 'var(--space-4)' : '0' }}>
                    <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-2)' }}>
                      <span style={{ color: 'var(--text-primary)', fontSize: '15px', fontWeight: '600' }}>{skill.name}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={skill.level}
                      onChange={(e) => updateSkillLevel(index, parseInt(e.target.value))}
                      className="w-full appearance-none cursor-pointer"
                      style={{
                        height: '8px',
                        background: 'var(--bg-surface-strong)',
                        borderRadius: 'var(--radius-pill)',
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            {skills.length < 6 && (
              <div className="flex" style={{ gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                <input
                  type="text"
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                  placeholder="Add a skill (max 6)"
                  className="flex-1 transition"
                  style={{
                    padding: 'var(--space-2) var(--space-4)',
                    height: 'var(--height-primary-btn)',
                    background: 'var(--bg-surface-strong)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: '15px',
                  }}
                />
                <button
                  onClick={addSkill}
                  disabled={skills.length >= 6}
                  className="transition"
                  style={{
                    padding: 'var(--space-2) var(--space-4)',
                    height: 'var(--height-primary-btn)',
                    background: 'var(--blue)',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    color: 'white',
                    fontSize: '15px',
                    fontWeight: '600',
                    opacity: skills.length >= 6 ? 0.45 : 1,
                  }}
                >
                  Add
                </button>
              </div>
            )}

            <div className="flex" style={{ gap: 'var(--space-2)' }}>
              <button
                onClick={() => {
                  setEditingSkills(false);
                  setNewSkillName('');
                }}
                className="flex-1 transition"
                style={{
                  height: 'var(--height-primary-btn)',
                  background: 'var(--bg-surface-strong)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '15px',
                  fontWeight: '600',
                }}
              >
                Cancel
              </button>
              <button
                onClick={saveSkills}
                className="flex-1 transition"
                style={{
                  height: 'var(--height-primary-btn)',
                  background: 'var(--blue)',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  color: 'white',
                  fontSize: '15px',
                  fontWeight: '600',
                }}
              >
                Save
              </button>
            </div>
          </div>
        ) : (
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
              isOwnProfile && (
                <button
                  onClick={startEditingSkills}
                  className="w-full transition"
                  style={{
                    padding: 'var(--space-8) 0',
                    border: '2px dashed var(--border)',
                    borderRadius: 'var(--radius-xl)',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <PlusIcon className="w-6 h-6 mx-auto" style={{ marginBottom: 'var(--space-2)' }} />
                  <p style={{ fontSize: '15px', fontWeight: '600' }}>Add Skills</p>
                </button>
              )
            )}
          </div>
        )}
      </div>

      {/* Connect Section */}
      <div 
        className="border"
        style={{
          background: 'var(--bg-surface)',
          borderColor: 'var(--border)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-4)',
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
          {isOwnProfile && !showAddConnect && (
            <button
              onClick={() => setShowAddConnect(true)}
              className="flex items-center justify-center transition"
              style={{
                width: 'var(--height-icon-button)',
                height: 'var(--height-icon-button)',
                borderRadius: 'var(--radius-md)',
              }}
              title="Add social link"
            >
              <PlusIcon className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
            </button>
          )}
        </div>

        {showAddConnect && isOwnProfile ? (
          <div style={{ maxWidth: '336px', margin: '0 auto', position: 'relative', minHeight: '300px' }}>
            
            {/* Step 1: Platform Grid (hidden when platform selected) */}
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
                  {/* Category Header */}
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

                  {/* Platform Grid */}
                  {expandedCategories[categoryKey] && (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: 'var(--space-3)',
                      }}
                    >
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
                              boxShadow: isConnected ? '0 0 0 4px var(--blue-10)' : 'none',
                              position: 'relative',
                            }}
                            title={platform.name}
                            onMouseEnter={(e) => {
                              if (!isConnected) {
                                e.currentTarget.style.borderColor = 'var(--blue)';
                                e.currentTarget.style.transform = 'scale(1.05)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isConnected) {
                                e.currentTarget.style.borderColor = 'var(--border)';
                                e.currentTarget.style.transform = 'scale(1)';
                              }
                            }}
                          >
                            <span
                              style={{
                                fontSize: '24px',
                                marginBottom: '4px',
                              }}
                            >
                              {platform.icon}
                            </span>
                            {isConnected && (
                              <div
                                style={{
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
                                }}
                              >
                                ✓
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}

              {/* Cancel Button */}
              <button
                onClick={() => {
                  setShowAddConnect(false);
                  setSelectedPlatformForLink(null);
                  setLinkUsername('');
                }}
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

            {/* Step 2: Username Input (shown when platform selected) */}
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
                <div
                  style={{
                    padding: 'var(--space-4)',
                    background: 'var(--bg-surface-strong)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-xl)',
                  }}
                >
                  {/* Platform Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: 'var(--radius-lg)',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                      }}
                    >
                      {getPlatformDetails(selectedPlatformForLink)!.icon}
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

                  {/* Username Input */}
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
                      className="w-full transition"
                      style={{
                        padding: 'var(--space-3) var(--space-4)',
                        height: 'var(--height-primary-btn)',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--text-primary)',
                        fontSize: '15px',
                      }}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <button
                      onClick={() => {
                        setSelectedPlatformForLink(null);
                        setLinkUsername('');
                      }}
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
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 'var(--space-3)',
                }}
              >
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
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.05)';
                          e.currentTarget.style.boxShadow = '0 0 0 4px var(--blue-20), 0 4px 12px rgba(0, 194, 255, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.boxShadow = '0 0 0 4px var(--blue-10)';
                        }}
                      >
                        {platformDetails.icon}
                        {/* Checkmark badge */}
                        <div
                          style={{
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
                          }}
                        >
                          ✓
                        </div>
                      </a>
                      
                      {/* Remove button (owner only) */}
                      {isOwnProfile && (
                        <button
                          onClick={() => removeConnect(platformId)}
                          className="transition"
                          style={{
                            position: 'absolute',
                            top: '-8px',
                            left: '-8px',
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: 'var(--error)',
                            border: '2px solid var(--bg-surface)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: '700',
                            opacity: 0,
                            cursor: 'pointer',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.opacity = '1';
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.opacity = '0';
                          }}
                        >
                          <XMarkIcon className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              isOwnProfile && (
                <div 
                  className="text-center"
                  style={{
                    padding: 'var(--space-8) 0',
                    color: 'var(--text-secondary)',
                    fontSize: '15px',
                  }}
                >
                  No social links added yet
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
