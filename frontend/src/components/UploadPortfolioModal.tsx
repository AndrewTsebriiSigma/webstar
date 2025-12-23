'use client';

import { useState } from 'react';
import { uploadsAPI, portfolioAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { XMarkIcon, PhotoIcon, VideoCameraIcon, MusicalNoteIcon, LinkIcon as LinkIconHero, ArrowLeftIcon } from '@heroicons/react/24/outline';

interface UploadPortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CONTENT_TYPES = [
  { id: 'photo', name: 'Photo', icon: PhotoIcon, accept: 'image/jpeg,image/png,image/webp,image/gif' },
  { id: 'video', name: 'Video', icon: VideoCameraIcon, accept: 'video/mp4,video/quicktime' },
  { id: 'audio', name: 'Audio', icon: MusicalNoteIcon, accept: 'audio/mpeg,audio/wav' },
  { id: 'link', name: 'Link', icon: LinkIconHero, accept: '' },
];

const ASPECT_RATIOS = [
  { id: '1:1', name: '1:1 (Square)' },
  { id: '4:5', name: '4:5 (Portrait)' },
  { id: '9:16', name: '9:16 (Vertical)' },
  { id: '16:9', name: '16:9 (Landscape)' },
];

export default function UploadPortfolioModal({ isOpen, onClose, onSuccess }: UploadPortfolioModalProps) {
  const [step, setStep] = useState(1);
  const [contentType, setContentType] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [formData, setFormData] = useState({
    content_url: '',
    title: '',
    description: '',
    aspect_ratio: '1:1',
  });

  if (!isOpen) return null;

  const handleReset = () => {
    setStep(1);
    setContentType('');
    setFile(null);
    setFormData({
      content_url: '',
      title: '',
      description: '',
      aspect_ratio: '1:1',
    });
    setUploading(false);
    setUploadProgress(0);
  };

  const handleClose = () => {
    if (!uploading) {
      handleReset();
      onClose();
    }
  };

  const handleTypeSelect = (type: string) => {
    setContentType(type);
    setStep(2);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const maxSize = contentType === 'video' ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      toast.error(`File must be less than ${contentType === 'video' ? '50MB' : '5MB'}`);
      return;
    }

    setFile(selectedFile);
    setStep(3);
  };

  const handleLinkSubmit = () => {
    if (!formData.content_url.trim()) {
      toast.error('Please enter a valid URL');
      return;
    }

    try {
      new URL(formData.content_url);
      setStep(3);
    } catch {
      toast.error('Please enter a valid URL');
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    setUploading(true);
    
    try {
      let contentUrl = formData.content_url;
      
      if (file && contentType !== 'link') {
        setUploadProgress(50);
        const uploadResponse = await uploadsAPI.uploadMedia(file, contentType);
        contentUrl = uploadResponse.data.url;
        setUploadProgress(75);
      }

      await portfolioAPI.createItem({
        content_type: contentType,
        content_url: contentUrl,
        title: formData.title,
        description: formData.description,
        aspect_ratio: contentType === 'link' ? null : formData.aspect_ratio,
      });

      setUploadProgress(100);
      toast.success('Portfolio item added! 🎉');
      
      toast('Check your points balance!', {
        icon: '⭐',
        duration: 4000,
      });

      handleReset();
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.detail || 'Failed to upload');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const selectedType = CONTENT_TYPES.find(t => t.id === contentType);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-2xl font-bold text-white">Add to Portfolio</h2>
          {!uploading && (
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
          {/* Step 1: Select Content Type */}
          {step === 1 && (
            <div>
              <p className="text-gray-400 mb-6">What type of content would you like to add?</p>
              <div className="grid grid-cols-2 gap-4">
                {CONTENT_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => handleTypeSelect(type.id)}
                    className="p-6 border-2 border-gray-800 rounded-xl hover:border-cyan-500 hover:bg-gray-800/50 transition text-center group"
                  >
                    <type.icon className="w-12 h-12 mx-auto mb-3 text-gray-400 group-hover:text-cyan-400 transition" />
                    <div className="font-semibold text-lg text-white">{type.name}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Upload File or Enter Link */}
          {step === 2 && contentType !== 'link' && (
            <div>
              <button
                onClick={() => setStep(1)}
                className="text-cyan-400 hover:text-cyan-300 mb-4 flex items-center gap-2"
              >
                <ArrowLeftIcon className="w-5 h-5" />
                <span>Back</span>
              </button>
              
              <div className="text-center py-12">
                {selectedType && <selectedType.icon className="w-16 h-16 mx-auto mb-4 text-cyan-400" />}
                <h3 className="text-xl font-semibold mb-4 text-white">
                  Upload {selectedType?.name}
                </h3>
                
                <input
                  type="file"
                  id="file-upload"
                  accept={selectedType?.accept}
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-block px-8 py-4 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-xl transition cursor-pointer"
                >
                  Choose File
                </label>
                
                <p className="text-sm text-gray-500 mt-4">
                  Max size: {contentType === 'video' ? '50MB' : '5MB'}
                </p>
              </div>
            </div>
          )}

          {step === 2 && contentType === 'link' && (
            <div>
              <button
                onClick={() => setStep(1)}
                className="text-cyan-400 hover:text-cyan-300 mb-4 flex items-center gap-2"
              >
                <ArrowLeftIcon className="w-5 h-5" />
                <span>Back</span>
              </button>
              
              <div className="py-6">
                <h3 className="text-xl font-semibold mb-4 text-white">Enter Link URL</h3>
                <input
                  type="url"
                  placeholder="https://example.com/your-work"
                  value={formData.content_url}
                  onChange={(e) => setFormData({ ...formData, content_url: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent mb-4 text-white placeholder-gray-500"
                  autoFocus
                />
                <button
                  onClick={handleLinkSubmit}
                  disabled={!formData.content_url.trim()}
                  className="w-full px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Add Details */}
          {step === 3 && (
            <div>
              <button
                onClick={() => setStep(2)}
                className="text-cyan-400 hover:text-cyan-300 mb-4 flex items-center gap-2"
                disabled={uploading}
              >
                <ArrowLeftIcon className="w-5 h-5" />
                <span>Back</span>
              </button>

              {/* Preview */}
              {file && contentType === 'photo' && (
                <div className="mb-6">
                  <img
                    src={URL.createObjectURL(file)}
                    alt="Preview"
                    className="w-full max-h-64 object-contain rounded-lg bg-gray-800"
                  />
                </div>
              )}

              {/* Title */}
              <div className="mb-4">
                <label htmlFor="title" className="block text-sm font-semibold mb-2 text-gray-300">
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  placeholder="Give your work a title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder-gray-500"
                  disabled={uploading}
                />
              </div>

              {/* Description */}
              <div className="mb-4">
                <label htmlFor="description" className="block text-sm font-semibold mb-2 text-gray-300">
                  Description (optional)
                </label>
                <textarea
                  id="description"
                  placeholder="Describe your work..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none text-white placeholder-gray-500"
                  disabled={uploading}
                />
              </div>

              {/* Aspect Ratio */}
              {contentType !== 'link' && contentType !== 'audio' && (
                <div className="mb-6">
                  <label htmlFor="aspect_ratio" className="block text-sm font-semibold mb-2 text-gray-300">
                    Aspect Ratio
                  </label>
                  <select
                    id="aspect_ratio"
                    value={formData.aspect_ratio}
                    onChange={(e) => setFormData({ ...formData, aspect_ratio: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white"
                    disabled={uploading}
                  >
                    {ASPECT_RATIOS.map((ratio) => (
                      <option key={ratio.id} value={ratio.id}>
                        {ratio.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Upload Progress */}
              {uploading && (
                <div className="mb-4">
                  <div className="w-full bg-gray-800 rounded-full h-3">
                    <div
                      className="bg-cyan-500 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-400 text-center mt-2">
                    {uploadProgress < 50 ? 'Uploading...' : uploadProgress < 100 ? 'Creating...' : 'Complete!'}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={handleSubmit}
                  disabled={uploading || !formData.title.trim()}
                  className="flex-1 px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Uploading...' : 'Add to Portfolio'}
                </button>
                <button
                  onClick={handleClose}
                  disabled={uploading}
                  className="px-6 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed text-white"
                >
                  Cancel
                </button>
              </div>

              {/* Tip */}
              <p className="text-sm text-gray-500 mt-4 text-center">
                💡 Tip: Upload your first item to earn +30 points!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
