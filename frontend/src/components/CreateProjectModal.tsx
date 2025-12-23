'use client';

import { useState } from 'react';
import { uploadsAPI, projectsAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateProjectModal({ isOpen, onClose, onSuccess }: CreateProjectModalProps) {
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [coverPreview, setCoverPreview] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    cover_image: '',
    tags: '',
    tools: '',
    project_url: '',
  });

  if (!isOpen) return null;

  const handleReset = () => {
    setFormData({
      title: '',
      description: '',
      cover_image: '',
      tags: '',
      tools: '',
      project_url: '',
    });
    setCoverPreview('');
    setSaving(false);
    setUploadingCover(false);
  };

  const handleClose = () => {
    if (!saving && !uploadingCover) {
      handleReset();
      onClose();
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploadingCover(true);
    try {
      setCoverPreview(URL.createObjectURL(file));
      
      const response = await uploadsAPI.uploadProjectCover(file);
      setFormData({ ...formData, cover_image: response.data.url });
      toast.success('Cover image uploaded!');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to upload cover image');
      setCoverPreview('');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error('Project title is required');
      return;
    }

    if (formData.description && formData.description.length > 500) {
      toast.error('Description must be less than 500 characters');
      return;
    }

    if (formData.project_url && formData.project_url.trim() !== '') {
      try {
        new URL(formData.project_url);
      } catch {
        toast.error('Invalid project URL');
        return;
      }
    }

    setSaving(true);
    try {
      await projectsAPI.createProject({
        title: formData.title,
        description: formData.description || null,
        cover_image: formData.cover_image || null,
        tags: formData.tags || null,
        tools: formData.tools || null,
        project_url: formData.project_url || null,
      });

      toast.success('Project created! 🎉');
      
      toast('Check your points!', {
        icon: '💯',
        duration: 4000,
      });

      handleReset();
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Create project error:', error);
      toast.error(error.response?.data?.detail || 'Failed to create project');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-2xl font-bold text-white">Create Project</h2>
          {!saving && !uploadingCover && (
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition"
            >
              <XMarkIcon className="w-6 h-6 text-gray-400" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Cover Image */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-3 text-gray-300">
              Cover Image (optional)
            </label>
            
            {coverPreview || formData.cover_image ? (
              <div className="relative">
                <img
                  src={coverPreview || formData.cover_image}
                  alt="Project cover"
                  className="w-full h-48 object-cover rounded-lg bg-gray-800"
                />
                <button
                  onClick={() => {
                    setCoverPreview('');
                    setFormData({ ...formData, cover_image: '' });
                  }}
                  disabled={uploadingCover || saving}
                  className="absolute top-2 right-2 px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-800 rounded-lg p-8 text-center hover:border-cyan-500 transition">
                <PhotoIcon className="w-12 h-12 mx-auto mb-2 text-gray-600" />
                <p className="text-gray-400 mb-4">Add a cover image to your project</p>
                <input
                  type="file"
                  id="cover-upload"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  disabled={uploadingCover || saving}
                  className="hidden"
                />
                <label
                  htmlFor="cover-upload"
                  className="inline-block px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition cursor-pointer disabled:opacity-50"
                >
                  {uploadingCover ? 'Uploading...' : 'Choose Image'}
                </label>
                <p className="text-xs text-gray-500 mt-2">Max 5MB</p>
              </div>
            )}
          </div>

          {/* Title */}
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-semibold mb-2 text-gray-300">
              Project Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              placeholder="My Awesome Project"
              value={formData.title}
              onChange={handleChange}
              disabled={saving}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:opacity-50 text-white placeholder-gray-500"
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-semibold mb-2 text-gray-300">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              placeholder="Describe your project..."
              value={formData.description}
              onChange={handleChange}
              disabled={saving}
              rows={4}
              maxLength={500}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none disabled:opacity-50 text-white placeholder-gray-500"
            />
            <p className="text-sm text-gray-500 mt-1">
              {formData.description.length}/500 characters
            </p>
          </div>

          {/* Tags */}
          <div className="mb-4">
            <label htmlFor="tags" className="block text-sm font-semibold mb-2 text-gray-300">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              id="tags"
              name="tags"
              placeholder="Design, Web, Mobile"
              value={formData.tags}
              onChange={handleChange}
              disabled={saving}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:opacity-50 text-white placeholder-gray-500"
            />
            {formData.tags && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags
                  .split(',')
                  .map((tag) => tag.trim())
                  .filter((tag) => tag.length > 0)
                  .map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-lg text-sm border border-cyan-500/30"
                    >
                      #{tag}
                    </span>
                  ))}
              </div>
            )}
          </div>

          {/* Tools */}
          <div className="mb-4">
            <label htmlFor="tools" className="block text-sm font-semibold mb-2 text-gray-300">
              Tools Used (comma-separated)
            </label>
            <input
              type="text"
              id="tools"
              name="tools"
              placeholder="Figma, React, TypeScript"
              value={formData.tools}
              onChange={handleChange}
              disabled={saving}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:opacity-50 text-white placeholder-gray-500"
            />
            {formData.tools && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tools
                  .split(',')
                  .map((tool) => tool.trim())
                  .filter((tool) => tool.length > 0)
                  .map((tool, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-800 text-gray-300 rounded-lg text-sm border border-gray-700"
                    >
                      🛠️ {tool}
                    </span>
                  ))}
              </div>
            )}
          </div>

          {/* Project URL */}
          <div className="mb-6">
            <label htmlFor="project_url" className="block text-sm font-semibold mb-2 text-gray-300">
              Project URL (optional)
            </label>
            <input
              type="url"
              id="project_url"
              name="project_url"
              placeholder="https://yourproject.com"
              value={formData.project_url}
              onChange={handleChange}
              disabled={saving}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:opacity-50 text-white placeholder-gray-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Link to live project, case study, or repository
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4 border-t border-gray-800">
            <button
              onClick={handleSubmit}
              disabled={saving || uploadingCover || !formData.title.trim()}
              className="flex-1 px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Creating...' : 'Create Project'}
            </button>
            <button
              onClick={handleClose}
              disabled={saving || uploadingCover}
              className="px-6 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed text-white"
            >
              Cancel
            </button>
          </div>

          {/* Tip */}
          <p className="text-sm text-gray-500 mt-4 text-center">
            💡 Tip: Create your first project to earn +100 points!
          </p>
        </div>
      </div>
    </div>
  );
}
