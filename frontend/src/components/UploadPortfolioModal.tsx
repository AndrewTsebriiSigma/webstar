'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { uploadsAPI, portfolioAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface UploadPortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UploadPortfolioModal({ isOpen, onClose, onSuccess }: UploadPortfolioModalProps) {
  // Content type selector
  const [contentTypeMenuOpen, setContentTypeMenuOpen] = useState(true);
  const [selectedContentType, setSelectedContentType] = useState<'media' | 'audio' | 'pdf' | 'text' | null>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [textContent, setTextContent] = useState(''); // For text posts
  
  // Attachment states
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentType, setAttachmentType] = useState<'audio' | 'pdf' | null>(null);
  
  const [description, setDescription] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Determine if attachments are allowed (avoid duplicates)
  const canAddAudioAttachment = selectedContentType === 'media'; // Only for media, not for audio
  const canAddPdfAttachment = selectedContentType === 'media'; // Only for media

  if (!isOpen) return null;

  const handleReset = () => {
    setContentTypeMenuOpen(true);
    setSelectedContentType(null);
    setFile(null);
    setPreview('');
    setTextContent('');
    setAttachmentFile(null);
    setAttachmentType(null);
    setDescription('');
    setUploading(false);
    setUploadProgress(0);
  };

  const handleClose = () => {
    if (!uploading) {
      handleReset();
      onClose();
    }
  };

  const handleBack = () => {
    if (!uploading) {
      setContentTypeMenuOpen(true);
      setSelectedContentType(null);
      setFile(null);
      setPreview('');
      setTextContent('');
      setAttachmentFile(null);
      setAttachmentType(null);
    }
  };

  const handleContentTypeSelect = (type: 'media' | 'audio' | 'pdf' | 'text') => {
    setSelectedContentType(type);
    setContentTypeMenuOpen(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate based on selected content type
    if (selectedContentType === 'media') {
      if (!selectedFile.type.startsWith('image/') && !selectedFile.type.startsWith('video/')) {
        toast.error('Please select an image or video file');
        return;
      }
    } else if (selectedContentType === 'audio' && !selectedFile.type.startsWith('audio/')) {
      toast.error('Please select an audio file');
      return;
    } else if (selectedContentType === 'pdf' && selectedFile.type !== 'application/pdf') {
      toast.error('Please select a PDF file');
      return;
    }

    // Check file size
    const isVideo = selectedFile.type.startsWith('video/');
    const isAudio = selectedFile.type.startsWith('audio/');
    const isPdf = selectedFile.type === 'application/pdf';
    
    const maxSize = isVideo ? 200 * 1024 * 1024 
                  : isAudio ? 10 * 1024 * 1024 
                  : isPdf ? 10 * 1024 * 1024
                  : 5 * 1024 * 1024; // photo
    
    if (selectedFile.size > maxSize) {
      const sizeMB = isVideo ? '200MB' 
                   : isAudio ? '10MB'
                   : isPdf ? '10MB'
                   : '5MB';
      toast.error(`File must be less than ${sizeMB}`);
      return;
    }

    setFile(selectedFile);
    
    // Create preview for images only
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview('');
    }
  };

  const handleAudioAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith('audio/')) {
      toast.error('Please select an audio file');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('Audio file must be less than 10MB');
      return;
    }

    setAttachmentFile(selectedFile);
    setAttachmentType('audio');
    toast.success('Audio attachment added');
  };

  const handlePdfAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.type !== 'application/pdf') {
      toast.error('Please select a PDF file');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('PDF file must be less than 10MB');
      return;
    }

    setAttachmentFile(selectedFile);
    setAttachmentType('pdf');
    toast.success('PDF attachment added');
  };

  const removeAttachment = () => {
    setAttachmentFile(null);
    setAttachmentType(null);
  };

  // Rich text editing features
  const handleTextareaKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;
      
      // Check if we're at the beginning of a line or after whitespace
      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      const linePrefix = value.substring(lineStart, start);
      
      // If line starts with "- " or just "-", convert to bullet point
      if (linePrefix.trim() === '-' || linePrefix.endsWith('- ')) {
        // Insert bullet point (• ) instead of tab
        const newValue = value.substring(0, lineStart) + '• ' + value.substring(start);
        setDescription(newValue);
        
        // Set cursor position after the bullet
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = lineStart + 2;
        }, 0);
      } else {
        // Regular tab behavior (indent)
        const newValue = value.substring(0, start) + '  ' + value.substring(end);
        setDescription(newValue);
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }
    } else if (e.key === 'Enter' && selectedContentType === 'text') {
      // Auto-continue lists
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const value = textarea.value;
      
      // Get current line
      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      const currentLine = value.substring(lineStart, start);
      
      // Check if current line starts with a bullet
      const bulletMatch = currentLine.match(/^(\s*)(•|\-|\*)\s/);
      if (bulletMatch) {
        e.preventDefault();
        const indent = bulletMatch[1];
        const bullet = bulletMatch[2];
        
        // If line only contains the bullet, remove it
        if (currentLine.trim() === bullet) {
          const newValue = value.substring(0, lineStart) + value.substring(start);
          setDescription(newValue);
          textarea.selectionStart = textarea.selectionEnd = lineStart;
        } else {
          // Continue the list
          const newValue = value.substring(0, start) + '\n' + indent + bullet + ' ' + value.substring(start);
          setDescription(newValue);
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = start + indent.length + bullet.length + 3;
          }, 0);
        }
      }
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (selectedContentType === 'text' && !textContent.trim()) {
      toast.error('Please enter some text');
      return;
    }
    
    if (selectedContentType !== 'text' && !file) {
      toast.error('Please select a file');
      return;
    }

    setUploading(true);
    
    try {
      setUploadProgress(30);

      if (selectedContentType === 'text') {
        // Text post flow
        await portfolioAPI.createItem({
          content_type: 'text',
          content_url: null,
          text_content: textContent.trim(),
          description: description || null,
          aspect_ratio: '4:5',
        });
        
        setUploadProgress(100);
        toast.success('Text post published! 🎉');
      } else {
        // Media post flow
        if (!selectedContentType) {
          toast.error('Please select a content type');
          return;
        }
        
        // Determine actual content type from file
        let actualContentType: string = selectedContentType;
        if (selectedContentType === 'media') {
          // Auto-detect based on file type
          if (file!.type.startsWith('image/')) {
            actualContentType = 'photo';
          } else if (file!.type.startsWith('video/')) {
            actualContentType = 'video';
          }
        }
        
        // Upload main file
        const uploadResponse = await uploadsAPI.uploadMedia(file!, actualContentType);
        const contentUrl = uploadResponse.data.url;
        
        setUploadProgress(70);

        // Handle attachment upload if present
        let attachmentUrl = null;
        if (attachmentFile && attachmentType) {
          const attachmentResponse = await uploadsAPI.uploadMedia(attachmentFile, attachmentType);
          attachmentUrl = attachmentResponse.data.url;
        }

        // Create portfolio item
        await portfolioAPI.createItem({
          content_type: actualContentType,
          content_url: contentUrl,
          description: description || null,
          aspect_ratio: '1:1',
          attachment_url: attachmentUrl,
          attachment_type: attachmentType,
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

  const handleSaveAsDraft = async () => {
    // Validation
    if (selectedContentType === 'text' && !textContent.trim()) {
      toast.error('Please enter some text');
      return;
    }
    
    if (selectedContentType !== 'text' && !file) {
      toast.error('Please select a file');
      return;
    }

    setUploading(true);
    
    try {
      setUploadProgress(30);

      if (selectedContentType === 'text') {
        // Text draft flow
        await portfolioAPI.createItem({
          content_type: 'text',
          content_url: null,
          text_content: textContent.trim(),
          description: description || null,
          aspect_ratio: '4:5',
          is_draft: true,
        });
        
        setUploadProgress(100);
        toast.success('Draft saved! 📝');
      } else {
        // Media draft flow
        if (!selectedContentType) {
          toast.error('Please select a content type');
          return;
        }
        
        // Determine actual content type from file
        let actualContentType: string = selectedContentType;
        if (selectedContentType === 'media') {
          // Auto-detect based on file type
          if (file!.type.startsWith('image/')) {
            actualContentType = 'photo';
          } else if (file!.type.startsWith('video/')) {
            actualContentType = 'video';
          }
        }
        
        // Upload main file
        const uploadResponse = await uploadsAPI.uploadMedia(file!, actualContentType);
        const contentUrl = uploadResponse.data.url;
        
        setUploadProgress(70);

        // Handle attachment upload if present
        let attachmentUrl = null;
        if (attachmentFile && attachmentType) {
          const attachmentResponse = await uploadsAPI.uploadMedia(attachmentFile, attachmentType);
          attachmentUrl = attachmentResponse.data.url;
        }

        // Create portfolio item as draft
        await portfolioAPI.createItem({
          content_type: actualContentType,
          content_url: contentUrl,
          description: description || null,
          aspect_ratio: '1:1',
          is_draft: true,
          attachment_url: attachmentUrl,
          attachment_type: attachmentType,
        });

        setUploadProgress(100);
        toast.success('Draft saved! 📝');
      }
      
      handleReset();
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Save draft error:', error);
      toast.error(error.response?.data?.detail || 'Failed to save draft');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)'
      }}
      onClick={handleClose}
    >
      <div 
        className="rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        style={{
          background: 'rgba(17, 17, 17, 0.98)',
          backdropFilter: 'blur(60px) saturate(200%)',
          WebkitBackdropFilter: 'blur(60px) saturate(200%)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {contentTypeMenuOpen ? (
          <>
            {/* Content Type Selection Menu */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h2 className="text-lg font-bold text-white">Create Post</h2>
              <button
                onClick={handleClose}
                className="p-1.5 hover:bg-gray-800 rounded-lg transition"
              >
                <XMarkIcon className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {/* Video & Photo (Merged) */}
              <button
                onClick={() => handleContentTypeSelect('media')}
                className="w-full flex items-center gap-4 p-4 bg-gray-900 hover:bg-gray-800 rounded-xl transition text-left border border-gray-800 hover:border-cyan-500"
              >
                <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Video & Photo</h3>
                  <p className="text-sm text-gray-400">Share images or videos</p>
                </div>
              </button>

              {/* Audio */}
              <button
                onClick={() => handleContentTypeSelect('audio')}
                className="w-full flex items-center gap-4 p-4 bg-gray-900 hover:bg-gray-800 rounded-xl transition text-left border border-gray-800 hover:border-cyan-500"
              >
                <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Audio</h3>
                  <p className="text-sm text-gray-400">Share music or audio</p>
                </div>
              </button>

              {/* PDF */}
              <button
                onClick={() => handleContentTypeSelect('pdf')}
                className="w-full flex items-center gap-4 p-4 bg-gray-900 hover:bg-gray-800 rounded-xl transition text-left border border-gray-800 hover:border-cyan-500"
              >
                <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">PDF Document</h3>
                  <p className="text-sm text-gray-400">Share a PDF file</p>
                </div>
              </button>

              {/* Text */}
              <button
                onClick={() => handleContentTypeSelect('text')}
                className="w-full flex items-center gap-4 p-4 bg-gray-900 hover:bg-gray-800 rounded-xl transition text-left border border-gray-800 hover:border-cyan-500"
              >
                <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Text Post</h3>
                  <p className="text-sm text-gray-400">Share your thoughts</p>
                </div>
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Upload Interface */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <button
                onClick={handleBack}
                disabled={uploading}
                className="p-1.5 hover:bg-gray-800 rounded-lg transition disabled:opacity-50"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="text-lg font-bold text-white">
                {selectedContentType === 'media' ? 'Upload Photo/Video' :
                 selectedContentType === 'audio' ? 'Upload Audio' :
                 selectedContentType === 'pdf' ? 'Upload PDF' :
                 selectedContentType === 'text' ? 'Write Text Post' :
                 'Create Post'}
              </h2>
              <button
                onClick={handleSubmit}
                disabled={uploading || (selectedContentType === 'text' && !textContent.trim()) || (selectedContentType !== 'text' && !file)}
                className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Publishing...' : 'Publish'}
              </button>
            </div>

            <div className="p-4 space-y-4">
              {selectedContentType !== 'text' ? (
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
                              {selectedContentType === 'audio' ? (
                                <>
                                  <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                                  </svg>
                                  <p className="text-sm">🎵 Audio File</p>
                                </>
                              ) : selectedContentType === 'media' && file?.type.startsWith('video/') ? (
                                <>
                                  <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                  <p className="text-sm">🎬 Video File</p>
                                </>
                              ) : selectedContentType === 'pdf' ? (
                                <>
                                  <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  <p className="text-sm">📄 PDF Document</p>
                                </>
                              ) : (
                                <>
                                  <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  <p className="text-sm">📷 Media File</p>
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
                          accept={
                            selectedContentType === 'media' ? 'image/*,video/*' :
                            selectedContentType === 'audio' ? 'audio/*' :
                            selectedContentType === 'pdf' ? 'application/pdf' :
                            'image/*,video/*'
                          }
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
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <p className="text-sm font-medium">
                            {selectedContentType === 'media' ? 'Click to upload photo or video' :
                             selectedContentType === 'audio' ? 'Click to upload audio' :
                             selectedContentType === 'pdf' ? 'Click to upload PDF' :
                             'Click to upload file'}
                          </p>
                          <p className="text-xs mt-1">
                            {selectedContentType === 'media' ? 'Max 200MB' :
                             'Max 10MB'}
                          </p>
                        </div>
                        <input
                          type="file"
                          id="file-upload"
                          accept={
                            selectedContentType === 'media' ? 'image/*,video/*' :
                            selectedContentType === 'audio' ? 'audio/*' :
                            selectedContentType === 'pdf' ? 'application/pdf' :
                            'image/*,video/*'
                          }
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* Description Input */}
                  <div>
                    <textarea
                      ref={textareaRef}
                      placeholder="Add a description (optional)"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      onKeyDown={handleTextareaKeyDown}
                      rows={4}
                      maxLength={500}
                      style={{ fontSize: '16px' }} // Prevents zoom on iOS
                      className="w-full px-4 py-2.5 bg-[#1a1a1c] border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none text-white placeholder-gray-500"
                      disabled={uploading}
                    />
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-gray-500">Tip: Type "- " and press Tab for bullet points</p>
                      <p className="text-xs text-gray-500">{description.length}/500</p>
                    </div>
                  </div>

                  {/* Attachment Display */}
                  {attachmentFile && attachmentType && (
                    <div className="p-3 bg-gray-800/50 border border-gray-700 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {attachmentType === 'audio' ? (
                          <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        )}
                        <div>
                          <p className="text-sm text-white font-medium">{attachmentFile.name}</p>
                          <p className="text-xs text-gray-400">{(attachmentFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <button
                        onClick={removeAttachment}
                        className="p-1 hover:bg-gray-700 rounded-lg transition"
                        disabled={uploading}
                      >
                        <XMarkIcon className="w-5 h-5 text-gray-400" />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Text Post Interface */}
                  <div>
                    <textarea
                      ref={textareaRef}
                      placeholder="What's on your mind?"
                      value={textContent}
                      onChange={(e) => {
                        if (e.target.value.length <= 500) {
                          setTextContent(e.target.value);
                        }
                      }}
                      onKeyDown={handleTextareaKeyDown}
                      rows={8}
                      maxLength={500}
                      style={{ fontSize: '16px' }} // Prevents zoom on iOS
                      className="w-full px-4 py-2.5 bg-[#1a1a1c] border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none text-white placeholder-gray-500"
                      disabled={uploading}
                    />
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-gray-500">Tip: Type "- " and press Tab for bullet points</p>
                      <p className="text-xs text-gray-500">{textContent.length}/500</p>
                    </div>
                  </div>

                  {/* Optional Description */}
                  <div>
                    <textarea
                      placeholder="Add tags or additional context (optional)"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={2}
                      maxLength={200}
                      style={{ fontSize: '16px' }}
                      className="w-full px-4 py-2.5 bg-[#1a1a1c] border border-gray-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none text-white placeholder-gray-500 text-sm"
                      disabled={uploading}
                    />
                    <p className="text-xs text-gray-500 mt-1 text-right">{description.length}/200</p>
                  </div>
                </>
              )}

              {/* Upload Progress */}
              {uploading && (
                <div className="mt-4">
                  <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-cyan-500 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-center text-gray-400 mt-2">Uploading... {uploadProgress}%</p>
                </div>
              )}
            </div>

            {/* Footer with Attachment Actions (disabled for audio and PDF main content) */}
            {selectedContentType && selectedContentType !== 'audio' && selectedContentType !== 'pdf' && selectedContentType !== 'text' && (
              <div className="border-t border-gray-800 p-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={handleSaveAsDraft}
                    disabled={uploading || !file}
                    className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? 'Saving...' : 'Save as draft'}
                  </button>
                  
                  <div className="flex gap-2">
                    {/* Audio Attachment Button (Music Note Icon) */}
                    <div className="relative">
                      <input
                        type="file"
                        id="audio-attachment"
                        accept="audio/*"
                        onChange={handleAudioAttachment}
                        className="hidden"
                        disabled={uploading || !canAddAudioAttachment || attachmentType === 'pdf'}
                      />
                      <label
                        htmlFor="audio-attachment"
                        className={`p-2 rounded-lg transition cursor-pointer inline-flex ${
                          !canAddAudioAttachment || attachmentType === 'pdf'
                            ? 'opacity-30 cursor-not-allowed'
                            : attachmentType === 'audio'
                            ? 'bg-cyan-500/20 hover:bg-cyan-500/30'
                            : 'hover:bg-gray-700'
                        }`}
                        title={
                          attachmentType === 'pdf'
                            ? 'Remove PDF attachment first'
                            : attachmentType === 'audio'
                            ? 'Audio attached'
                            : 'Add audio attachment'
                        }
                        onClick={(e) => {
                          if (!canAddAudioAttachment || attachmentType === 'pdf') {
                            e.preventDefault();
                          }
                        }}
                      >
                        <svg className={`w-5 h-5 ${attachmentType === 'audio' ? 'text-cyan-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                        </svg>
                      </label>
                    </div>

                    {/* PDF Attachment Button (File Icon) */}
                    <div className="relative">
                      <input
                        type="file"
                        id="pdf-attachment"
                        accept="application/pdf"
                        onChange={handlePdfAttachment}
                        className="hidden"
                        disabled={uploading || !canAddPdfAttachment || attachmentType === 'audio'}
                      />
                      <label
                        htmlFor="pdf-attachment"
                        className={`p-2 rounded-lg transition cursor-pointer inline-flex ${
                          !canAddPdfAttachment || attachmentType === 'audio'
                            ? 'opacity-30 cursor-not-allowed'
                            : attachmentType === 'pdf'
                            ? 'bg-cyan-500/20 hover:bg-cyan-500/30'
                            : 'hover:bg-gray-700'
                        }`}
                        title={
                          attachmentType === 'audio'
                            ? 'Remove audio attachment first'
                            : attachmentType === 'pdf'
                            ? 'PDF attached'
                            : 'Add PDF attachment'
                        }
                        onClick={(e) => {
                          if (!canAddPdfAttachment || attachmentType === 'audio') {
                            e.preventDefault();
                          }
                        }}
                      >
                        <svg className={`w-5 h-5 ${attachmentType === 'pdf' ? 'text-cyan-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Footer for Audio, PDF, and Text posts (no attachments, just Save as Draft) */}
            {selectedContentType && (selectedContentType === 'audio' || selectedContentType === 'pdf' || selectedContentType === 'text') && (
              <div className="border-t border-gray-800 p-4">
                <button
                  onClick={handleSaveAsDraft}
                  disabled={uploading || (selectedContentType === 'text' && !textContent.trim()) || (selectedContentType !== 'text' && !file)}
                  className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Saving...' : 'Save as draft'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
