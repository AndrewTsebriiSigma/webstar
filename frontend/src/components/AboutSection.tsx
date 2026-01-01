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
    try {
      if (profile?.experience) {
        const exp = JSON.parse(profile.experience);
        // Migrate old format to new format if needed
        const migratedExp = exp.map((item: any) => ({
          id: item.id || Date.now().toString() + Math.random(),
          title: item.title || '',
          company: item.company || '',
          startDate: item.startDate || (item.period ? item.period.split(' - ')[0] : ''),
          endDate: item.endDate || (item.period && item.period.includes('Present') ? '' : (item.period ? item.period.split(' - ')[1] : '')),
          description: item.description || '',
        }));
        setExperiences(migratedExp);
      } else {
        setExperiences([]);
      }
    } catch {
      setExperiences([]);
    }
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
      // Store as JSON string with levels
      await profileAPI.updateMe({ skills: JSON.stringify(skills) });
      toast.success('Skills updated!');
      setEditingSkills(false);
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
      return () => document.removeEventListener('mousedown', handleClickOutside);
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
    <div className="space-y-4">
      {/* About Section */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white text-lg">About</h3>
          {isOwnProfile && !editingAbout && (
            <button
              onClick={startEditingAbout}
              className="p-1.5 hover:bg-gray-800 rounded-lg transition"
              title="Edit about"
            >
              <PencilIcon className="w-4 h-4 text-gray-400" />
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
              className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-white placeholder-gray-500"
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500">{aboutText.length}/250</span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingAbout(false);
                    setAboutText(profile?.about || '');
                  }}
                  className="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 rounded-lg transition text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={saveAbout}
                  className="px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
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
                <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap mb-2">
                  {profile.about.length > 150 ? profile.about.substring(0, 150) + '...' : profile.about}
                </p>
                {profile.about.length > 150 && (
                  <button className="text-blue-500 hover:text-blue-500/80 text-sm font-medium transition">
                    Read more
                  </button>
                )}
              </>
            ) : (
              isOwnProfile && (
                <button
                  onClick={startEditingAbout}
                  className="w-full py-6 border-2 border-dashed border-gray-700 rounded-lg hover:border-blue-500 hover:bg-gray-800/50 transition text-gray-500 hover:text-blue-500"
                >
                  <PlusIcon className="w-6 h-6 mx-auto mb-1" />
                  <p className="text-xs font-medium">Add About</p>
                </button>
              )
            )}
          </div>
        )}
      </div>

      {/* Experience Section */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white text-lg">Experience</h3>
          {isOwnProfile && !editingExperience && (
            <button
              onClick={startEditingExperience}
              className="p-2 hover:bg-gray-800 rounded-lg transition"
              title="Edit experience"
            >
              <PencilIcon className="w-5 h-5 text-gray-400" />
            </button>
          )}
        </div>

        {editingExperience ? (
          <div className="w-[80%]">
            {experiences.length > 0 ? (
              <div className="space-y-4 mb-4">
                {experiences.map((exp, index) => (
                  <div key={exp.id} className="p-4 bg-gray-800 rounded-xl border border-gray-700">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="text-sm font-semibold text-blue-500">Experience {index + 1}</h4>
                      <button
                        onClick={() => removeExperience(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Creative Director"
                        value={exp.title}
                        onChange={(e) => updateExperience(index, 'title', e.target.value)}
                        maxLength={30}
                        className="w-full px-3 py-2 text-sm bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Vogue International"
                        value={exp.company}
                        onChange={(e) => updateExperience(index, 'company', e.target.value)}
                        maxLength={30}
                        className="w-full px-3 py-2 text-sm bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Start Date</label>
                          <SimpleCalendar
                            value={exp.startDate}
                            onChange={(date) => updateExperience(index, 'startDate', date)}
                            placeholder="Start date"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">End Date (leave empty for Present)</label>
                          <SimpleCalendar
                            value={exp.endDate}
                            onChange={(date) => updateExperience(index, 'endDate', date)}
                            placeholder="End date or Present"
                          />
                        </div>
                      </div>
                      <textarea
                        placeholder="Leading creative vision for editorial campaigns across Europe and Asia markets."
                        value={exp.description}
                        onChange={(e) => updateExperience(index, 'description', e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 text-sm bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 resize-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            <button
              onClick={addExperience}
              className="w-full py-3 bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-xl transition text-blue-500 font-medium flex items-center justify-center gap-2"
            >
              <PlusIcon className="w-5 h-5" />
              Add Experience
            </button>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  setEditingExperience(false);
                }}
                className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition text-white"
              >
                Cancel
              </button>
              <button
                onClick={saveExperience}
                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="w-[80%]">
            {displayExperiences.length > 0 ? (
              <div className="relative" style={{ paddingLeft: '32px' }}>
                {/* Vertical line - positioned to pass through circle center at 8px from container edge */}
                <div className="absolute top-0 bottom-0 w-px bg-gray-700" style={{ left: '8px' }}></div>
                <div className="space-y-6">
                  {displayExperiences.map((item, index) => (
                    <div key={item.id || index} className="relative">
                      {/* Blue dot - 8px circle centered at 8px (left edge at 4px) */}
                      <div className="absolute top-0 w-2 h-2 bg-blue-500 rounded-full" style={{ left: '-28px', marginTop: '2px' }}></div>
          <div>
                        <h4 className="font-semibold text-white text-sm mb-1">{item.title}</h4>
                        <p className="text-blue-500 text-sm mb-1">{item.company}</p>
                        <p className="text-gray-500 text-sm mb-2">
                          {formatExperiencePeriod(item.startDate, item.endDate)}
                        </p>
                          {item.description && (
                            <p className="text-gray-400 text-sm leading-relaxed">{item.description}</p>
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
                  className="w-full py-8 border-2 border-dashed border-gray-700 rounded-xl hover:border-blue-500 hover:bg-gray-800/50 transition text-gray-500 hover:text-blue-500"
                >
                  <PlusIcon className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm font-medium">Add Experience</p>
                </button>
              )
            )}
          </div>
        )}
      </div>

      {/* Skills Section */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white text-lg">Skills</h3>
          {isOwnProfile && !editingSkills && (
            <button
              onClick={startEditingSkills}
              className="p-2 hover:bg-gray-800 rounded-lg transition"
              title="Edit skills"
            >
              <PencilIcon className="w-5 h-5 text-gray-400" />
            </button>
          )}
        </div>

        {editingSkills ? (
          <div className="w-[80%]">
            {skills.length > 0 && (
              <div className="space-y-4 mb-4">
                {skills.map((skill, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white text-sm font-medium">{skill.name}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={skill.level}
                      onChange={(e) => updateSkillLevel(index, parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb"
                    />
                  </div>
                ))}
              </div>
            )}

            {skills.length < 6 && (
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                  placeholder="Add a skill (max 6)"
                  className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={addSkill}
                  disabled={skills.length >= 6}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:opacity-50 transition"
                >
                  Add
                </button>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditingSkills(false);
                  setNewSkillName('');
                }}
                className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition text-white"
              >
                Cancel
              </button>
              <button
                onClick={saveSkills}
                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="w-[80%]">
            {displaySkills.length > 0 ? (
              <div className="space-y-4">
                {displaySkills.map((skill, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white text-sm font-medium">{skill.name}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${skill.level}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              isOwnProfile && (
                <button
                  onClick={startEditingSkills}
                  className="w-full py-8 border-2 border-dashed border-gray-700 rounded-xl hover:border-blue-500 hover:bg-gray-800/50 transition text-gray-500 hover:text-blue-500"
                >
                  <PlusIcon className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm font-medium">Add Skills</p>
                </button>
              )
            )}
          </div>
        )}
      </div>

      {/* Connect Section */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white text-lg">Connect</h3>
          {isOwnProfile && !showAddConnect && (
            <button
              onClick={() => setShowAddConnect(true)}
              className="p-2 hover:bg-gray-800 rounded-lg transition"
              title="Add social link"
            >
              <PlusIcon className="w-5 h-5 text-gray-400" />
            </button>
          )}
        </div>

        {showAddConnect && isOwnProfile ? (
          <div className="w-[80%] mx-auto">
            <div className="flex items-center gap-2 mb-4">
              {/* Platform Selector */}
              <div className="relative flex-1" ref={platformSelectorRef}>
                <button
                  onClick={() => setShowPlatformSelector(!showPlatformSelector)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white flex items-center justify-center gap-2 hover:bg-gray-750 transition"
                >
                  {selectedPlatform ? (
                    <>
                      {selectedPlatform === 'instagram' && (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                      )}
                      {selectedPlatform === 'linkedin' && (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                      )}
                      {selectedPlatform === 'facebook' && (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                      )}
                      <span className="capitalize">{selectedPlatform}</span>
                    </>
                  ) : (
                    <span className="text-gray-400">Select platform</span>
                  )}
                </button>
                {showPlatformSelector && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50">
                    <button
                      onClick={() => {
                        setSelectedPlatform('instagram');
                        setShowPlatformSelector(false);
                      }}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-700 transition text-white"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                      <span>Instagram</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPlatform('linkedin');
                        setShowPlatformSelector(false);
                      }}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-700 transition text-white border-t border-gray-700"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                      <span>LinkedIn</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPlatform('facebook');
                        setShowPlatformSelector(false);
                      }}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-700 transition text-white border-t border-gray-700"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      <span>Facebook</span>
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
                className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />

              {/* Save Button */}
              <button
                onClick={saveConnect}
                className="px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition font-medium"
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
                className="px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="w-[80%]">
            {Object.keys(savedLinks).length > 0 ? (
              <div className="flex flex-wrap gap-4">
                {Object.entries(savedLinks).map(([platform, link]) => (
                  <div key={platform} className="relative group">
                    <a
                      href={`https://${link}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-12 h-12 bg-gray-800 hover:bg-gray-700 rounded-lg transition"
                    >
                      {platform === 'instagram' && (
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                      )}
                      {platform === 'linkedin' && (
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                      )}
                      {platform === 'facebook' && (
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                      )}
                    </a>
                    {isOwnProfile && (
                      <button
                        onClick={() => removeConnect(platform)}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                      >
                        <XMarkIcon className="w-3 h-3 text-white" />
                    </button>
                    )}
                  </div>
                ))}
                    </div>
            ) : (
              isOwnProfile && (
                <div className="text-center py-8 text-gray-500 text-sm">
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
