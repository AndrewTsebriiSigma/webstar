'use client';

import { useState } from 'react';
import { uploadsAPI, projectsAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { XMarkIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateProjectModal({ isOpen, onClose, onSuccess }: CreateProjectModalProps) {
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    cover_image: '',
  });

  if (!isOpen) return null;

  const handleReset = () => {
    setFormData({
      title: '',
      description: '',
      cover_image: '',
    });
    setCoverFile(null);
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

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setCoverFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setCoverPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
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

    setSaving(true);
    try {
      let coverUrl = '';
      
      // Upload cover image if selected
      if (coverFile) {
        setUploadingCover(true);
        const response = await uploadsAPI.uploadProjectCover(coverFile);
        coverUrl = response.data.url;
        setUploadingCover(false);
      }

      // Create project
      await projectsAPI.createProject({
        title: formData.title,
        description: formData.description || null,
        cover_image: coverUrl || null,
        tags: null,
        tools: null,
        project_url: null,
      });

      toast.success('Project created! 🎉');
      
      handleReset();
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Create project error:', error);
      toast.error(error.response?.data?.detail || 'Failed to create project');
    } finally {
      setSaving(false);
      setUploadingCover(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#2a2d35] rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <button
            onClick={handleClose}
            disabled={saving || uploadingCover}
            className="p-1 hover:bg-gray-700 rounded transition"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-400" />
          </button>
          <h2 className="text-lg font-bold text-white">Project</h2>
          <button
            onClick={handleSubmit}
            disabled={saving || uploadingCover || !formData.title.trim()}
            className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving || uploadingCover ? 'Creating...' : 'Publish'}
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Cover Image Upload Area */}
          <div>
            {coverPreview ? (
              <div className="relative">
                <img
                  src={coverPreview}
                  alt="Cover preview"
                  className="w-full rounded-xl object-cover max-h-80"
                />
                {!saving && !uploadingCover && (
                  <label
                    htmlFor="cover-upload-edit"
                    className="absolute top-2 right-2 px-3 py-1 bg-gray-900/80 hover:bg-gray-800 text-white text-xs rounded-lg cursor-pointer transition"
                  >
                    Change
                  </label>
                )}
                <input
                  type="file"
                  id="cover-upload-edit"
                  accept="image/*"
                  onChange={handleCoverSelect}
                  className="hidden"
                  disabled={saving || uploadingCover}
                />
              </div>
            ) : (
              <label
                htmlFor="cover-upload"
                className="block w-full h-64 border-2 border-dashed border-gray-700 rounded-xl hover:border-cyan-500 transition cursor-pointer"
              >
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm font-medium">Click to upload project cover</p>
                  <p className="text-xs mt-1">Max 5MB</p>
                </div>
                <input
                  type="file"
                  id="cover-upload"
                  accept="image/*"
                  onChange={handleCoverSelect}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Title Input */}
          <div>
            <input
              type="text"
              name="title"
              placeholder="Title*"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-[#1a1a1c] border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder-gray-500 text-sm"
              disabled={saving || uploadingCover}
            />
          </div>

          {/* Description Input */}
          <div>
            <textarea
              name="description"
              placeholder="Description (boost discovery)"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2.5 bg-[#1a1a1c] border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none text-white placeholder-gray-500 text-sm"
              disabled={saving || uploadingCover}
            />
          </div>

          {/* Upload Progress */}
          {(saving || uploadingCover) && (
            <div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-cyan-500 h-2 rounded-full transition-all duration-300 w-2/3" />
              </div>
              <p className="text-xs text-gray-400 text-center mt-2">
                {uploadingCover ? 'Uploading cover...' : 'Creating project...'}
              </p>
            </div>
          )}

          {/* Bottom Actions (matching the post modal design) */}
          <div className="flex items-center gap-3 pt-2 border-t border-gray-700">
            <button
              disabled={saving || uploadingCover}
              className="flex items-center gap-2 px-3 py-2 hover:bg-gray-700 rounded-lg transition text-gray-400 disabled:opacity-50"
              title="Save as draft"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              <span className="text-sm">Save as draft</span>
            </button>
            
            <div className="flex gap-2 ml-auto">
              <button
                disabled={saving || uploadingCover}
                className="p-2 hover:bg-gray-700 rounded-lg transition disabled:opacity-50"
                title="Add audio"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </button>
              <button
                disabled={saving || uploadingCover}
                className="p-2 hover:bg-gray-700 rounded-lg transition disabled:opacity-50"
                title="Add document"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
