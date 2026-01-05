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
  const [attachmentSwipeX, setAttachmentSwipeX] = useState(0);
  const [attachmentStartX, setAttachmentStartX] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [attachmentFileName, setAttachmentFileName] = useState('');
  const [isRemovingAttachment, setIsRemovingAttachment] = useState(false);
  
  // Smooth progress animation
  const [displayProgress, setDisplayProgress] = useState(0);
  const attachmentNameRef = useRef<HTMLInputElement>(null);
  
  const [description, setDescription] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Scroll caption into view when focusing (so keyboard doesn't cover it)
  const handleDescriptionFocus = () => {
    if (textareaRef.current) {
      textareaRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Swipe handlers for attachment
  const handleSwipeStart = (e: React.TouchEvent) => {
    setAttachmentStartX(e.touches[0].clientX);
  };

  const handleSwipeMove = (e: React.TouchEvent) => {
    const diff = attachmentStartX - e.touches[0].clientX;
    if (diff > 0) {
      // Swiping left - open delete
      setAttachmentSwipeX(Math.min(diff, 80));
    } else if (attachmentSwipeX > 0) {
      // Swiping right when delete is open - close it
      setAttachmentSwipeX(Math.max(0, 70 + diff));
    }
  };

  const handleSwipeEnd = () => {
    // Apple-style: first swipe shows delete button (stays open), tap to delete
    if (attachmentSwipeX > 30) {
      setAttachmentSwipeX(70); // Stay open showing delete
    } else {
      setAttachmentSwipeX(0); // Close
    }
  };
  
  // Tap delete button to remove
  const handleDeleteTap = () => {
    removeAttachment();
    setAttachmentSwipeX(0);
  };

  // Play/pause audio preview
  const toggleAudioPlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
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

  // Animation states
  const [isClosing, setIsClosing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Lock body scroll when modal is open - Safari mobile fix
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.touchAction = 'none';
      // Entrance animation
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
      setIsClosing(false);
    }
    return () => {
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.touchAction = '';
      window.scrollTo(0, parseInt(scrollY || '0') * -1);
    };
  }, [isOpen]);

  if (!isOpen && !isClosing) return null;

  const handleReset = () => {
    setSelectedContentType(null);
    setFile(null);
    setPreview('');
    setTextContent('');
    setAttachmentFile(null);
    setAttachmentType(null);
    setAttachmentFileName('');
    setDescription('');
    setUploading(false);
    setUploadProgress(0);
  };

  const handleClose = () => {
    if (!uploading) {
      setIsClosing(true);
      setIsVisible(false);
      setTimeout(() => {
        handleReset();
        setIsClosing(false);
        onClose();
      }, 150);
    }
  };

  // Back = Close (no going back to CreateContentModal)
  const handleBack = handleClose;

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
    setAttachmentFileName(selectedFile.name.replace(/\.[^/.]+$/, ''));
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
    setAttachmentFileName(selectedFile.name.replace(/\.[^/.]+$/, ''));
    toast.success('PDF attachment added');
  };

  const removeAttachment = () => {
    // Smooth fade + slide out animation
    setIsRemovingAttachment(true);
    setTimeout(() => {
      setAttachmentFile(null);
      setAttachmentType(null);
      setAttachmentFileName('');
      setIsRemovingAttachment(false);
      setAttachmentSwipeX(0);
    }, 250);
  };
  
  // Smooth progress animation - safe implementation with cleanup
  useEffect(() => {
    if (uploadProgress === 0) {
      setDisplayProgress(0);
      return;
    }
    
    let animationId: number;
    let current = displayProgress;
    
    const animate = () => {
      if (current < uploadProgress) {
        const diff = uploadProgress - current;
        // Spring-like increment - faster when far, slower when close
        const increment = Math.max(1, Math.ceil(diff * 0.15));
        current = Math.min(current + increment, uploadProgress);
        setDisplayProgress(current);
        
        if (current < uploadProgress) {
          animationId = requestAnimationFrame(animate);
        }
      }
    };
    
    if (uploadProgress > current) {
      animationId = requestAnimationFrame(animate);
    }
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [uploadProgress]);

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
        background: 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        paddingTop: '5vh',
        paddingBottom: '20vh',
        // Fade animation
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.15s ease-out',
      }}
      onClick={handleClose}
    >
      {/* Centered floating popup - 85% solid card with flex layout */}
      <div 
        ref={scrollContainerRef}
        className="w-full relative flex flex-col"
        style={{
          maxWidth: 'calc(100% - 24px)',
          height: '75vh',
          background: 'rgba(20, 20, 20, 0.85)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
          // Scale + slide animation
          transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.98) translateY(8px)',
          opacity: isVisible ? 1 : 0,
          transition: 'transform 0.15s ease-out, opacity 0.15s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Upload overlay - circular progress with smooth animated percentage */}
        {uploading && (
          <div 
            className="absolute inset-0 z-20 flex flex-col items-center justify-center"
            style={{
              background: 'rgba(20, 20, 20, 0.95)',
              borderRadius: '16px',
            }}
          >
            <div className="relative">
              {/* Circular progress - uses displayProgress for smooth animation */}
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                  background: `conic-gradient(#00C2FF ${displayProgress * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
                  transition: 'background 0.1s ease-out',
                }}
              >
                <div 
                  className="w-12 h-12 rounded-full"
                  style={{ background: 'rgba(20, 20, 20, 1)' }}
                />
              </div>
            </div>
            <p 
              className="mt-5 text-white/80 text-lg font-medium"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {displayProgress}%
            </p>
          </div>
        )}

        {/* Header - solid dark, vertically centered */}
        <div 
          className="flex items-center justify-between sticky top-0 z-10"
          style={{
            height: '55px',
            background: '#0D0D0D',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px',
            padding: '0 20px',
          }}
        >
              {/* Left: Close button + title - tight 4px gap (matches left padding) */}
              <div className="flex items-center" style={{ gap: '4px' }}>
                <button
                  onClick={handleBack}
                  disabled={uploading}
                  className="transition disabled:opacity-50"
                >
                  <svg className="w-[16px] h-[16px] text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <h2 className="text-[15px] font-semibold text-white">
                  {selectedContentType === 'media' ? 'Media Post' :
                   selectedContentType === 'audio' ? 'Audio Post' :
                   selectedContentType === 'pdf' ? 'PDF Post' :
                   selectedContentType === 'text' ? 'Text Post' : 'Post'}
                </h2>
              </div>
              {/* Right: Publish - closer to right */}
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
                  padding: '0 32px',
                }}
              >
                {uploading ? '...' : 'Publish'}
              </button>
            </div>

            {/* Content area - scrollable, tap to close delete mode */}
            <div 
              className="flex-1 overflow-y-auto"
              style={{ 
                padding: '16px 10px',
                background: 'transparent',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
              onClick={() => {
                if (attachmentSwipeX > 0) {
                  setAttachmentSwipeX(0);
                }
              }}
            >
              {selectedContentType !== 'text' ? (
                <>
                  {/* File Upload Area - Glass Card, tap closes delete */}
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '16px',
                      overflow: 'hidden',
                    }}
                    onClick={() => attachmentSwipeX > 0 && setAttachmentSwipeX(0)}
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

                  {/* Caption Input - Glass style with focus states, tap closes delete */}
                  <div
                    className="caption-input-wrapper"
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: '10px',
                      position: 'relative',
                      transition: 'all 0.2s ease',
                    }}
                    onClick={() => attachmentSwipeX > 0 && setAttachmentSwipeX(0)}
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
                      onClick={() => attachmentSwipeX > 0 && setAttachmentSwipeX(0)}
                      onFocus={(e) => {
                        handleDescriptionFocus();
                        e.currentTarget.parentElement!.style.boxShadow = '0 0 0 1px rgba(0, 194, 255, 0.3)';
                        e.currentTarget.parentElement!.style.border = '1px solid transparent';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.parentElement!.style.boxShadow = 'none';
                        e.currentTarget.parentElement!.style.border = '1px solid rgba(255, 255, 255, 0.06)';
                      }}
                      onKeyDown={handleTextareaKeyDown}
                      rows={2}
                      maxLength={170}
                      style={{ 
                        fontSize: '14px',
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        boxShadow: 'none',
                        WebkitAppearance: 'none',
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

                  {/* Attachment Display - Apple-like 8px spacing, 44px height, swipe to delete */}
                  {attachmentFile && attachmentType && (
                    <div 
                      className="relative overflow-hidden" 
                      style={{ 
                        marginTop: '8px', 
                        borderRadius: '10px',
                        // Removal animation - fade + slide + scale
                        opacity: isRemovingAttachment ? 0 : 1,
                        transform: isRemovingAttachment ? 'translateX(-100%) scale(0.95)' : 'translateX(0) scale(1)',
                        transition: 'opacity 0.25s ease-out, transform 0.25s ease-out',
                      }}
                    >
                      {/* Delete button - tappable, Apple physics */}
                      <button 
                        onClick={handleDeleteTap}
                        className="absolute inset-y-0 right-0 flex items-center justify-center"
                        style={{
                          width: '70px',
                          background: '#FF453A',
                          borderRadius: '0 10px 10px 0',
                          opacity: attachmentSwipeX > 0 ? 1 : 0,
                          pointerEvents: attachmentSwipeX > 0 ? 'auto' : 'none',
                          transition: 'opacity 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        }}
                      >
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                      
                      {/* Attachment content - swipeable, 50px height, Apple physics */}
                      <div 
                        className="flex items-center gap-3 relative"
                        style={{
                          height: '50px',
                          background: attachmentSwipeX > 0 ? 'rgba(40, 40, 40, 0.98)' : 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                          borderRadius: attachmentSwipeX > 0 ? '10px 0 0 10px' : '10px',
                          padding: '0 12px',
                          transform: `translateX(-${attachmentSwipeX}px)`,
                          transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), border-radius 0.2s ease-out, background 0.2s ease-out',
                        }}
                        onTouchStart={handleSwipeStart}
                        onTouchMove={handleSwipeMove}
                        onTouchEnd={handleSwipeEnd}
                        onClick={() => attachmentSwipeX > 0 && setAttachmentSwipeX(0)}
                      >
                        {/* Album art / icon - cleaner style */}
                        <div 
                          className="flex items-center justify-center flex-shrink-0"
                          style={{
                            width: '36px',
                            height: '36px',
                            background: attachmentType === 'audio' 
                              ? 'linear-gradient(145deg, #2D2D2D 0%, #1A1A1A 100%)'
                              : 'linear-gradient(145deg, #2D2D2D 0%, #1A1A1A 100%)',
                            borderRadius: '6px',
                            border: '1px solid rgba(255,255,255,0.06)',
                          }}
                        >
                          {attachmentType === 'audio' ? (
                            <svg className="w-[18px] h-[18px]" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth={1.5} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V4.5l-10.5 3v9.75M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
                            </svg>
                          ) : (
                            <svg className="w-[18px] h-[18px]" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth={1.5} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                          )}
                        </div>
                        
                        {/* File name - Apple focus glow with subtle background highlight */}
                        <div className="flex-1 min-w-0 flex items-center">
                          <input
                            type="text"
                            value={attachmentFileName}
                            onChange={(e) => setAttachmentFileName(e.target.value)}
                            onFocus={(e) => {
                              e.currentTarget.style.boxShadow = '0 0 0 1px rgba(0, 194, 255, 0.3)';
                              e.currentTarget.style.background = 'rgba(0, 194, 255, 0.05)';
                            }}
                            onBlur={(e) => {
                              e.currentTarget.style.boxShadow = 'none';
                              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                            }}
                            className="text-[11px] font-normal bg-transparent outline-none w-full"
                            style={{ 
                              padding: '4px 6px',
                              border: 'none',
                              borderRadius: '2px',
                              background: 'rgba(255, 255, 255, 0.02)',
                              color: 'rgba(255, 255, 255, 0.7)',
                              height: '28px',
                              caretColor: '#00C2FF',
                              transition: 'box-shadow 0.15s ease, background 0.15s ease',
                            }}
                          />
                        </div>
                        
                        {/* Play button for audio - centered, 35px circle */}
                        {attachmentType === 'audio' && (
                          <>
                            <audio 
                              ref={audioRef} 
                              src={URL.createObjectURL(attachmentFile)}
                              onEnded={() => setIsPlaying(false)}
                              className="hidden"
                            />
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleAudioPlay(); }}
                              className="flex items-center justify-center"
                              style={{
                                width: '35px',
                                height: '35px',
                                minWidth: '35px',
                                minHeight: '35px',
                                maxWidth: '35px',
                                maxHeight: '35px',
                                background: 'rgba(255, 255, 255, 0.12)',
                                borderRadius: '50%',
                                flexShrink: 0,
                              }}
                            >
                              {isPlaying ? (
                                <svg style={{ width: '14px', height: '14px' }} fill="white" viewBox="0 0 24 24">
                                  <rect x="6" y="4" width="4" height="16" rx="1" />
                                  <rect x="14" y="4" width="4" height="16" rx="1" />
                                </svg>
                              ) : (
                                <svg style={{ width: '14px', height: '14px' }} fill="white" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              )}
                            </button>
                          </>
                        )}
                      </div>
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
                      onFocus={() => handleDescriptionFocus()}
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

                </>
              )}

            </div>
            
            {/* Sticky Footer - Draft toolbar with gradient fade */}
            <div 
              className="relative"
              style={{
                background: 'rgba(20, 20, 20, 1)',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                borderBottomLeftRadius: '16px',
                borderBottomRightRadius: '16px',
                padding: '12px 16px',
                paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
              }}
            >
              {/* Gradient fade above */}
              <div 
                style={{
                  position: 'absolute',
                  top: '-24px',
                  left: 0,
                  right: 0,
                  height: '24px',
                  background: 'linear-gradient(to top, rgba(20, 20, 20, 1) 0%, transparent 100%)',
                  pointerEvents: 'none',
                }}
              />
              
              <div 
                className="flex items-center justify-between" 
                style={{ color: 'rgba(255,255,255,0.5)' }}
              >
                {/* Left: Save as draft */}
                <button
                  onClick={handleSaveAsDraft}
                  disabled={uploading || (selectedContentType === 'text' ? !textContent.trim() : !file)}
                  className="flex items-center gap-2 transition disabled:opacity-40"
                >
                  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3h11l5 5v11a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 3v5h8V3" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 14h10v7H7z" />
                  </svg>
                  <span className="text-[14px] font-medium">Save as draft</span>
                </button>
                
                {/* Right: Attachment icons (only for media posts) */}
                {selectedContentType === 'media' && (
                  <div className="flex items-center" style={{ gap: '25px' }}>
                    {/* Image icon - disabled */}
                    <svg className="w-[18px] h-[18px] opacity-30" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>

                    {/* Audio attachment */}
                    <input
                      type="file"
                      id="audio-attachment-sticky"
                      accept="audio/*"
                      onChange={handleAudioAttachment}
                      className="hidden"
                      disabled={uploading || !canAddAudioAttachment || attachmentType === 'pdf'}
                    />
                    <label
                      htmlFor="audio-attachment-sticky"
                      className="cursor-pointer transition"
                      style={{ opacity: (!canAddAudioAttachment || attachmentType === 'pdf') ? 0.3 : 1 }}
                    >
                      <svg className="w-[18px] h-[18px]" fill="none" stroke={attachmentType === 'audio' ? '#00C2FF' : 'currentColor'} strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                      </svg>
                    </label>

                    {/* PDF attachment */}
                    <input
                      type="file"
                      id="pdf-attachment-sticky"
                      accept="application/pdf"
                      onChange={handlePdfAttachment}
                      className="hidden"
                      disabled={uploading || !canAddPdfAttachment || attachmentType === 'audio'}
                    />
                    <label
                      htmlFor="pdf-attachment-sticky"
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
            </div>
      </div>
    </div>
  );
}
