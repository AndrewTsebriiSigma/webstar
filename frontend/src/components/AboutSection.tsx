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
                  <button className="text-blue-500 hover:text-blue-400 text-sm font-medium transition">
                    Read more
                  </button>
                )}
              </>
            ) : (
              isOwnProfile && (
                <button
                  onClick={startEditingAbout}
                  className="w-full py-6 border-2 border-dashed border-gray-700 rounded-lg hover:border-blue-500 hover:bg-gray-800/50 transition text-gray-500 hover:text-blue-400"
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
          <div>
            {experiences.length > 0 ? (
              <div className="space-y-4 mb-4">
                {experiences.map((exp, index) => (
                  <div key={exp.id} className="p-4 bg-gray-800 rounded-xl border border-gray-700">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="text-sm font-semibold text-blue-400">Experience {index + 1}</h4>
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
              className="w-full py-3 bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-xl transition text-blue-400 font-medium flex items-center justify-center gap-2"
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
          <div>
            {displayExperiences.length > 0 ? (
              <div className="relative pl-6">
                {/* Vertical line */}
                <div className="absolute left-0 top-2 bottom-0 w-0.5 bg-gray-700"></div>
                <div className="space-y-6">
                  {displayExperiences.map((item, index) => (
                    <div key={item.id || index} className="relative">
                      {/* Blue dot */}
                      <div className="absolute -left-[26px] top-1 w-2 h-2 bg-blue-500 rounded-full"></div>
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
                  className="w-full py-8 border-2 border-dashed border-gray-700 rounded-xl hover:border-blue-500 hover:bg-gray-800/50 transition text-gray-500 hover:text-blue-400"
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
          <div>
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
          <div>
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
                  className="w-full py-8 border-2 border-dashed border-gray-700 rounded-xl hover:border-blue-500 hover:bg-gray-800/50 transition text-gray-500 hover:text-blue-400"
                >
                  <PlusIcon className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm font-medium">Add Skills</p>
                </button>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
