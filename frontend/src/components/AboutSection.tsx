'use client';

import { useState } from 'react';
import { PencilIcon, PlusIcon, TrashIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { profileAPI } from '@/lib/api';
import toast from 'react-hot-toast';

interface AboutSectionProps {
  isOwnProfile: boolean;
  profile: any;
  onUpdate: () => void;
}

export default function AboutSection({ isOwnProfile, profile, onUpdate }: AboutSectionProps) {
  // About editing
  const [editingAbout, setEditingAbout] = useState(false);
  const [aboutText, setAboutText] = useState('');

  // Skills editing
  const [editingSkills, setEditingSkills] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');

  // Experience editing
  const [editingExperience, setEditingExperience] = useState(false);
  const [experiences, setExperiences] = useState<any[]>([]);

  // Connect editing
  const [editingConnect, setEditingConnect] = useState(false);
  const [socialLinks, setSocialLinks] = useState<any>({});

  const startEditingAbout = () => {
    setAboutText(profile?.about || '');
    setEditingAbout(true);
  };

  const startEditingSkills = () => {
    if (profile?.skills) {
      setSkills(profile.skills.split(',').map((s: string) => s.trim()));
    } else {
      setSkills([]);
    }
    setEditingSkills(true);
  };

  const startEditingExperience = () => {
    try {
      if (profile?.experience) {
        const exp = JSON.parse(profile.experience);
        setExperiences(exp);
      } else {
        setExperiences([]);
      }
    } catch {
      setExperiences([]);
    }
    setEditingExperience(true);
  };

  const startEditingConnect = () => {
    try {
      if (profile?.social_links) {
        setSocialLinks(JSON.parse(profile.social_links));
      } else {
        setSocialLinks({});
      }
    } catch {
      setSocialLinks({});
    }
    setEditingConnect(true);
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
      await profileAPI.updateMe({ skills: skills.join(', ') });
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

  const saveConnect = async () => {
    try {
      await profileAPI.updateMe({ social_links: JSON.stringify(socialLinks) });
      toast.success('Social links updated!');
      setEditingConnect(false);
      onUpdate();
    } catch (error) {
      toast.error('Failed to update social links');
    }
  };

  const addSkill = () => {
    if (!newSkill.trim()) return;
    if (skills.length >= 6) {
      toast.error('Maximum 6 skills allowed');
      return;
    }
    setSkills([...skills, newSkill.trim()]);
    setNewSkill('');
  };

  const removeSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const addExperience = () => {
    setExperiences([
      ...experiences,
      {
        id: Date.now().toString(),
        title: '',
        company: '',
        period: '',
        description: '',
      },
    ]);
  };

  const updateExperience = (index: number, field: string, value: string) => {
    const updated = [...experiences];
    updated[index] = { ...updated[index], [field]: value };
    setExperiences(updated);
  };

  const removeExperience = (index: number) => {
    setExperiences(experiences.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {/* About Section */}
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white text-base">About</h3>
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
              maxLength={500}
              rows={5}
              placeholder="Tell us about yourself..."
              className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none text-white placeholder-gray-500"
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500">{aboutText.length}/500</span>
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
                  className="px-3 py-1.5 text-sm bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            {profile?.about ? (
              <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{profile.about}</p>
            ) : (
              isOwnProfile && (
                <button
                  onClick={startEditingAbout}
                  className="w-full py-6 border-2 border-dashed border-gray-700 rounded-lg hover:border-cyan-500 hover:bg-gray-800/50 transition text-gray-500 hover:text-cyan-400"
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
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
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
                  <div key={exp.id || index} className="p-4 bg-gray-800 rounded-xl border border-gray-700">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="text-sm font-semibold text-cyan-400">Experience {index + 1}</h4>
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
                        placeholder="Job Title"
                        value={exp.title}
                        onChange={(e) => updateExperience(index, 'title', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500"
                      />
                      <input
                        type="text"
                        placeholder="Company Name"
                        value={exp.company}
                        onChange={(e) => updateExperience(index, 'company', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500"
                      />
                      <input
                        type="text"
                        placeholder="Period (e.g., 2022 - Present)"
                        value={exp.period}
                        onChange={(e) => updateExperience(index, 'period', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500"
                      />
                      <textarea
                        placeholder="Description"
                        value={exp.description}
                        onChange={(e) => updateExperience(index, 'description', e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 resize-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            <button
              onClick={addExperience}
              className="w-full py-3 bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-xl transition text-cyan-400 font-medium flex items-center justify-center gap-2"
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
                className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div>
            {profile?.experience && (() => {
              try {
                const exp = JSON.parse(profile.experience);
                if (exp && exp.length > 0) {
                  return (
                    <div className="space-y-6">
                      {exp.map((item: any, index: number) => (
                        <div key={index} className="relative pl-6 before:absolute before:left-0 before:top-2 before:w-2 before:h-2 before:bg-cyan-500 before:rounded-full">
                          <h4 className="font-semibold text-white">{item.title}</h4>
                          <p className="text-cyan-400 text-sm">{item.company}</p>
                          <p className="text-gray-500 text-sm mb-2">{item.period}</p>
                          {item.description && (
                            <p className="text-gray-400 text-sm leading-relaxed">{item.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                }
              } catch {}
              return isOwnProfile ? (
                <button
                  onClick={startEditingExperience}
                  className="w-full py-8 border-2 border-dashed border-gray-700 rounded-xl hover:border-cyan-500 hover:bg-gray-800/50 transition text-gray-500 hover:text-cyan-400"
                >
                  <PlusIcon className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm font-medium">Add Experience</p>
                </button>
              ) : null;
            })()}
          </div>
        )}
      </div>

      {/* Skills Section */}
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
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
              <div className="flex flex-wrap gap-2 mb-4">
                {skills.map((skill, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-cyan-500/20 text-cyan-400 px-4 py-2 rounded-full border border-cyan-500/30"
                  >
                    <span>{skill}</span>
                    <button
                      onClick={() => removeSkill(index)}
                      className="hover:text-red-400"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {skills.length < 6 && (
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                  placeholder="Add a skill (max 6)"
                  className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500"
                />
                <button
                  onClick={addSkill}
                  disabled={skills.length >= 6}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditingSkills(false);
                  setNewSkill('');
                }}
                className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition text-white"
              >
                Cancel
              </button>
              <button
                onClick={saveSkills}
                className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div>
            {profile?.skills ? (
              <div className="flex flex-wrap gap-2">
                {profile.skills.split(',').map((skill: string, index: number) => (
                  <span
                    key={index}
                    className="bg-cyan-500/20 text-cyan-400 px-4 py-2 rounded-full text-sm border border-cyan-500/30"
                  >
                    {skill.trim()}
                  </span>
                ))}
              </div>
            ) : (
              isOwnProfile && (
                <button
                  onClick={startEditingSkills}
                  className="w-full py-8 border-2 border-dashed border-gray-700 rounded-xl hover:border-cyan-500 hover:bg-gray-800/50 transition text-gray-500 hover:text-cyan-400"
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
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white text-lg">Connect</h3>
          {isOwnProfile && !editingConnect && (
            <button
              onClick={startEditingConnect}
              className="p-2 hover:bg-gray-800 rounded-lg transition"
              title="Edit social links"
            >
              <PencilIcon className="w-5 h-5 text-gray-400" />
            </button>
          )}
        </div>

        {editingConnect ? (
          <div>
            <div className="space-y-4 mb-4">
              {[
                { key: 'email', label: 'Email', icon: '📧', placeholder: 'your@email.com' },
                { key: 'linkedin', label: 'LinkedIn', icon: '💼', placeholder: 'https://linkedin.com/in/username' },
                { key: 'instagram', label: 'Instagram', icon: '📸', placeholder: 'https://instagram.com/username' },
                { key: 'tiktok', label: 'TikTok', icon: '🎵', placeholder: 'https://tiktok.com/@username' },
                { key: 'youtube', label: 'YouTube', icon: '📺', placeholder: 'https://youtube.com/@username' },
                { key: 'twitter', label: 'X (Twitter)', icon: '𝕏', placeholder: 'https://x.com/username' },
              ].map((link) => (
                <div key={link.key}>
                  <label className="block text-sm font-semibold mb-2 text-gray-300">
                    {link.icon} {link.label}
                  </label>
                  <input
                    type={link.key === 'email' ? 'email' : 'url'}
                    value={socialLinks[link.key] || ''}
                    onChange={(e) => setSocialLinks({ ...socialLinks, [link.key]: e.target.value })}
                    placeholder={link.placeholder}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setEditingConnect(false)}
                className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition text-white"
              >
                Cancel
              </button>
              <button
                onClick={saveConnect}
                className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {(() => {
              let links: any = {};
              try {
                if (profile?.social_links) {
                  links = JSON.parse(profile.social_links);
                }
              } catch {}

              const allLinks = [
                { icon: '📧', label: 'Email', url: links.email ? `mailto:${links.email}` : null },
                { icon: '💼', label: 'LinkedIn', url: profile?.linkedin_url || links.linkedin },
                { icon: '📸', label: 'Instagram', url: profile?.instagram_url || links.instagram },
                { icon: '🎵', label: 'TikTok', url: links.tiktok },
                { icon: '📺', label: 'YouTube', url: links.youtube },
                { icon: '𝕏', label: 'X', url: links.twitter },
              ];

              const hasAnyLinks = allLinks.some(link => link.url);

              if (!hasAnyLinks && isOwnProfile) {
                return (
                  <div className="col-span-3">
                    <button
                      onClick={startEditingConnect}
                      className="w-full py-8 border-2 border-dashed border-gray-700 rounded-xl hover:border-cyan-500 hover:bg-gray-800/50 transition text-gray-500 hover:text-cyan-400"
                    >
                      <PlusIcon className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm font-medium">Add Social Links</p>
                    </button>
                  </div>
                );
              }

              return allLinks.map((link) =>
                link.url ? (
                  <a
                    key={link.label}
                    href={link.url}
                    target={link.url.startsWith('mailto:') ? '_self' : '_blank'}
                    rel={link.url.startsWith('mailto:') ? '' : 'noopener noreferrer'}
                    className="flex flex-col items-center gap-2 p-4 bg-gray-800 hover:bg-gray-750 rounded-xl transition"
                  >
                    <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center text-2xl">
                      {link.icon}
                    </div>
                    <span className="text-xs text-gray-400">{link.label}</span>
                  </a>
                ) : null
              );
            })()}
            {profile?.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 p-4 bg-gray-800 hover:bg-gray-750 rounded-xl transition"
              >
                <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center text-2xl">
                  🌐
                </div>
                <span className="text-xs text-gray-400">Website</span>
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

