'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { profileAPI, uploadsAPI } from '@/lib/api';
import { Profile } from '@/lib/types';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function EditProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  
  const [formData, setFormData] = useState({
    display_name: '',
    about: '',
    skills: '',
    website: '',
    linkedin_url: '',
    github_url: '',
    instagram_url: '',
    behance_url: '',
    soundcloud_url: '',
  });

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    try {
      const response = await profileAPI.getMe();
      const profileData = response.data;
      setProfile(profileData);
      
      // Populate form
      setFormData({
        display_name: profileData.display_name || '',
        about: profileData.about || '',
        skills: profileData.skills || '',
        website: profileData.website || '',
        linkedin_url: profileData.linkedin_url || '',
        github_url: profileData.github_url || '',
        instagram_url: profileData.instagram_url || '',
        behance_url: profileData.behance_url || '',
        soundcloud_url: profileData.soundcloud_url || '',
      });
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploadingPhoto(true);
    try {
      const response = await uploadsAPI.uploadProfilePicture(file);
      toast.success('Profile picture updated! (+10 points)');
      await loadProfile(); // Reload to get updated picture
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to upload profile picture');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    // Validation
    if (formData.about && formData.about.length > 500) {
      toast.error('About section must be less than 500 characters');
      return;
    }

    // Validate skills (max 5)
    const skillsArray = formData.skills
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    
    if (skillsArray.length > 5) {
      toast.error('You can add a maximum of 5 skills');
      return;
    }

    // Validate URLs
    const urlFields = ['website', 'linkedin_url', 'github_url', 'instagram_url', 'behance_url', 'soundcloud_url'];
    for (const field of urlFields) {
      const value = formData[field as keyof typeof formData];
      if (value && value.trim() !== '') {
        try {
          new URL(value);
        } catch {
          toast.error(`Invalid URL for ${field.replace('_url', '').replace('_', ' ')}`);
          return;
        }
      }
    }

    setSaving(true);
    try {
      // Clean up skills (remove empty entries, format)
      const cleanedFormData = {
        ...formData,
        skills: skillsArray.join(','),
      };

      await profileAPI.updateMe(cleanedFormData);
      toast.success('Profile updated successfully!');
      router.push(`/${user?.username}`);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#111111' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#00C2FF' }}></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#111111' }}>
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>Profile not found</h2>
          <Link href="/" className="text-primary-600 hover:underline">
            Go home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#111111' }}>
      {/* Header */}
      <header className="glass border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>Edit Profile</h1>
            <Link
              href={`/${user?.username}`}
              style={{ color: 'rgba(255, 255, 255, 0.75)' }}
            >
              Cancel
            </Link>
          </div>
        </div>
      </header>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="glass rounded-2xl shadow-lg p-8">
          {/* Profile Picture */}
          <div className="mb-8">
            <label className="block text-sm font-semibold mb-4" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>Profile Picture</label>
            <div className="flex items-center gap-6">
              {profile.profile_picture ? (
                <img
                  src={profile.profile_picture}
                  alt={profile.display_name || user?.username || ''}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-primary flex items-center justify-center text-white text-3xl font-bold">
                  {(profile.display_name || user?.username || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <input
                  type="file"
                  id="profile-picture"
                  accept="image/*"
                  onChange={handleProfilePictureUpload}
                  className="hidden"
                  disabled={uploadingPhoto}
                />
                <label
                  htmlFor="profile-picture"
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition cursor-pointer inline-block"
                >
                  {uploadingPhoto ? 'Uploading...' : 'Change Photo'}
                </label>
                {!profile.has_profile_picture && (
                  <p className="text-sm mt-2" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>💡 Upload your photo to earn +10 points</p>
                )}
              </div>
            </div>
          </div>

          {/* Display Name */}
          <div className="mb-6">
            <label htmlFor="display_name" className="block text-sm font-semibold mb-2">
              Display Name
            </label>
            <input
              type="text"
              id="display_name"
              name="display_name"
              value={formData.display_name}
              onChange={handleChange}
              placeholder="Your display name"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* About */}
          <div className="mb-6">
            <label htmlFor="about" className="block text-sm font-semibold mb-2">
              About
              {!profile.has_about && (
                <span className="ml-2 text-sm font-normal text-gray-500">💡 Add your about section to earn +20 points</span>
              )}
            </label>
            <textarea
              id="about"
              name="about"
              value={formData.about}
              onChange={handleChange}
              placeholder="Tell people about yourself..."
              rows={4}
              maxLength={500}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
            <p className="text-sm text-gray-500 mt-1">
              {formData.about.length}/500 characters
            </p>
          </div>

          {/* Skills */}
          <div className="mb-6">
            <label htmlFor="skills" className="block text-sm font-semibold mb-2">
              Skills (max 5)
              {!profile.has_skills && (
                <span className="ml-2 text-sm font-normal text-gray-500">💡 Add skills to earn +10 points each</span>
              )}
            </label>
            <input
              type="text"
              id="skills"
              name="skills"
              value={formData.skills}
              onChange={handleChange}
              placeholder="e.g., React, Design, Photography (comma-separated)"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-1">
              Separate skills with commas. Max 5 skills.
            </p>
            {formData.skills && (
              <div className="flex flex-wrap gap-2 mt-3">
                {formData.skills
                  .split(',')
                  .map((skill) => skill.trim())
                  .filter((skill) => skill.length > 0)
                  .map((skill, index) => (
                    <span
                      key={index}
                      className={`px-3 py-1 rounded-lg text-sm ${
                        index < 5 ? 'bg-primary-100 text-primary-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {skill}
                    </span>
                  ))}
              </div>
            )}
          </div>

          {/* Links Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Links</h3>
            
            {/* Website */}
            <div className="mb-4">
              <label htmlFor="website" className="block text-sm font-medium mb-2">
                🌐 Website
              </label>
              <input
                type="url"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="https://yourwebsite.com"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* LinkedIn */}
            <div className="mb-4">
              <label htmlFor="linkedin_url" className="block text-sm font-medium mb-2">
                💼 LinkedIn
              </label>
              <input
                type="url"
                id="linkedin_url"
                name="linkedin_url"
                value={formData.linkedin_url}
                onChange={handleChange}
                placeholder="https://linkedin.com/in/yourprofile"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* GitHub */}
            <div className="mb-4">
              <label htmlFor="github_url" className="block text-sm font-medium mb-2">
                💻 GitHub
              </label>
              <input
                type="url"
                id="github_url"
                name="github_url"
                value={formData.github_url}
                onChange={handleChange}
                placeholder="https://github.com/yourusername"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Instagram */}
            <div className="mb-4">
              <label htmlFor="instagram_url" className="block text-sm font-medium mb-2">
                📷 Instagram
              </label>
              <input
                type="url"
                id="instagram_url"
                name="instagram_url"
                value={formData.instagram_url}
                onChange={handleChange}
                placeholder="https://instagram.com/yourusername"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Behance */}
            <div className="mb-4">
              <label htmlFor="behance_url" className="block text-sm font-medium mb-2">
                🎨 Behance
              </label>
              <input
                type="url"
                id="behance_url"
                name="behance_url"
                value={formData.behance_url}
                onChange={handleChange}
                placeholder="https://behance.net/yourprofile"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* SoundCloud */}
            <div className="mb-4">
              <label htmlFor="soundcloud_url" className="block text-sm font-medium mb-2">
                🎵 SoundCloud
              </label>
              <input
                type="url"
                id="soundcloud_url"
                name="soundcloud_url"
                value={formData.soundcloud_url}
                onChange={handleChange}
                placeholder="https://soundcloud.com/yourusername"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="flex gap-4 pt-6 border-t">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-6 py-3 bg-gradient-primary text-white font-semibold rounded-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <Link
              href={`/${user?.username}`}
              className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:border-primary-500 transition text-center"
            >
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

