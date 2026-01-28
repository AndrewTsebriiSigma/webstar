'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { profileAPI } from '@/lib/api';
import toast from 'react-hot-toast';

interface EditAboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentData: {
    about?: string;
    skills?: string;
    experience?: any[];
    social_links?: any;
  };
}

interface Experience {
  id?: string;
  title: string;
  company: string;
  period: string;
  description: string;
}

interface Skill {
  name: string;
  level: number;
}

export default function EditAboutModal({ isOpen, onClose, onSuccess, currentData }: EditAboutModalProps) {
  const [activeSection, setActiveSection] = useState('about');
  const [saving, setSaving] = useState(false);
  
  // Animation states
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  
  const [aboutText, setAboutText] = useState('');
  const [skills, setSkills] = useState<Skill[]>([]);
  const [newSkillName, setNewSkillName] = useState('');
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [socialLinks, setSocialLinks] = useState({
    email: '',
    linkedin: '',
    instagram: '',
    tiktok: '',
    youtube: '',
    twitter: '',
  });

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setIsVisible(true));
      // Load current data
      setAboutText(currentData.about || '');
      
      // Parse skills from comma-separated string
      if (currentData.skills) {
        const skillsArray = currentData.skills.split(',').map(skill => ({
          name: skill.trim(),
          level: 90, // Default level
        }));
        setSkills(skillsArray);
      }
      
      setExperiences(currentData.experience || []);
      setSocialLinks(currentData.social_links || {
        email: '',
        linkedin: '',
        instagram: '',
        tiktok: '',
        youtube: '',
        twitter: '',
      });
    } else {
      setIsVisible(false);
      setIsClosing(false);
    }
  }, [isOpen, currentData]);

  // Animated close handler
  const handleClose = () => {
    setIsClosing(true);
    setIsVisible(false);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  };

  if (!isOpen && !isClosing) return null;

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
        id: Date.now().toString(),
        title: '',
        company: '',
        period: '',
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

  const handleSave = async () => {
    setSaving(true);
    try {
      // Prepare data for API
      const data: any = {};
      
      if (activeSection === 'about') {
        data.about = aboutText;
      } else if (activeSection === 'skills') {
        data.skills = skills.map(s => s.name).join(', ');
      } else if (activeSection === 'experience') {
        // Store as JSON string
        data.experience = JSON.stringify(experiences);
      } else if (activeSection === 'connect') {
        data.social_links = JSON.stringify(socialLinks);
      }

      await profileAPI.updateMe(data);
      toast.success('Profile updated!');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(error.response?.data?.detail || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Backdrop with animation */}
      <div 
        className={`bottom-slider-backdrop ${isVisible ? 'entering' : 'exiting'}`}
        onClick={handleClose}
      />
      
      {/* Bottom Slider Content with animation */}
      <div 
        className={`bottom-slider-content ${isVisible ? 'entering' : 'exiting'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - 55px consistent */}
        <div 
          className="flex items-center justify-between flex-shrink-0"
          style={{ 
            height: '55px',
            padding: '0 16px',
            background: 'rgba(20, 20, 20, 0.8)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <span style={{ fontSize: '17px', fontWeight: 600, color: '#FFFFFF' }}>Edit Profile</span>
          <button
            onClick={handleClose}
            className="flex items-center justify-center hover:opacity-70 transition-opacity"
            style={{ width: '28px', height: '28px' }}
          >
            <XMarkIcon style={{ width: '20px', height: '20px', color: 'rgba(255, 255, 255, 0.6)' }} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex flex-shrink-0 overflow-x-auto" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          {['About', 'Experience', 'Skills', 'Connect'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveSection(tab.toLowerCase())}
              className={`px-6 py-4 font-semibold whitespace-nowrap transition relative ${
                activeSection === tab.toLowerCase()
                  ? 'text-white'
                  : 'text-gray-500'
              }`}
            >
              {tab}
              {activeSection === tab.toLowerCase() && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500" />
              )}
            </button>
          ))}
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* About Section */}
          {activeSection === 'about' && (
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-300">
                About You
              </label>
              <textarea
                value={aboutText}
                onChange={(e) => setAboutText(e.target.value)}
                placeholder="Award-winning creative designer with 7+ years of experience..."
                rows={8}
                maxLength={500}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none text-white placeholder-gray-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                {aboutText.length}/500 characters
              </p>
            </div>
          )}

          {/* Experience Section */}
          {activeSection === 'experience' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Work Experience</h3>
                <button
                  onClick={addExperience}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg flex items-center gap-2 text-sm"
                >
                  <PlusIcon className="w-4 h-4" />
                  Add Experience
                </button>
              </div>

              <div className="space-y-4">
                {experiences.map((exp, index) => (
                  <div key={exp.id || index} className="p-4 bg-gray-800 rounded-lg border border-gray-700">
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
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      />
                      <input
                        type="text"
                        placeholder="Company Name"
                        value={exp.company}
                        onChange={(e) => updateExperience(index, 'company', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      />
                      <input
                        type="text"
                        placeholder="Period (e.g., 2022 - Present)"
                        value={exp.period}
                        onChange={(e) => updateExperience(index, 'period', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      />
                      <textarea
                        placeholder="Description"
                        value={exp.description}
                        onChange={(e) => updateExperience(index, 'description', e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 resize-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                ))}
                
                {experiences.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p className="mb-2">No experience added yet</p>
                    <p className="text-sm">Click "Add Experience" to get started</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Skills Section */}
          {activeSection === 'skills' && (
            <div>
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2 text-gray-300">
                  Add New Skill (max 6)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSkillName}
                    onChange={(e) => setNewSkillName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                    placeholder="e.g., Fashion Photography"
                    className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                  <button
                    onClick={addSkill}
                    disabled={skills.length >= 6}
                    className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {skills.map((skill, index) => (
                  <div key={index} className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-white">{skill.name}</h4>
                      <div className="flex items-center gap-3">
                        <span className="text-cyan-400 font-bold">{skill.level}%</span>
                        <button
                          onClick={() => removeSkill(index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={skill.level}
                      onChange={(e) => updateSkillLevel(index, parseInt(e.target.value))}
                      className="w-full accent-cyan-500"
                    />
                    <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                      <div
                        className="bg-cyan-500 h-2 rounded-full transition-all"
                        style={{ width: `${skill.level}%` }}
                      />
                    </div>
                  </div>
                ))}
                
                {skills.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No skills added yet</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Connect Section */}
          {activeSection === 'connect' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Social Links</h3>
              
              {[
                { key: 'email', label: 'Email', icon: '📧', placeholder: 'your@email.com' },
                { key: 'linkedin', label: 'LinkedIn', icon: '/icons/linkedin.png', placeholder: 'https://linkedin.com/in/username' },
                { key: 'instagram', label: 'Instagram', icon: '/icons/social (1).png', placeholder: 'https://instagram.com/username' },
                { key: 'tiktok', label: 'TikTok', icon: '/icons/tik-tok.png', placeholder: 'https://tiktok.com/@username' },
                { key: 'youtube', label: 'YouTube', icon: '/icons/youtube.png', placeholder: 'https://youtube.com/@username' },
                { key: 'twitter', label: 'X (Twitter)', icon: '/icons/social.png', placeholder: 'https://x.com/username' },
              ].map((link) => (
                <div key={link.key}>
                  <label className="flex items-center gap-2 text-sm font-semibold mb-2 text-gray-300">
                    {link.icon.startsWith('/icons/') ? (
                      <img src={link.icon} alt="" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
                    ) : (
                      <span>{link.icon}</span>
                    )}
                    {link.label}
                  </label>
                  <input
                    type={link.key === 'email' ? 'email' : 'url'}
                    value={socialLinks[link.key as keyof typeof socialLinks]}
                    onChange={(e) => setSocialLinks({ ...socialLinks, [link.key]: e.target.value })}
                    placeholder={link.placeholder}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div 
          className="flex-shrink-0 flex gap-3 p-4"
          style={{ 
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            paddingBottom: 'max(16px, env(safe-area-inset-bottom))'
          }}
        >
          <button
            onClick={handleClose}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl font-medium transition-all text-sm"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              color: 'rgba(255, 255, 255, 0.8)'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-6 py-2.5 rounded-xl font-semibold transition-all text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: saving ? 'rgba(0, 194, 255, 0.4)' : '#00C2FF',
              color: '#FFFFFF'
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </>
  );
}



