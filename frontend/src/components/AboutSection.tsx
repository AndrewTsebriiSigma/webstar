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
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [nickname, setNickname] = useState('');
  const [showPlatformSelector, setShowPlatformSelector] = useState(false);
  const [savedLinks, setSavedLinks] = useState<Record<string, string>>({});
  const platformSelectorRef = useRef<HTMLDivElement>(null);

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

  // Handle click outside platform selector
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (platformSelectorRef.current && !platformSelectorRef.current.contains(event.target as Node)) {
        setShowPlatformSelector(false);
      }
    }

    if (showPlatformSelector) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showPlatformSelector]);

  const saveConnect = async () => {
    if (!selectedPlatform || !nickname.trim()) {
      toast.error('Please select a platform and enter a nickname');
      return;
    }

    try {
      const platformDomains: Record<string, string> = {
        instagram: 'instagram.com',
        linkedin: 'linkedin.com',
        facebook: 'facebook.com',
        snapchat: 'snapchat.com',
        x: 'x.com',
        github: 'github.com',
        pinterest: 'pinterest.com',
      };

      const domain = platformDomains[selectedPlatform];
      const link = `${domain}/${nickname.trim()}`;
      
      const updatedLinks = { ...savedLinks, [selectedPlatform]: link };
      await profileAPI.updateMe({ social_links: JSON.stringify(updatedLinks) });
      
      setSavedLinks(updatedLinks);
      setShowAddConnect(false);
      setSelectedPlatform(null);
      setNickname('');
      setShowPlatformSelector(false);
      toast.success('Social link added!');
      onUpdate();
    } catch (error) {
      toast.error('Failed to save social link');
    }
  };

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

  // Parse skills for display (backward compatible)
  const getDisplaySkills = (): Skill[] => {
    if (!profile?.skills) return [];
    try {
      const parsed = JSON.parse(profile.skills);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      return profile.skills.split(',').map((s: string) => ({ name: s.trim(), level: 85 }));
    } catch {
      return profile.skills.split(',').map((s: string) => ({ name: s.trim(), level: 85 }));
    }
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
          <div style={{ maxWidth: '336px', margin: '0 auto' }}>
            <div className="flex items-center" style={{ gap: 'var(--space-1)', marginBottom: 'var(--space-2)' }}>
              {/* Platform Selector */}
              <div className="relative flex-1" ref={platformSelectorRef}>
              <button
                  onClick={() => setShowPlatformSelector(!showPlatformSelector)}
                  className="w-full flex items-center justify-center transition"
                  style={{
                    padding: 'var(--space-2)',
                    height: 'var(--height-primary-btn)',
                    background: 'var(--bg-surface-strong)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    gap: 'var(--space-1)',
                  }}
                >
                  {selectedPlatform ? (
                    <>
                      {selectedPlatform === 'instagram' && (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                      )}
                      {selectedPlatform === 'linkedin' && (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                      )}
                      {selectedPlatform === 'facebook' && (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                      )}
                      {selectedPlatform === 'snapchat' && (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.494-.166-.57-1.918-.222-2.95-.642-3.189-1.226-.031-.063-.052-.12-.055-.18-.015-.226.126-.464.359-.524 3.346-.54 4.766-3.915 4.791-3.951.151-.375.151-.645.09-.837-.195-.458-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-1.107-.435-1.257-.93-1.197-1.273.09-.479.674-.793 1.168-.793.146 0 .27.029.383.074.42.194.789.3 1.104.3.234 0 .384-.06.465-.105l-.046-.569c-.098-1.626-.225-3.651.307-4.837C7.392 1.077 10.739.807 11.727.807l.419-.015h.06z"/>
                        </svg>
                      )}
                      {selectedPlatform === 'x' && (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                      )}
                      {selectedPlatform === 'github' && (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                        </svg>
                      )}
                      {selectedPlatform === 'pinterest' && (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/>
                        </svg>
                      )}
                      <span className="capitalize" style={{ fontSize: '13px' }}>{selectedPlatform === 'x' ? 'X (Twitter)' : selectedPlatform}</span>
                    </>
                  ) : (
                    <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Select platform</span>
                  )}
              </button>
                {showPlatformSelector && (
                  <div 
                    className="absolute top-full left-0 right-0 z-50"
                    style={{
                      marginTop: '4px',
                      background: 'var(--bg-surface-strong)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: 'var(--shadow-card)',
                    }}
                  >
              <button
                      onClick={() => {
                        setSelectedPlatform('instagram');
                        setShowPlatformSelector(false);
                      }}
                      className="w-full flex items-center transition"
                      style={{
                        padding: 'var(--space-2)',
                        gap: 'var(--space-2)',
                        color: 'var(--text-primary)',
                        fontSize: '13px',
                      }}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                      <span>Instagram</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPlatform('linkedin');
                        setShowPlatformSelector(false);
                      }}
                      className="w-full flex items-center transition border-t"
                      style={{
                        padding: 'var(--space-2)',
                        gap: 'var(--space-2)',
                        color: 'var(--text-primary)',
                        fontSize: '13px',
                        borderTopColor: 'var(--border)',
                      }}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                      <span>LinkedIn</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPlatform('facebook');
                        setShowPlatformSelector(false);
                      }}
                      className="w-full flex items-center transition border-t"
                      style={{
                        padding: 'var(--space-2)',
                        gap: 'var(--space-2)',
                        color: 'var(--text-primary)',
                        fontSize: '13px',
                        borderTopColor: 'var(--border)',
                      }}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      <span>Facebook</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPlatform('snapchat');
                        setShowPlatformSelector(false);
                      }}
                      className="w-full flex items-center transition border-t"
                      style={{
                        padding: 'var(--space-2)',
                        gap: 'var(--space-2)',
                        color: 'var(--text-primary)',
                        fontSize: '13px',
                        borderTopColor: 'var(--border)',
                      }}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.494-.166-.57-1.918-.222-2.95-.642-3.189-1.226-.031-.063-.052-.12-.055-.18-.015-.226.126-.464.359-.524 3.346-.54 4.766-3.915 4.791-3.951.151-.375.151-.645.09-.837-.195-.458-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-1.107-.435-1.257-.93-1.197-1.273.09-.479.674-.793 1.168-.793.146 0 .27.029.383.074.42.194.789.3 1.104.3.234 0 .384-.06.465-.105l-.046-.569c-.098-1.626-.225-3.651.307-4.837C7.392 1.077 10.739.807 11.727.807l.419-.015h.06z"/>
                      </svg>
                      <span>Snapchat</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPlatform('x');
                        setShowPlatformSelector(false);
                      }}
                      className="w-full flex items-center transition border-t"
                      style={{
                        padding: 'var(--space-2)',
                        gap: 'var(--space-2)',
                        color: 'var(--text-primary)',
                        fontSize: '13px',
                        borderTopColor: 'var(--border)',
                      }}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                      <span>X (Twitter)</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPlatform('github');
                        setShowPlatformSelector(false);
                      }}
                      className="w-full flex items-center transition border-t"
                      style={{
                        padding: 'var(--space-2)',
                        gap: 'var(--space-2)',
                        color: 'var(--text-primary)',
                        fontSize: '13px',
                        borderTopColor: 'var(--border)',
                      }}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                      </svg>
                      <span>GitHub</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPlatform('pinterest');
                        setShowPlatformSelector(false);
                      }}
                      className="w-full flex items-center transition border-t"
                      style={{
                        padding: 'var(--space-2)',
                        gap: 'var(--space-2)',
                        color: 'var(--text-primary)',
                        fontSize: '13px',
                        borderTopColor: 'var(--border)',
                      }}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/>
                      </svg>
                      <span>Pinterest</span>
              </button>
            </div>
                )}
              </div>

              {/* Nickname Input */}
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="nickname"
                className="flex-1 transition"
                style={{
                  padding: 'var(--space-2)',
                  height: 'var(--height-primary-btn)',
                  background: 'var(--bg-surface-strong)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                }}
              />

              {/* Save Button */}
              <button
                onClick={saveConnect}
                className="transition whitespace-nowrap"
                style={{
                  padding: 'var(--space-2) var(--space-3)',
                  height: 'var(--height-primary-btn)',
                  background: 'var(--blue)',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  color: 'white',
                  fontSize: '13px',
                  fontWeight: '600',
                }}
              >
                Save
              </button>

              {/* Cancel Button */}
              <button
                onClick={() => {
                  setShowAddConnect(false);
                  setSelectedPlatform(null);
                  setNickname('');
                  setShowPlatformSelector(false);
                }}
                className="transition whitespace-nowrap"
                style={{
                  padding: 'var(--space-2) var(--space-3)',
                  height: 'var(--height-primary-btn)',
                  background: 'var(--bg-surface-strong)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: '336px', margin: '0 auto' }}>
            {Object.keys(savedLinks).length > 0 ? (
              <div className="flex flex-wrap" style={{ gap: 'var(--space-4)' }}>
                {Object.entries(savedLinks).map(([platform, link]) => (
                  <div key={platform} className="relative group">
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center transition"
                      style={{
                        width: 'var(--height-icon-button)',
                        height: 'var(--height-icon-button)',
                        background: 'var(--bg-surface-strong)',
                        borderRadius: 'var(--radius-md)',
                      }}
                    >
                      {platform === 'instagram' && (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--text-primary)' }}>
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                      )}
                      {platform === 'linkedin' && (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--text-primary)' }}>
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                      )}
                      {platform === 'facebook' && (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--text-primary)' }}>
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                      )}
                      {platform === 'snapchat' && (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--text-primary)' }}>
                          <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.494-.166-.57-1.918-.222-2.95-.642-3.189-1.226-.031-.063-.052-.12-.055-.18-.015-.226.126-.464.359-.524 3.346-.54 4.766-3.915 4.791-3.951.151-.375.151-.645.09-.837-.195-.458-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-1.107-.435-1.257-.93-1.197-1.273.09-.479.674-.793 1.168-.793.146 0 .27.029.383.074.42.194.789.3 1.104.3.234 0 .384-.06.465-.105l-.046-.569c-.098-1.626-.225-3.651.307-4.837C7.392 1.077 10.739.807 11.727.807l.419-.015h.06z"/>
                        </svg>
                      )}
                      {platform === 'x' && (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--text-primary)' }}>
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                      )}
                      {platform === 'github' && (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--text-primary)' }}>
                          <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                        </svg>
                      )}
                      {platform === 'pinterest' && (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--text-primary)' }}>
                          <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/>
                        </svg>
                      )}
                    </a>
                    {isOwnProfile && (
                      <button
                        onClick={() => removeConnect(platform)}
                        className="absolute transition flex items-center justify-center"
                        style={{
                          top: '-8px',
                          right: '-8px',
                          width: '20px',
                          height: '20px',
                          background: 'var(--error)',
                          borderRadius: '50%',
                          opacity: 0,
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
                      >
                        <XMarkIcon className="w-3 h-3" style={{ color: 'white' }} />
                      </button>
                    )}
                  </div>
                ))}
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
