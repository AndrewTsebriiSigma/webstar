'use client';

import { useState } from 'react';
import { uploadsAPI, portfolioAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { XMarkIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

interface UploadPortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UploadPortfolioModal({ isOpen, onClose, onSuccess }: UploadPortfolioModalProps) {
  const [postType, setPostType] = useState<'media' | 'text'>('media'); // Tab state
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [textContent, setTextContent] = useState(''); // For text posts
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });

  if (!isOpen) return null;

  const handleReset = () => {
    setPostType('media');
    setFile(null);
    setPreview('');
    setTextContent('');
    setFormData({
      title: '',
      description: '',
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Check file type
    const isImage = selectedFile.type.startsWith('image/');
    const isVideo = selectedFile.type.startsWith('video/');
    const isAudio = selectedFile.type.startsWith('audio/');
    
    if (!isImage && !isVideo && !isAudio) {
      toast.error('Please select an image, video, or audio file');
      return;
    }

    // Check file size
    const maxSize = isVideo ? 200 * 1024 * 1024 : isAudio ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      const sizeMB = isVideo ? '200MB' : isAudio ? '10MB' : '5MB';
      toast.error(`File must be less than ${sizeMB}`);
      return;
    }

    setFile(selectedFile);
    
    // Create preview for images only
    if (isImage) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(''); // No preview for video/audio
    }
  };

  const handleSubmit = async () => {
    // Validation based on post type
    if (postType === 'media' && !file) {
      toast.error('Please select a file');
      return;
    }
    
    if (postType === 'text' && !textContent.trim()) {
      toast.error('Please enter some text');
      return;
    }

    setUploading(true);
    
    try {
      setUploadProgress(30);
      
      if (postType === 'text') {
        // Create text post directly (no file upload)
        await portfolioAPI.createItem({
          content_type: 'text',
          content_url: null,
          text_content: textContent.trim(),
          title: formData.title || null,
          description: formData.description || null,
          aspect_ratio: '4:5',
        });
        
        setUploadProgress(100);
        toast.success('Text post published! 🎉');
      } else {
        // Media post flow (existing logic)
        // Determine content type
        const contentType = file!.type.startsWith('image/') 
          ? 'photo' 
          : file!.type.startsWith('video/')
          ? 'video'
          : 'audio';
        
        // Upload file
        const uploadResponse = await uploadsAPI.uploadMedia(file!, contentType);
        const contentUrl = uploadResponse.data.url;
        
        setUploadProgress(70);

        // Create portfolio item
        await portfolioAPI.createItem({
          content_type: contentType,
          content_url: contentUrl,
          title: formData.title || null,
          description: formData.description || null,
          aspect_ratio: '1:1',
        });

        setUploadProgress(100);
        toast.success('Post published! 🎉');
      }
      
      handleReset();
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.detail || 'Failed to publish');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div 
      className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      style={{ background: 'rgba(17, 17, 17, 0.9)' }}
    >
      <div className="bg-[#2a2d35] rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-gray-700">
        {/* Header */}
        <div className="border-b border-gray-700">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={handleClose}
              disabled={uploading}
              className="p-1 hover:bg-gray-700 rounded transition"
            >
              <ArrowLeftIcon className="w-5 h-5 text-gray-400" />
            </button>
            <h2 className="text-lg font-bold text-white">Create Post</h2>
            <button
              onClick={handleSubmit}
              disabled={uploading || (postType === 'media' && !file) || (postType === 'text' && !textContent.trim())}
              className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Publishing...' : 'Publish'}
            </button>
          </div>

          {/* Tab Switcher */}
          <div className="flex px-4">
            <button
              onClick={() => setPostType('media')}
              disabled={uploading}
              className={`flex-1 py-2.5 text-sm font-semibold transition relative ${
                postType === 'media' 
                  ? 'text-cyan-400' 
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Media
              {postType === 'media' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400" />
              )}
            </button>
            <button
              onClick={() => setPostType('text')}
              disabled={uploading}
              className={`flex-1 py-2.5 text-sm font-semibold transition relative ${
                postType === 'text' 
                  ? 'text-cyan-400' 
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Text
              {postType === 'text' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400" />
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {postType === 'media' ? (
            <>
              {/* File Upload Area */}
          <div>
            {preview || file ? (
              <div className="relative">
                {preview ? (
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full rounded-xl object-cover max-h-80"
                  />
                ) : (
                  <div className="w-full h-64 bg-gray-800 rounded-xl flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      {file?.type.startsWith('audio/') ? (
                        <>
                          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                          </svg>
                          <p className="text-sm">🎵 Audio File</p>
                        </>
                      ) : (
                        <>
                          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <p className="text-sm">🎬 Video File</p>
                        </>
                      )}
                      <p className="text-xs mt-1">{file?.name}</p>
                    </div>
                  </div>
                )}
                {!uploading && (
                  <label
                    htmlFor="file-upload-edit"
                    className="absolute top-2 right-2 px-3 py-1 bg-gray-900/80 hover:bg-gray-800 text-white text-xs rounded-lg cursor-pointer transition"
                  >
                    Change
                  </label>
                )}
                <input
                  type="file"
                  id="file-upload-edit"
                  accept="image/*,video/*,audio/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={uploading}
                />
              </div>
            ) : (
              <label
                htmlFor="file-upload"
                className="block w-full h-64 border-2 border-dashed border-gray-700 rounded-xl hover:border-cyan-500 transition cursor-pointer"
              >
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm font-medium">Click to upload photo, video, or audio</p>
                  <p className="text-xs mt-1">Max 5MB for images, 200MB for videos, 10MB for audio</p>
                </div>
                <input
                  type="file"
                  id="file-upload"
                  accept="image/*,video/*,audio/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Title Input */}
          <div>
            <input
              type="text"
              placeholder="Title (optional)"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2.5 bg-[#1a1a1c] border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder-gray-500 text-sm"
              disabled={uploading}
            />
          </div>

          {/* Description Input */}
          <div>
            <textarea
              placeholder="Description (boost discovery)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 bg-[#1a1a1c] border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none text-white placeholder-gray-500 text-sm"
              disabled={uploading}
            />
          </div>
            </>
          ) : (
            <>
              {/* Text Post Interface */}
              <div>
                <textarea
                  placeholder="What's on your mind?"
                  value={textContent}
                  onChange={(e) => {
                    if (e.target.value.length <= 500) {
                      setTextContent(e.target.value);
                    }
                  }}
                  rows={8}
                  className="w-full px-4 py-3 bg-[#1a1a1c] border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none text-white placeholder-gray-500 text-base"
                  disabled={uploading}
                />
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-500">Share your thoughts with the community</span>
                  <span className={`text-xs ${textContent.length > 450 ? 'text-yellow-500' : 'text-gray-500'}`}>
                    {textContent.length}/500
                  </span>
                </div>
              </div>

              {/* Title Input for Text Post */}
              <div>
                <input
                  type="text"
                  placeholder="Title (optional)"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#1a1a1c] border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder-gray-500 text-sm"
                  disabled={uploading}
                />
              </div>

              {/* Preview */}
              {textContent.trim() && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">Preview</p>
                  <div 
                    style={{
                      aspectRatio: '4 / 5',
                      borderRadius: '20px',
                      background: 'linear-gradient(135deg, rgba(10, 132, 255, 0.05), rgba(118, 75, 162, 0.05))',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      padding: '24px 20px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Decorative gradient orb */}
                    <div style={{
                      position: 'absolute',
                      top: '-30%',
                      right: '-20%',
                      width: '150px',
                      height: '150px',
                      borderRadius: '50%',
                      background: 'radial-gradient(circle, rgba(10, 132, 255, 0.08), transparent)',
                      filter: 'blur(30px)',
                      pointerEvents: 'none'
                    }} />
                    
                    {/* Preview Text */}
                    <div 
                      style={{
                        fontSize: '15px',
                        lineHeight: '1.5',
                        color: '#FFFFFF',
                        fontWeight: 500,
                        textAlign: 'center',
                        position: 'relative',
                        zIndex: 1,
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 4,
                        WebkitBoxOrient: 'vertical'
                      }}
                    >
                      "{textContent.length > 80 ? textContent.substring(0, 80) + '...' : textContent}"
                    </div>
                    
                    {/* Title if exists */}
                    {formData.title && (
                      <div 
                        style={{
                          fontSize: '12px',
                          color: 'rgba(255, 255, 255, 0.5)',
                          textAlign: 'center',
                          marginTop: '12px',
                          fontWeight: 500,
                          position: 'relative',
                          zIndex: 1
                        }}
                      >
                        — {formData.title}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Upload Progress */}
          {uploading && (
            <div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-cyan-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 text-center mt-2">
                {uploadProgress < 50 ? 'Uploading...' : 'Publishing...'}
              </p>
            </div>
          )}

          {/* Bottom Actions */}
          <div className="flex items-center gap-3 pt-2 border-t border-gray-700">
            <button
              disabled={uploading}
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
                disabled={uploading}
                className="p-2 hover:bg-gray-700 rounded-lg transition disabled:opacity-50"
                title="Add audio"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </button>
              <button
                disabled={uploading}
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
