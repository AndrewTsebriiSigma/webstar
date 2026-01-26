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

// Platform names for Connect spinning cube
const CONNECT_PLATFORMS = ['YouTube', 'LinkedIn', 'Instagram', 'GitHub', 'Dribbble', 'Twitter'];

// Skeleton Shimmer Component - iOS/Telegram style
const SkeletonLine = ({ width = '100%', height = '12px', style = {} }: { width?: string; height?: string; style?: React.CSSProperties }) => (
  <div 
    className="skeleton-shimmer"
    style={{
      width,
      height,
      borderRadius: '6px',
      background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 2s ease-in-out infinite',
      ...style
    }}
  />
);

// Skeleton Progress Bar for Skills (no % sign, just number)
const SkeletonProgressBar = ({ labelWidth = '60%', percent = 75 }: { labelWidth?: string; percent?: number }) => (
  <div style={{ marginBottom: 'var(--space-3)' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
      <SkeletonLine width={labelWidth} height="14px" />
      <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.2)', fontWeight: 600 }}>{percent}</span>
    </div>
    <div 
      style={{
        height: '8px',
        borderRadius: '4px',
        background: 'rgba(255,255,255,0.04)',
        overflow: 'hidden'
      }}
    >
      <div
        className="skeleton-shimmer"
        style={{ 
          width: `${percent}%`,
          height: '100%',
          borderRadius: '4px',
          background: 'linear-gradient(90deg, rgba(0,194,255,0.15) 0%, rgba(0,194,255,0.25) 50%, rgba(0,194,255,0.15) 100%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 2s ease-in-out infinite',
        }}
      />
    </div>
  </div>
);

// Customize Icon Hint Component - "tap [icon] to..." format
const CustomizeHint = ({ text, isOwnProfile }: { text: string; isOwnProfile: boolean }) => {
  if (!isOwnProfile) return null;
  return (
    <p style={{ 
      fontSize: '12px', 
      color: 'var(--text-tertiary)', 
      textAlign: 'center',
      marginTop: 'var(--space-3)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '4px',
      opacity: 0.6
    }}>
      <span style={{ fontStyle: 'italic' }}>tap</span>
      <img 
        src="/palette.svg" 
        alt="" 
        style={{ 
          width: '12px', 
          height: '12px', 
          filter: 'invert(1) opacity(0.5)'
        }} 
      />
      <span style={{ fontStyle: 'italic' }}>{text}</span>
    </p>
  );
};

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
  const [showFullAbout, setShowFullAbout] = useState(false);
  const [isSavingAbout, setIsSavingAbout] = useState(false);
  const [aboutFocused, setAboutFocused] = useState(false);

  // Connect spinning cube animation
  const [connectPlatformIndex, setConnectPlatformIndex] = useState(0);
  const connectSpinRef = useRef<NodeJS.Timeout | null>(null);

  // Skills editing
  const [skills, setSkills] = useState<Skill[]>([]);
  const [newSkillName, setNewSkillName] = useState('');
  const [isSavingSkills, setIsSavingSkills] = useState(false);

  // Experience editing
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [isSavingExperience, setIsSavingExperience] = useState(false);
  const [expDescFocused, setExpDescFocused] = useState<Record<number, boolean>>({});

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

  // Section reordering via drag & drop
  type SectionId = 'about' | 'experience' | 'skills' | 'connect';
  const [sectionOrder, setSectionOrder] = useState<SectionId[]>(['about', 'experience', 'skills', 'connect']);
  const [draggedSection, setDraggedSection] = useState<SectionId | null>(null);
  const [dragOverSection, setDragOverSection] = useState<SectionId | null>(null);

  // Load section order from localStorage
  useEffect(() => {
    const savedOrder = localStorage.getItem('about_section_order');
    if (savedOrder) {
      try {
        const parsed = JSON.parse(savedOrder);
        if (Array.isArray(parsed) && parsed.length === 4) {
          setSectionOrder(parsed as SectionId[]);
        }
      } catch {
        // Keep default order
      }
    }
  }, []);

  // Drag handlers for section reordering
  const handleDragStart = (e: React.DragEvent, sectionId: SectionId) => {
    setDraggedSection(sectionId);
    e.dataTransfer.effectAllowed = 'move';
    // Add visual feedback
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = '0.5';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = '1';
    setDraggedSection(null);
    setDragOverSection(null);
  };

  const handleDragOver = (e: React.DragEvent, sectionId: SectionId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedSection && draggedSection !== sectionId) {
      setDragOverSection(sectionId);
    }
  };

  const handleDragLeave = () => {
    setDragOverSection(null);
  };

  const handleDrop = (e: React.DragEvent, targetSectionId: SectionId) => {
    e.preventDefault();
    if (!draggedSection || draggedSection === targetSectionId) return;

    const newOrder = [...sectionOrder];
    const draggedIndex = newOrder.indexOf(draggedSection);
    const targetIndex = newOrder.indexOf(targetSectionId);

    // Swap the sections
    newOrder[draggedIndex] = targetSectionId;
    newOrder[targetIndex] = draggedSection;

    setSectionOrder(newOrder);
    localStorage.setItem('about_section_order', JSON.stringify(newOrder));
    toast.success('Section order updated!');

    setDraggedSection(null);
    setDragOverSection(null);
  };

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

  // Connect spinning cube animation - cycle through platform names
  useEffect(() => {
    const hasSocialLinks = profile?.social_links && Object.keys(JSON.parse(profile.social_links || '{}')).length > 0;
    
    // Stop rotation if user has social links and NOT in customize mode
    // Allow rotation in customize mode for the Connect section hint text
    if (hasSocialLinks && !isCustomizeMode) {
      if (connectSpinRef.current) {
        clearTimeout(connectSpinRef.current);
      }
      return;
    }

    const spin = () => {
      setConnectPlatformIndex(prev => (prev + 1) % CONNECT_PLATFORMS.length);
      connectSpinRef.current = setTimeout(spin, 2000);
    };

    connectSpinRef.current = setTimeout(spin, 2000);

    return () => {
      if (connectSpinRef.current) {
        clearTimeout(connectSpinRef.current);
      }
    };
  }, [profile?.social_links, isCustomizeMode]);

  // Platform categories configuration with image icons
  const PLATFORM_CATEGORIES = {
    social: {
      label: 'Social',
      platforms: [
        { id: 'instagram', name: 'Instagram', icon: '/icons/social.png', color: '#E4405F', domain: 'instagram.com' },
        { id: 'facebook', name: 'Facebook', icon: '/icons/facebook.png', color: '#1877F2', domain: 'facebook.com' },
        { id: 'x', name: 'X', icon: '/icons/twitter.png', color: '#000000', domain: 'x.com' },
        { id: 'snapchat', name: 'Snapchat', icon: '/icons/snapchat.png', color: '#FFFC00', domain: 'snapchat.com' },
        { id: 'pinterest', name: 'Pinterest', icon: '/icons/pinterest.png', color: '#E60023', domain: 'pinterest.com' },
        { id: 'tiktok', name: 'TikTok', icon: '/icons/tik-tok.png', color: '#000000', domain: 'tiktok.com' },
        { id: 'reddit', name: 'Reddit', icon: '/icons/reddit.png', color: '#FF4500', domain: 'reddit.com' },
      ]
    },
    professional: {
      label: 'Professional',
      platforms: [
        { id: 'linkedin', name: 'LinkedIn', icon: '/icons/linkedin.png', color: '#0A66C2', domain: 'linkedin.com' },
        { id: 'github', name: 'GitHub', icon: '/icons/github.png', color: '#181717', domain: 'github.com' },
        { id: 'behance', name: 'Behance', icon: '/icons/behance.png', color: '#1769FF', domain: 'behance.net' },
        { id: 'dribbble', name: 'Dribbble', icon: '/icons/dribbble.png', color: '#EA4C89', domain: 'dribbble.com' },
      ]
    },
    creative: {
      label: 'Creative',
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

  // Section wrapper with drag functionality
  const SectionWrapper = ({ 
    sectionId, 
    children 
  }: { 
    sectionId: SectionId; 
    children: React.ReactNode;
  }) => (
      <div 
      className="rounded-xl border relative"
      draggable={canEdit}
      onDragStart={(e) => canEdit && handleDragStart(e, sectionId)}
      onDragEnd={handleDragEnd}
      onDragOver={(e) => canEdit && handleDragOver(e, sectionId)}
      onDragLeave={handleDragLeave}
      onDrop={(e) => canEdit && handleDrop(e, sectionId)}
        style={{
          background: 'var(--bg-surface)',
        borderColor: dragOverSection === sectionId 
          ? 'rgba(0, 194, 255, 0.8)' 
          : canEdit 
            ? 'rgba(0, 194, 255, 0.3)' 
            : 'var(--border)',
          borderRadius: 'var(--radius-xl)',
        transform: dragOverSection === sectionId ? 'scale(1.02)' : 'scale(1)',
        transition: 'all 0.2s ease',
        boxShadow: dragOverSection === sectionId ? '0 0 20px rgba(0, 194, 255, 0.3)' : 'none',
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
            background: draggedSection === sectionId 
              ? 'linear-gradient(90deg, rgba(0, 194, 255, 0.3) 0%, rgba(0, 194, 255, 0.15) 100%)'
              : 'linear-gradient(90deg, rgba(0, 194, 255, 0.12) 0%, rgba(0, 194, 255, 0.04) 100%)',
            borderRight: '1px solid rgba(0, 194, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: draggedSection === sectionId ? 'rgba(0, 194, 255, 1)' : 'rgba(0, 194, 255, 0.7)',
            cursor: 'grab',
            borderTopLeftRadius: 'var(--radius-xl)',
            borderBottomLeftRadius: 'var(--radius-xl)',
          }}
        >
          <GripVerticalIcon size={16} strokeWidth={2.5} />
        </div>
      )}
      {children}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* CSS for skeleton shimmer animations - iOS/Telegram style */}
      <style jsx global>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes cubeFlip {
          0% { 
            opacity: 0; 
            transform: translateY(-12px) rotateX(-90deg);
          }
          50% {
            opacity: 0.5;
          }
          100% { 
            opacity: 1; 
            transform: translateY(0) rotateX(0deg);
          }
        }
      `}</style>
      
      {/* About Section */}
      <div 
        className="rounded-xl border relative"
        draggable={canEdit}
        onDragStart={(e) => canEdit && handleDragStart(e, 'about')}
        onDragEnd={handleDragEnd}
        onDragOver={(e) => canEdit && handleDragOver(e, 'about')}
        onDragLeave={handleDragLeave}
        onDrop={(e) => canEdit && handleDrop(e, 'about')}
        style={{
          order: sectionOrder.indexOf('about'),
          background: 'var(--bg-surface)',
          borderColor: dragOverSection === 'about' ? 'rgba(0, 194, 255, 0.8)' : 'var(--border)',
          borderRadius: 'var(--radius-xl)',
          transform: dragOverSection === 'about' ? 'scale(1.01)' : 'scale(1)',
          transition: 'all 0.2s ease',
          boxShadow: dragOverSection === 'about' ? '0 0 20px rgba(0, 194, 255, 0.3)' : 'none',
          opacity: draggedSection === 'about' ? 0.5 : 1,
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
          <label 
            className="font-semibold"
            style={{ 
              fontSize: '11px',
              lineHeight: '16px',
                    fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.5)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
                  }}
                >
            About
          </label>
            {isSavingAbout && (
            <span style={{ fontSize: '11px', color: 'var(--blue)' }}>Saving...</span>
          )}
              </div>

          {canEdit ? (
            // Editable mode - matching Edit Post styling
          <div style={{ maxWidth: '336px', margin: '0 auto', position: 'relative' }}>
            <div
              className="about-input-wrapper"
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '10px',
                position: 'relative',
                transition: 'all 0.2s ease',
              }}
            >
            <textarea
              value={aboutText}
              onChange={(e) => setAboutText(e.target.value)}
              maxLength={250}
              rows={4}
                placeholder="Tell us your incredible story..."
              style={{
                  width: '100%',
                  padding: '12px 14px',
                  paddingBottom: '28px',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  resize: 'none',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  lineHeight: '1.5',
                  caretColor: '#00C2FF',
              }}
              onFocus={(e) => {
                  setAboutFocused(true);
                  const wrapper = e.target.closest('.about-input-wrapper') as HTMLElement;
                  if (wrapper) {
                    wrapper.style.boxShadow = '0 0 0 1px rgba(0, 194, 255, 0.3)';
                    wrapper.style.border = '1px solid transparent';
                  }
              }}
              onBlur={(e) => {
                  setAboutFocused(false);
                  const wrapper = e.target.closest('.about-input-wrapper') as HTMLElement;
                  if (wrapper) {
                    wrapper.style.boxShadow = 'none';
                    wrapper.style.border = '1px solid rgba(255, 255, 255, 0.06)';
                  }
                }}
              />
              {/* Character count inside field - only show on focus */}
              {aboutFocused && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: '8px',
                    right: '12px',
                    fontSize: '11px',
                    color: 'rgba(255, 255, 255, 0.4)',
                  }}
                >
                  {aboutText.length}/250
                </span>
              )}
            </div>
          </div>
        ) : (
            // Display mode
          <div style={{ maxWidth: '336px', margin: '0 auto' }}>
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
                // Simple skeleton lines for empty about - 3+2 paragraphs
                <div 
                  style={{
                    padding: 'var(--space-4)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '12px',
                    maxWidth: '336px',
                    margin: '0 auto',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* Paragraph 1 - 3 lines */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <SkeletonLine width="100%" height="11px" />
                      <SkeletonLine width="90%" height="11px" />
                      <SkeletonLine width="65%" height="11px" />
                    </div>
                    
                    {/* Paragraph 2 - 2 lines */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <SkeletonLine width="95%" height="11px" />
                      <SkeletonLine width="50%" height="11px" />
                    </div>
                  </div>
                  <CustomizeHint text="to tell your story" isOwnProfile={isOwnProfile} />
          </div>
        )}
            </div>
          )}
        </div>
      </div>

      {/* Experience Section */}
      <div 
        className="border relative"
        draggable={canEdit}
        onDragStart={(e) => canEdit && handleDragStart(e, 'experience')}
        onDragEnd={handleDragEnd}
        onDragOver={(e) => canEdit && handleDragOver(e, 'experience')}
        onDragLeave={handleDragLeave}
        onDrop={(e) => canEdit && handleDrop(e, 'experience')}
        style={{
          order: sectionOrder.indexOf('experience'),
          background: 'var(--bg-surface)',
          borderColor: dragOverSection === 'experience' ? 'rgba(0, 194, 255, 0.8)' : 'var(--border)',
          borderRadius: 'var(--radius-xl)',
          transform: dragOverSection === 'experience' ? 'scale(1.01)' : 'scale(1)',
          transition: 'all 0.2s ease',
          boxShadow: dragOverSection === 'experience' ? '0 0 20px rgba(0, 194, 255, 0.3)' : 'none',
          opacity: draggedSection === 'experience' ? 0.5 : 1,
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
          <label 
            className="font-semibold"
            style={{
              fontSize: '11px',
              lineHeight: '16px',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.5)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Experience
          </label>
            {isSavingExperience && (
            <span style={{ fontSize: '11px', color: 'var(--blue)' }}>Saving...</span>
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
                  className="relative"
                  style={{
                    marginBottom: index < experiences.length - 1 ? '12px' : '0',
                  }}
                >
                  {/* Role + Company unified block (like Project title/description) */}
                  <div
                    className="exp-unified-wrapper"
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: '10px',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                    }}
                    onFocus={(e) => {
                      const wrapper = e.currentTarget;
                      wrapper.style.boxShadow = '0 0 0 1px rgba(0, 194, 255, 0.3)';
                      wrapper.style.border = '1px solid transparent';
                    }}
                    onBlur={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                        const wrapper = e.currentTarget;
                        wrapper.style.boxShadow = 'none';
                        wrapper.style.border = '1px solid rgba(255, 255, 255, 0.06)';
                      }
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
                      
                    {/* Role field - top */}
                      <input
                        type="text"
                      placeholder="Role*"
                        value={exp.title}
                        onChange={(e) => updateExperience(index, 'title', e.target.value)}
                        maxLength={30}
                        style={{
                        width: '100%',
                        padding: '12px 14px',
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: '#FFFFFF',
                        fontSize: '12px',
                        caretColor: '#00C2FF',
                      }}
                    />
                    
                    {/* Divider */}
                    <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.06)', margin: '0 14px' }} />
                    
                    {/* Company field */}
                      <input
                        type="text"
                      placeholder="Company"
                        value={exp.company}
                        onChange={(e) => updateExperience(index, 'company', e.target.value)}
                        maxLength={30}
                        style={{
                        width: '100%',
                        padding: '12px 14px',
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: '#FFFFFF',
                        fontSize: '12px',
                        caretColor: '#00C2FF',
                        }}
                      />
                  </div>

                  {/* Date unified block - simple dark style with horizontal divider */}
                  <div
                    className="date-unified-wrapper"
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: '10px',
                      marginTop: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      height: '44px',
                    }}
                  >
                    <input
                      type="text"
                              placeholder="Start"
                      value={exp.startDate ? new Date(exp.startDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''}
                      readOnly
                      onClick={() => {
                        // Will use SimpleCalendar logic later
                      }}
                      style={{
                        flex: '1 1 50%',
                        minWidth: 0,
                        padding: '0 14px',
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: exp.startDate ? '#FFFFFF' : 'rgba(255, 255, 255, 0.4)',
                        fontSize: '12px',
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    />
                    {/* Vertical divider */}
                    <div style={{ width: '1px', height: '24px', background: 'rgba(255, 255, 255, 0.1)', flexShrink: 0 }} />
                    <input
                      type="text"
                      placeholder="End"
                      value={exp.endDate ? new Date(exp.endDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''}
                      readOnly
                      onClick={() => {
                        // Will use SimpleCalendar logic later
                      }}
                      style={{
                        flex: '1 1 50%',
                        minWidth: 0,
                        padding: '0 14px',
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: exp.endDate ? '#FFFFFF' : 'rgba(255, 255, 255, 0.4)',
                        fontSize: '12px',
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                          />
                        </div>

                  {/* Description - emotional CTA */}
                  <div
                    className="exp-desc-wrapper"
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: '10px',
                      marginTop: '10px',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                    }}
                  >
                      <textarea
                      placeholder="What changed because of you..."
                        value={exp.description}
                        onChange={(e) => updateExperience(index, 'description', e.target.value)}
                      maxLength={150}
                        rows={2}
                        style={{
                        width: '100%',
                        padding: '12px 14px',
                        paddingBottom: '24px',
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        resize: 'none',
                        color: '#FFFFFF',
                        fontSize: '12px',
                        caretColor: '#00C2FF',
                        lineHeight: '1.5',
                      }}
                      onFocus={(e) => {
                        setExpDescFocused(prev => ({ ...prev, [index]: true }));
                        const wrapper = e.target.closest('.exp-desc-wrapper') as HTMLElement;
                        if (wrapper) {
                          wrapper.style.boxShadow = '0 0 0 1px rgba(0, 194, 255, 0.3)';
                          wrapper.style.border = '1px solid transparent';
                        }
                      }}
                      onBlur={(e) => {
                        setExpDescFocused(prev => ({ ...prev, [index]: false }));
                        const wrapper = e.target.closest('.exp-desc-wrapper') as HTMLElement;
                        if (wrapper) {
                          wrapper.style.boxShadow = 'none';
                          wrapper.style.border = '1px solid rgba(255, 255, 255, 0.06)';
                        }
                      }}
                    />
                    {/* Character count - only show on focus */}
                    {expDescFocused[index] && (
                      <span
                        style={{
                          position: 'absolute',
                          bottom: '6px',
                          right: '12px',
                          fontSize: '11px',
                          color: 'rgba(255, 255, 255, 0.4)',
                        }}
                      >
                        {exp.description?.length || 0}/150
                      </span>
                    )}
                    </div>
                  </div>
                ))}
            </div>
              )}

              {/* Add Card Button - Dashed style with icon (like profile header Add button) */}
              <button
                onClick={addExperience}
                className="add-card w-full transition-all active:scale-[0.98]"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  height: '32px',
                  padding: '5px 12px',
                  borderRadius: '8px',
                  background: 'rgba(0, 194, 255, 0.08)',
                  border: '1.5px dashed rgba(0, 194, 255, 0.6)',
                  color: 'var(--blue)',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                <PlusIcon className="w-3.5 h-3.5" />
                Add experience
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
                // Skeleton timeline card for empty experience - iOS style
                <div 
                            style={{
                    padding: 'var(--space-4)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '12px',
                    maxWidth: '336px',
                    margin: '0 auto',
                            }}
                          >
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    gap: 'var(--space-3)',
                  }}>
                    {/* Timeline dot - skeleton */}
                    <div 
                      className="skeleton-shimmer"
                            style={{
                        width: '10px', 
                        height: '10px', 
                        borderRadius: '50%', 
                        background: 'linear-gradient(90deg, rgba(0,194,255,0.2) 0%, rgba(0,194,255,0.3) 50%, rgba(0,194,255,0.2) 100%)',
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 2s ease-in-out infinite',
                        marginTop: '5px',
                        flexShrink: 0,
                      }} 
                    />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {/* Role skeleton */}
                      <SkeletonLine width="60%" height="16px" />
                      {/* Company + date row */}
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <SkeletonLine width="35%" height="12px" />
                        <span style={{ color: 'rgba(255,255,255,0.1)' }}>•</span>
                        <SkeletonLine width="25%" height="12px" />
                      </div>
                      {/* Description skeleton */}
                      <div style={{ marginTop: '4px' }}>
                        <SkeletonLine width="100%" height="10px" style={{ marginBottom: '6px' }} />
                        <SkeletonLine width="75%" height="10px" />
                      </div>
                        </div>
                      </div>
                  <CustomizeHint text="to show your journey" isOwnProfile={isOwnProfile} />
                    </div>
              )}
                        </div>
          )}
                    </div>
              </div>

      {/* Skills Section */}
      <div 
        className="border relative"
        draggable={canEdit}
        onDragStart={(e) => canEdit && handleDragStart(e, 'skills')}
        onDragEnd={handleDragEnd}
        onDragOver={(e) => canEdit && handleDragOver(e, 'skills')}
        onDragLeave={handleDragLeave}
        onDrop={(e) => canEdit && handleDrop(e, 'skills')}
                  style={{
          order: sectionOrder.indexOf('skills'),
          background: 'var(--bg-surface)',
          borderColor: dragOverSection === 'skills' ? 'rgba(0, 194, 255, 0.8)' : 'var(--border)',
                    borderRadius: 'var(--radius-xl)',
          transform: dragOverSection === 'skills' ? 'scale(1.01)' : 'scale(1)',
          transition: 'all 0.2s ease',
          boxShadow: dragOverSection === 'skills' ? '0 0 20px rgba(0, 194, 255, 0.3)' : 'none',
          opacity: draggedSection === 'skills' ? 0.5 : 1,
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
          <label 
            className="font-semibold"
            style={{
              fontSize: '11px',
              lineHeight: '16px',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.5)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Skills
          </label>
            {isSavingSkills && (
            <span style={{ fontSize: '11px', color: 'var(--blue)' }}>Saving...</span>
          )}
        </div>

          {canEdit ? (
            // Editable mode
          <div style={{ maxWidth: '336px', margin: '0 auto' }}>
            {skills.length > 0 && (
              <div style={{ marginBottom: 'var(--space-4)' }}>
                {skills.slice(0, 5).map((skill, index) => (
                    <div 
                      key={index} 
                      className="relative"
                      style={{ 
                        marginBottom: index < skills.length - 1 ? '12px' : '0',
                        padding: '12px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
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
                      
                    <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
                      <span style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: '600' }}>{skill.name}</span>
                      <span style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '12px', fontWeight: '500' }}>{skill.level}</span>
                    </div>
                    {/* Skill slider with blue fill */}
                    <div style={{ position: 'relative', height: '6px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '3px' }}>
                      {/* Blue fill up to thumb position */}
                      <div style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        height: '100%',
                        width: `${skill.level}%`,
                        background: 'linear-gradient(90deg, #00C2FF 0%, #0080FF 100%)',
                        borderRadius: '3px',
                        boxShadow: '0 0 8px rgba(0, 194, 255, 0.4)',
                        transition: 'width 0.1s ease',
                      }} />
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={skill.level}
                      onChange={(e) => updateSkillLevel(index, parseInt(e.target.value))}
                        onPointerDown={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        className="w-full appearance-none cursor-pointer"
                      style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          background: 'transparent',
                          margin: 0,
                          zIndex: 2,
                      }}
                    />
                    </div>
                  </div>
                ))}
              </div>
            )}

              {/* Add Skill Input - Unified block (Picture 2 style) - max 5 skills */}
            {skills.length < 5 && (
              <div
                className="skill-unified-wrapper"
                style={{
                  display: 'flex',
                  alignItems: 'stretch',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  marginBottom: 'var(--space-4)',
                  transition: 'all 0.2s ease',
                }}
              >
                <input
                  type="text"
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                  placeholder="Add a superpower..."
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#FFFFFF',
                    fontSize: '12px',
                    caretColor: '#00C2FF',
                  }}
                  onFocus={(e) => {
                    const wrapper = e.target.closest('.skill-unified-wrapper') as HTMLElement;
                    if (wrapper) {
                      wrapper.style.boxShadow = '0 0 0 1px rgba(0, 194, 255, 0.3)';
                      wrapper.style.border = '1px solid transparent';
                    }
                  }}
                  onBlur={(e) => {
                    const wrapper = e.target.closest('.skill-unified-wrapper') as HTMLElement;
                    if (wrapper) {
                      wrapper.style.boxShadow = 'none';
                      wrapper.style.border = '1px solid rgba(255, 255, 255, 0.08)';
                    }
                  }}
                />
                <button
                  onClick={addSkill}
                    disabled={!newSkillName.trim()}
                  className="transition-all active:scale-[0.98]"
                  style={{
                    padding: '0 20px',
                    background: newSkillName.trim() ? '#00C2FF' : 'rgba(255, 255, 255, 0.04)',
                    border: 'none',
                    borderRadius: '0 9px 9px 0',
                    color: newSkillName.trim() ? '#FFFFFF' : 'var(--text-tertiary)',
                    fontSize: '12px',
                    fontWeight: '600',
                      cursor: newSkillName.trim() ? 'pointer' : 'not-allowed',
                  }}
                >
                  Save
                </button>
              </div>
            )}

              {/* Add Card placeholder if no skills - Dashed style */}
              {skills.length === 0 && (
              <button
                onClick={() => {
                  const input = document.querySelector('.skill-unified-wrapper input') as HTMLInputElement;
                  if (input) input.focus();
                }}
                className="add-card w-full transition-all active:scale-[0.98]"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  gap: '6px',
                  height: '32px',
                  padding: '5px 12px',
                  borderRadius: '8px',
                    background: 'rgba(0, 194, 255, 0.08)',
                  border: '1.5px dashed rgba(0, 194, 255, 0.6)',
                    color: 'var(--blue)',
                  fontSize: '12px',
                  fontWeight: '600',
                  letterSpacing: '0.5px',
                    cursor: 'pointer',
                }}
              >
                <PlusIcon className="w-3.5 h-3.5" />
                Add a superpower
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
                    {/* Skill name on left, percentage on right */}
                    <div className="flex items-center justify-between" style={{ marginBottom: '6px' }}>
                      <span style={{ color: 'var(--text-primary)', fontSize: '15px', fontWeight: '600' }}>{skill.name}</span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600' }}>{skill.level}</span>
                    </div>
                    {/* Progress bar below */}
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
                // Skeleton progress bars for empty skills - iOS style
                <div 
                  style={{
                    padding: 'var(--space-4)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '12px',
                    maxWidth: '336px',
                    margin: '0 auto',
                  }}
                >
                  {/* Three skeleton skill bars with text left, number right, bar below */}
                  <SkeletonProgressBar labelWidth="55%" percent={85} />
                  <SkeletonProgressBar labelWidth="45%" percent={70} />
                  <SkeletonProgressBar labelWidth="60%" percent={55} />
                  
                  <CustomizeHint text="to show your superpowers" isOwnProfile={isOwnProfile} />
                    </div>
        )}
            </div>
          )}
        </div>
      </div>

      {/* Connect Section */}
      <div 
        className="border relative"
        draggable={canEdit}
        onDragStart={(e) => canEdit && handleDragStart(e, 'connect')}
        onDragEnd={handleDragEnd}
        onDragOver={(e) => canEdit && handleDragOver(e, 'connect')}
        onDragLeave={handleDragLeave}
        onDrop={(e) => canEdit && handleDrop(e, 'connect')}
        style={{
          order: sectionOrder.indexOf('connect'),
          background: 'var(--bg-surface)',
          borderColor: dragOverSection === 'connect' ? 'rgba(0, 194, 255, 0.8)' : 'var(--border)',
          borderRadius: 'var(--radius-xl)',
          transform: dragOverSection === 'connect' ? 'scale(1.01)' : 'scale(1)',
          transition: 'all 0.2s ease',
          boxShadow: dragOverSection === 'connect' ? '0 0 20px rgba(0, 194, 255, 0.3)' : 'none',
          opacity: draggedSection === 'connect' ? 0.5 : 1,
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
          <label 
            className="font-semibold"
            style={{
              fontSize: '11px',
              lineHeight: '16px',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.5)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Connect
          </label>
            {canEdit && !showAddConnect && (
            <button
              onClick={() => setShowAddConnect(true)}
              style={{
                height: '24px',
                padding: '0 10px',
                background: 'rgba(0, 194, 255, 0.08)',
                border: '1.5px dashed rgba(0, 194, 255, 0.6)',
                borderRadius: '6px',
                  color: 'var(--blue)',
                fontSize: '11px',
                  fontWeight: '600',
                }}
              >
                + Add
            </button>
          )}
        </div>

          {showAddConnect && canEdit ? (
          <div style={{ maxWidth: '336px', margin: '0 auto' }}>
            
              {/* Step 1: Platform Grid - Only show when no platform selected */}
            {!selectedPlatformForLink && (
            <div>
              {Object.entries(PLATFORM_CATEGORIES).map(([categoryKey, category]) => (
                <div key={categoryKey} style={{ marginBottom: 'var(--space-4)' }}>
                  <button
                    onClick={() => toggleCategory(categoryKey)}
                    className="w-full flex items-center justify-between transition"
                    style={{
                      padding: 'var(--space-2) 0',
                      color: 'var(--text-secondary)',
                      fontSize: '13px',
                      fontWeight: '500',
                      letterSpacing: '0',
                      textAlign: 'left',
                    }}
                  >
                    <span>{category.label}</span>
                    <span style={{ 
                      transform: expandedCategories[categoryKey] ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 200ms',
                      fontSize: '10px',
                    }}>▼</span>
                  </button>

                  {expandedCategories[categoryKey] && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                      {category.platforms.map((platform) => {
                        const isConnected = savedLinks.hasOwnProperty(platform.id);
                        return (
                          <button
                            key={platform.id}
                            onClick={() => {
                              if (isConnected) {
                                // Edit existing - prefill the username
                                setSelectedPlatformForLink(platform.id);
                                setLinkUsername(savedLinks[platform.id] || '');
                              } else {
                                handlePlatformClick(platform.id);
                              }
                            }}
                            className="transition"
                            style={{
                              aspectRatio: '1',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: 'rgba(255, 255, 255, 0.02)',
                              border: '1px solid rgba(255, 255, 255, 0.06)',
                              borderRadius: '12px',
                              cursor: 'pointer',
                              position: 'relative',
                            }}
                            title={isConnected ? `${platform.name} (Edit)` : platform.name}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {renderPlatformIcon(platform.icon, 38)}
                            </div>
                            {/* Small dot indicator for connected - subtle, not checkmark */}
                            {isConnected && (
                                <div style={{
                                  position: 'absolute',
                                  bottom: '4px',
                                  right: '4px',
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '50%',
                                  background: 'var(--blue)',
                                }}/>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}

              {/* Close picker button */}
              <button
                onClick={() => setShowAddConnect(false)}
                className="transition w-full"
                style={{
                  marginTop: 'var(--space-3)',
                  height: '32px',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'var(--text-tertiary)',
                  fontSize: '12px',
                  fontWeight: '500',
                  textAlign: 'center',
                }}
              >
                ← Back
              </button>
            </div>
            )}

              {/* Step 2: Username Input - ONE unified card like show.one */}
            {selectedPlatformForLink && getPlatformDetails(selectedPlatformForLink) && (() => {
              const isEditing = savedLinks.hasOwnProperty(selectedPlatformForLink);
              return (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '28px' }}>
                {/* Icon that pops above the card */}
            <div
              style={{
                    width: '52px', 
                    height: '52px', 
                    borderRadius: '50%', 
                    background: 'rgba(255, 255, 255, 0.06)', 
                    border: '1px solid rgba(255, 255, 255, 0.1)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    marginBottom: '-26px',
                    zIndex: 5,
                    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  {renderPlatformIcon(getPlatformDetails(selectedPlatformForLink)!.icon, 26)}
                    </div>

                {/* ONE unified card containing everything */}
                <div
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '16px',
                    overflow: 'visible',
                    position: 'relative',
                  }}
                >
                  {/* Red minus badge - only when editing existing link (top right) */}
                  {isEditing && (
                    <div
                      onClick={() => {
                        removeConnect(selectedPlatformForLink);
                        setSelectedPlatformForLink(null);
                        setLinkUsername('');
                        setShowAddConnect(false);
                      }}
                      className="minus-badge cursor-pointer"
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        background: 'rgba(255, 59, 48, 0.95)',
                        border: '2px solid var(--bg-primary)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10,
                        boxShadow: '0 2px 8px rgba(255, 59, 48, 0.4)',
                      }}
                    >
                      <MinusIcon size={12} strokeWidth={3} />
                      </div>
                  )}
                  
                  {/* Card content - compact */}
                  <div style={{ padding: '32px 16px 12px' }}>
                    {/* Platform name */}
                    <h3 style={{ 
                      fontSize: '16px', 
                      fontWeight: '600', 
                      color: 'var(--text-primary)', 
                      marginBottom: '12px',
                      textAlign: 'center',
                    }}>
                      {getPlatformDetails(selectedPlatformForLink)!.name}
                    </h3>

                    {/* Input field - simple, no label */}
                    <input
                      type="text"
                      value={linkUsername}
                      onChange={(e) => setLinkUsername(e.target.value)}
                      placeholder={`${getPlatformDetails(selectedPlatformForLink)!.domain}/...`}
                      autoFocus
                      onKeyPress={(e) => e.key === 'Enter' && savePlatformLink()}
                      className="connect-link-input"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                          background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                        outline: 'none',
                        color: '#FFFFFF',
                        fontSize: '13px',
                        caretColor: '#00C2FF',
                        transition: 'all 0.2s ease',
                      }}
                      onFocus={(e) => {
                        e.target.style.boxShadow = '0 0 0 2px rgba(0, 194, 255, 0.3)';
                        e.target.style.borderColor = 'rgba(0, 194, 255, 0.4)';
                      }}
                      onBlur={(e) => {
                        e.target.style.boxShadow = 'none';
                        e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                      }}
                    />
                  </div>

                  {/* Save/Link up button - attached to card bottom */}
                    <button
                    onClick={savePlatformLink}
                    disabled={!linkUsername.trim()}
                    className="transition-all active:scale-[0.98] w-full"
                      style={{
                      height: '42px',
                      background: linkUsername.trim() ? '#00C2FF' : 'rgba(255, 255, 255, 0.06)',
                      border: 'none',
                      borderRadius: '0 0 16px 16px',
                      color: linkUsername.trim() ? '#FFFFFF' : 'var(--text-tertiary)',
                        fontSize: '15px',
                        fontWeight: '600',
                      cursor: linkUsername.trim() ? 'pointer' : 'not-allowed',
                      }}
                    >
                    {isEditing ? 'Save' : 'Link up'}
                    </button>
                </div>
                
                {/* Back link - outside the card */}
                    <button
                  onClick={() => { 
                    setShowAddConnect(false); 
                    setSelectedPlatformForLink(null); 
                    setLinkUsername(''); 
                  }}
                  className="transition"
                      style={{
                    marginTop: '10px',
                    padding: '6px 12px',
                    background: 'transparent',
                        border: 'none',
                    color: 'var(--text-tertiary)',
                    fontSize: '12px',
                    fontWeight: '500',
                      }}
                    >
                  ← Back
                    </button>
                  </div>
              );
            })()}
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
                      {/* In customize mode: open edit modal. Otherwise: open external link */}
                      {canEdit ? (
                        <div
                          onClick={() => {
                            setShowAddConnect(true);
                            setSelectedPlatformForLink(platformId);
                            setLinkUsername(link);
                          }}
                          className="transition cursor-pointer"
                          style={{
                            aspectRatio: '1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'var(--bg-surface-strong)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-lg)',
                          }}
                          title={`Edit ${platformDetails.name}`}
                        >
                          {renderPlatformIcon(platformDetails.icon, 36)}
                        </div>
                      ) : (
                      <a
                        href={`https://${link}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="transition"
                        style={{
                          aspectRatio: '1',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'var(--bg-surface-strong)',
                            border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-lg)',
                        }}
                        title={`${platformDetails.name}: ${link}`}
                      >
                          {renderPlatformIcon(platformDetails.icon, 36)}
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
                // Skeleton connect placeholder - iOS style (matches actual grid layout)
                <div 
                  style={{
                    padding: 'var(--space-4)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '12px',
                    maxWidth: '336px',
                    margin: '0 auto',
                  }}
                >
                  {/* 4 Skeleton social icons - same grid as actual social links */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 'var(--space-3)',
                    marginBottom: 'var(--space-4)'
                  }}>
                    {[0, 1, 2, 3].map((i) => (
                      <div 
                        key={i}
                        className="skeleton-shimmer"
                        style={{
                          aspectRatio: '1',
                          borderRadius: 'var(--radius-lg)',
                          background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%)',
                          backgroundSize: '200% 100%',
                          animation: 'shimmer 2s ease-in-out infinite',
                        }}
                      />
                    ))}
                  </div>
                  
                  {/* Merged hint: "tap [icon] to link up your Instagram" */}
                  {isOwnProfile ? (
                    <p 
                      style={{ 
                        fontSize: '12px', 
                        color: 'var(--text-tertiary)',
                        textAlign: 'center',
                        marginTop: 'var(--space-2)',
                          display: 'flex',
                          alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        opacity: 0.6
                        }}
                      >
                      <span style={{ fontStyle: 'italic' }}>tap</span>
                        <img 
                        src="/palette.svg" 
                          alt="" 
                          style={{ 
                          width: '12px', 
                          height: '12px', 
                          filter: 'invert(1) opacity(0.5)'
                        }} 
                      />
                      <span style={{ fontStyle: 'italic' }}>to link up your</span>
                      <span 
                        style={{ 
                          display: 'inline-block',
                          width: '70px',
                          textAlign: 'left',
                        }}
                      >
                        <span 
                          key={connectPlatformIndex}
                          style={{ 
                            display: 'inline-block',
                            color: 'rgba(0, 194, 255, 0.8)',
                            fontWeight: 600,
                            fontSize: '11px',
                            animation: 'cubeFlip 0.5s ease-out'
                          }}
                        >
                          {CONNECT_PLATFORMS[connectPlatformIndex]}
                        </span>
                      </span>
                    </p>
                  ) : (
                  <p 
                    style={{ 
                      fontSize: '13px', 
                    color: 'var(--text-secondary)',
                      textAlign: 'center',
                        opacity: 0.6,
                        marginTop: 'var(--space-2)',
                  }}
                >
                      Link up your{' '}
                      <span 
                        style={{ 
                      display: 'inline-block',
                          width: '70px',
                          textAlign: 'left',
                        }}
                      >
                        <span 
                          key={connectPlatformIndex}
                          style={{ 
                            display: 'inline-block',
                            color: 'rgba(0, 194, 255, 0.8)',
                            fontWeight: 600,
                      fontSize: '12px', 
                            animation: 'cubeFlip 0.5s ease-out'
                          }}
                        >
                          {CONNECT_PLATFORMS[connectPlatformIndex]}
                        </span>
                      </span>
                    </p>
                  )}
                </div>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
