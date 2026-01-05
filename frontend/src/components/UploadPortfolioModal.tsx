'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { uploadsAPI, portfolioAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface UploadPortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialContentType?: 'media' | 'audio' | 'pdf' | 'text' | null;
}

export default function UploadPortfolioModal({ isOpen, onClose, onSuccess, initialContentType }: UploadPortfolioModalProps) {
  // Type is always pre-selected from CreateContentModal
  const [selectedContentType, setSelectedContentType] = useState<'media' | 'audio' | 'pdf' | 'text' | null>(initialContentType || null);
  
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to top when focusing textarea (so keyboard doesn't cover input)
  const handleDescriptionFocus = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Determine if attachments are allowed (avoid duplicates)
  const canAddAudioAttachment = selectedContentType === 'media'; // Only for media, not for audio
  const canAddPdfAttachment = selectedContentType === 'media'; // Only for media

  // Sync state when initialContentType changes
  useEffect(() => {
    if (initialContentType) {
      setSelectedContentType(initialContentType);
    }
  }, [initialContentType, isOpen]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleReset = () => {
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
      handleReset();
      onClose(); // Close entirely, go back to CreateContentModal
    }
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
      className="fixed inset-0 z-50 flex items-start justify-center"
      style={{
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        paddingTop: '5vh',
        paddingBottom: '20vh',
      }}
      onClick={handleClose}
    >
      {/* Centered floating popup - Glass Modal */}
      <div 
        ref={scrollContainerRef}
        className="w-full overflow-y-auto"
        style={{
          maxWidth: 'calc(100% - 24px)',
          height: '75vh',
          background: 'rgba(18, 18, 18, 0.95)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderRadius: '16px',
          boxShadow: '0 -4px 32px rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - 25px padding */}
        <div 
          className="flex items-center justify-between sticky top-0 z-10"
          style={{
            height: '55px',
            background: 'rgba(18, 18, 18, 0.98)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px',
            padding: '0 25px',
          }}
        >
              {/* Left: Back arrow + Dynamic title - 25px gap */}
              <div className="flex items-center" style={{ gap: '25px' }}>
                <button
                  onClick={handleBack}
                  disabled={uploading}
                  className="transition disabled:opacity-50"
                >
                  <svg className="w-[16px] h-[16px] text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h2 className="text-[15px] font-semibold text-white">
                  {selectedContentType === 'media' ? 'Media Post' :
                   selectedContentType === 'audio' ? 'Audio Post' :
                   selectedContentType === 'pdf' ? 'PDF Post' :
                   selectedContentType === 'text' ? 'Text Post' : 'Post'}
                </h2>
              </div>
              {/* Right: Publish - 32px height, wider desktop, narrower mobile */}
              <button
                onClick={handleSubmit}
                disabled={uploading || (selectedContentType === 'text' && !textContent.trim()) || (selectedContentType !== 'text' && !file)}
                className="text-[14px] font-semibold rounded-[8px] transition disabled:opacity-50 disabled:cursor-not-allowed publish-btn"
                style={{
                  background: uploading || (selectedContentType === 'text' && !textContent.trim()) || (selectedContentType !== 'text' && !file) 
                    ? 'rgba(255, 255, 255, 0.2)' 
                    : '#00C2FF',
                  color: '#fff',
                  height: '32px',
                  padding: '0 28px',
                }}
              >
                {uploading ? '...' : 'Publish'}
              </button>
            </div>

            {/* Content area - 6px side padding */}
            <div style={{ padding: '16px 6px' }} className="space-y-4">
              {selectedContentType !== 'text' ? (
                <>
                  {/* File Upload Area - Glass Card */}
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '16px',
                      overflow: 'hidden',
                    }}
                  >
                    {preview || file ? (
                      <div className="relative">
                        {preview ? (
                          <img
                            src={preview}
                            alt="Preview"
                            className="w-full object-cover"
                            style={{ maxHeight: '300px', borderRadius: '16px' }}
                          />
                        ) : (
                          <div className="w-full flex items-center justify-center" style={{ height: '250px', background: 'rgba(0,0,0,0.3)' }}>
                            <div className="text-center" style={{ color: 'rgba(255,255,255,0.5)' }}>
                              {selectedContentType === 'audio' ? (
                                <>
                                  <svg className="w-16 h-16 mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                                  </svg>
                                  <p className="text-[13px]">Audio File</p>
                                </>
                              ) : selectedContentType === 'media' && file?.type.startsWith('video/') ? (
                                <>
                                  <svg className="w-16 h-16 mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                  <p className="text-[13px]">Video File</p>
                                </>
                              ) : selectedContentType === 'pdf' ? (
                                <>
                                  <svg className="w-16 h-16 mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  <p className="text-[13px]">PDF Document</p>
                                </>
                              ) : (
                                <>
                                  <svg className="w-16 h-16 mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  <p className="text-[13px]">Media File</p>
                                </>
                              )}
                              <p className="text-[11px] mt-1 opacity-60">{file?.name}</p>
                            </div>
                          </div>
                        )}
                        {!uploading && (
                          <label
                            htmlFor="file-upload-edit"
                            className="absolute top-3 right-3 px-3 py-1.5 text-white text-[12px] font-medium rounded-[8px] cursor-pointer transition"
                            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)' }}
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
                        className="block w-full cursor-pointer transition"
                        style={{ height: '250px' }}
                      >
                        <div className="flex flex-col items-center justify-center h-full" style={{ color: 'rgba(255,255,255,0.4)' }}>
                          <svg className="w-20 h-20 mb-3" fill="currentColor" viewBox="0 0 24 24" style={{ opacity: 0.6 }}>
                            <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
                          </svg>
                          <p className="text-[14px] font-medium">
                            {selectedContentType === 'media' ? 'Tap to upload photo or video' :
                             selectedContentType === 'audio' ? 'Tap to upload audio' :
                             selectedContentType === 'pdf' ? 'Tap to upload PDF' :
                             'Tap to upload file'}
                          </p>
                          <p className="text-[12px] mt-1 opacity-60">
                            {selectedContentType === 'media' ? 'Max 200MB' : 'Max 10MB'}
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

                  {/* Caption Input - Glass style with focus states */}
                  <div
                    className="caption-input-wrapper"
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: '10px',
                      position: 'relative',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <textarea
                      ref={textareaRef}
                      placeholder="Add a caption..."
                      value={description}
                      onChange={(e) => {
                        if (e.target.value.length <= 170) {
                          setDescription(e.target.value);
                        }
                      }}
                      onFocus={(e) => {
                        handleDescriptionFocus();
                        e.currentTarget.parentElement!.style.borderColor = 'rgba(0, 194, 255, 0.3)';
                        e.currentTarget.parentElement!.style.background = 'rgba(255, 255, 255, 0.04)';
                        e.currentTarget.parentElement!.style.boxShadow = '0 0 0 2px rgba(0, 194, 255, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.parentElement!.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                        e.currentTarget.parentElement!.style.background = 'rgba(255, 255, 255, 0.02)';
                        e.currentTarget.parentElement!.style.boxShadow = 'none';
                      }}
                      onKeyDown={handleTextareaKeyDown}
                      rows={2}
                      maxLength={170}
                      style={{ 
                        fontSize: '14px',
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        width: '100%',
                        padding: '12px 14px',
                        paddingBottom: '24px',
                        color: '#FFFFFF',
                        resize: 'none',
                      }}
                      disabled={uploading}
                    />
                    <span 
                      style={{ 
                        position: 'absolute', 
                        bottom: '6px', 
                        right: '12px', 
                        fontSize: '11px', 
                        color: description.length > 161 ? '#FF453A' : description.length > 136 ? '#FF9F0A' : 'var(--text-tertiary, rgba(255,255,255,0.4))'
                      }}
                    >
                      {description.length}/170
                    </span>
                  </div>

                  {/* Inline Toolbar - 21px gap */}
                  <div className="flex items-center justify-between" style={{ color: 'rgba(255,255,255,0.5)', padding: '0 6px', marginTop: '21px' }}>
                    {/* Left: Save as draft */}
                    <button
                      onClick={handleSaveAsDraft}
                      disabled={uploading || !file}
                      className="flex items-center gap-2 transition disabled:opacity-40"
                    >
                      {/* Floppy disk save icon - bolder */}
                      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3h11l5 5v11a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 3v5h8V3" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 14h10v7H7z" />
                      </svg>
                      <span className="text-[14px] font-medium">Save as draft</span>
                    </button>
                    
                    {/* Right: Attachment icons - 25px gap */}
                    {selectedContentType === 'media' && (
                      <div className="flex items-center" style={{ gap: '25px' }}>
                        {/* Audio attachment */}
                        <input
                          type="file"
                          id="audio-attachment-inline"
                          accept="audio/*"
                          onChange={handleAudioAttachment}
                          className="hidden"
                          disabled={uploading || !canAddAudioAttachment || attachmentType === 'pdf'}
                        />
                        <label
                          htmlFor="audio-attachment-inline"
                          className="cursor-pointer transition"
                          style={{ opacity: (!canAddAudioAttachment || attachmentType === 'pdf') ? 0.3 : 1 }}
                        >
                          <svg className="w-[18px] h-[18px]" fill="none" stroke={attachmentType === 'audio' ? '#00C2FF' : 'currentColor'} strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                          </svg>
                        </label>

                        {/* Image icon - disabled */}
                        <svg className="w-[18px] h-[18px] opacity-30" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                        </svg>

                        {/* PDF attachment */}
                        <input
                          type="file"
                          id="pdf-attachment-inline"
                          accept="application/pdf"
                          onChange={handlePdfAttachment}
                          className="hidden"
                          disabled={uploading || !canAddPdfAttachment || attachmentType === 'audio'}
                        />
                        <label
                          htmlFor="pdf-attachment-inline"
                          className="cursor-pointer transition"
                          style={{ opacity: (!canAddPdfAttachment || attachmentType === 'audio') ? 0.3 : 1 }}
                        >
                          <svg className="w-[18px] h-[18px]" fill="none" stroke={attachmentType === 'pdf' ? '#00C2FF' : 'currentColor'} strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                          </svg>
                        </label>
                      </div>
                    )}
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
                  {/* Text Post Interface - Glass style with focus states */}
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: '10px',
                      position: 'relative',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <textarea
                      ref={textareaRef}
                      placeholder="What's new?"
                      value={textContent}
                      onChange={(e) => {
                        if (e.target.value.length <= 170) {
                          setTextContent(e.target.value);
                        }
                      }}
                      onFocus={(e) => {
                        handleDescriptionFocus();
                        e.currentTarget.parentElement!.style.borderColor = 'rgba(0, 194, 255, 0.3)';
                        e.currentTarget.parentElement!.style.background = 'rgba(255, 255, 255, 0.04)';
                        e.currentTarget.parentElement!.style.boxShadow = '0 0 0 2px rgba(0, 194, 255, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.parentElement!.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                        e.currentTarget.parentElement!.style.background = 'rgba(255, 255, 255, 0.02)';
                        e.currentTarget.parentElement!.style.boxShadow = 'none';
                      }}
                      onKeyDown={handleTextareaKeyDown}
                      rows={4}
                      maxLength={170}
                      style={{ 
                        fontSize: '14px',
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        width: '100%',
                        padding: '12px 14px',
                        paddingBottom: '24px',
                        color: '#FFFFFF',
                        resize: 'none',
                      }}
                      disabled={uploading}
                    />
                    <span 
                      style={{ 
                        position: 'absolute', 
                        bottom: '6px', 
                        right: '12px', 
                        fontSize: '11px', 
                        color: textContent.length > 161 ? '#FF453A' : textContent.length > 136 ? '#FF9F0A' : 'var(--text-tertiary, rgba(255,255,255,0.4))'
                      }}
                    >
                      {textContent.length}/170
                    </span>
                  </div>

                  {/* Inline Toolbar for Text Post - 21px gap */}
                  <div className="flex items-center" style={{ color: 'rgba(255,255,255,0.5)', padding: '0 6px', marginTop: '21px' }}>
                    <button
                      onClick={handleSaveAsDraft}
                      disabled={uploading || !textContent.trim()}
                      className="flex items-center gap-2 transition disabled:opacity-40"
                    >
                      {/* Floppy disk save icon - bolder */}
                      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3h11l5 5v11a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 3v5h8V3" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 14h10v7H7z" />
                      </svg>
                      <span className="text-[14px] font-medium">Save as draft</span>
                    </button>
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
      </div>
    </div>
  );
}
