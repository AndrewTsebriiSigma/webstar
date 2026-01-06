'use client';

import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { uploadsAPI, projectsAPI, portfolioAPI } from '@/lib/api';
import { PortfolioItem } from '@/lib/types';
import toast from 'react-hot-toast';
import { XMarkIcon, ArrowLeftIcon, PlusIcon } from '@heroicons/react/24/outline';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateProjectModal({ isOpen, onClose, onSuccess }: CreateProjectModalProps) {
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [showAddContentModal, setShowAddContentModal] = useState(false);
  const [showAttachExistingModal, setShowAttachExistingModal] = useState(false);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [selectedPortfolioIds, setSelectedPortfolioIds] = useState<Set<number>>(new Set());
  const [projectMedia, setProjectMedia] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Animation states
  const [isClosing, setIsClosing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Load user's portfolio items
  useEffect(() => {
    const loadPortfolio = async () => {
      if (isOpen) {
        try {
          const response = await portfolioAPI.getItems();
          setPortfolioItems(response.data || []);
        } catch (error) {
          console.error('Failed to load portfolio:', error);
        }
      }
    };
    loadPortfolio();
  }, [isOpen]);

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
    setTitle('');
    setDescription('');
    setCoverFile(null);
    setCoverPreview('');
    setSaving(false);
    setUploadingCover(false);
    setUploadProgress(0);
    setShowAddContentModal(false);
    setShowAttachExistingModal(false);
    setProjectMedia([]);
    setSelectedPortfolioIds(new Set());
  };

  const handleClose = () => {
    if (!saving && !uploadingCover) {
      setIsClosing(true);
      setIsVisible(false);
      setTimeout(() => {
        handleReset();
        setIsClosing(false);
        onClose();
      }, 150);
    }
  };

  // Scroll input into view when focusing
  const handleInputFocus = (ref: React.RefObject<HTMLElement>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Rich text editing features
  const handleTextareaKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;
      
      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      const linePrefix = value.substring(lineStart, start);
      
      if (linePrefix.trim() === '-' || linePrefix.endsWith('- ')) {
        const newValue = value.substring(0, lineStart) + '• ' + value.substring(start);
        setDescription(newValue);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = lineStart + 2;
        }, 0);
      } else {
        const newValue = value.substring(0, start) + '  ' + value.substring(end);
        setDescription(newValue);
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }
    } else if (e.key === 'Enter') {
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const value = textarea.value;
      
      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      const currentLine = value.substring(lineStart, start);
      
      const bulletMatch = currentLine.match(/^(\s*)(•|-)\s+(.*)$/);
      
      if (bulletMatch) {
        e.preventDefault();
        const [, indent, bullet, content] = bulletMatch;
        
        if (content.trim() === '') {
          const newValue = value.substring(0, lineStart) + value.substring(start);
          setDescription(newValue);
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = lineStart;
          }, 0);
        } else {
          const newValue = value.substring(0, start) + '\n' + indent + bullet + ' ' + value.substring(start);
          setDescription(newValue);
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = start + indent.length + bullet.length + 3;
          }, 0);
        }
      }
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

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('Project title is required');
      return;
    }

    setSaving(true);
    setUploadProgress(0);
    try {
      let coverUrl = '';
      
      // Upload cover image if selected
      if (coverFile) {
        setUploadingCover(true);
        setUploadProgress(20);
        const response = await uploadsAPI.uploadProjectCover(coverFile);
        coverUrl = response.data.url;
        setUploadProgress(50);
        setUploadingCover(false);
      }

      setUploadProgress(60);

      // Create project with title
      const projectResponse = await projectsAPI.createProject({
        title: title.trim(),
        description: description.trim() || null,
        cover_image: coverUrl || null,
        tags: null,
        tools: null,
        project_url: null,
      });

      const projectId = projectResponse.data.id;
      setUploadProgress(80);

      // Add project media
      if (projectMedia.length > 0) {
        for (const media of projectMedia) {
          try {
            await projectsAPI.addProjectMedia(projectId, {
              media_url: media.media_url || media.content_url,
              media_type: media.content_type,
              thumbnail_url: media.thumbnail_url || null
            });
          } catch (error) {
            console.error('Failed to add media:', error);
          }
        }
      }

      setUploadProgress(100);
      toast.success('Project created! 🎉');
      
      handleReset();
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Create project error:', error);
      toast.error(error.response?.data?.detail || 'Failed to create project');
    } finally {
      setSaving(false);
      setUploadingCover(false);
    }
  };

  const handleSaveAsDraft = async () => {
    if (!title.trim()) {
      toast.error('Project title is required');
      return;
    }

    setSaving(true);
    setUploadProgress(0);
    try {
      let coverUrl = '';
      
      // Upload cover image if selected
      if (coverFile) {
        setUploadingCover(true);
        setUploadProgress(20);
        const response = await uploadsAPI.uploadProjectCover(coverFile);
        coverUrl = response.data.url;
        setUploadProgress(50);
        setUploadingCover(false);
      }

      setUploadProgress(60);

      // Create project as draft
      const projectResponse = await projectsAPI.createProject({
        title: title.trim(),
        description: description.trim() || null,
        cover_image: coverUrl || null,
        tags: null,
        tools: null,
        project_url: null,
        is_draft: true,
      });

      const projectId = projectResponse.data.id;
      setUploadProgress(80);

      // Add project media
      if (projectMedia.length > 0) {
        for (const media of projectMedia) {
          try {
            await projectsAPI.addProjectMedia(projectId, {
              media_url: media.media_url || media.content_url,
              media_type: media.content_type,
              thumbnail_url: media.thumbnail_url || null
            });
          } catch (error) {
            console.error('Failed to add media:', error);
          }
        }
      }

      setUploadProgress(100);
      toast.success('Draft saved! 📝');
      
      handleReset();
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Save draft error:', error);
      toast.error(error.response?.data?.detail || 'Failed to save draft');
    } finally {
      setSaving(false);
      setUploadingCover(false);
    }
  };

  const handleUploadNewMedia = () => {
    setShowAddContentModal(false);
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*';
    input.multiple = true;
    input.onchange = async (e: any) => {
      const files = Array.from(e.target.files || []) as File[];
      for (const file of files) {
        try {
          const contentType = file.type.startsWith('image/') ? 'photo' : 'video';
          const uploadResponse = await uploadsAPI.uploadMedia(file, contentType);
          setProjectMedia(prev => [...prev, {
            content_type: contentType,
            content_url: uploadResponse.data.url,
            media_url: uploadResponse.data.url
          }]);
          toast.success(`${contentType === 'photo' ? 'Image' : 'Video'} added`);
        } catch (error) {
          toast.error('Failed to upload file');
        }
      }
    };
    input.click();
  };

  const handleAddSelectedItems = () => {
    const selectedItems = portfolioItems.filter(item => 
      selectedPortfolioIds.has(item.id)
    );
    const newMedia = selectedItems.map(item => ({
      content_type: item.content_type,
      content_url: item.content_url,
      media_url: item.content_url,
      portfolio_item_id: item.id
    }));
    setProjectMedia(prev => [...prev, ...newMedia]);
    setSelectedPortfolioIds(new Set());
    setShowAttachExistingModal(false);
    toast.success(`Added ${selectedItems.length} items`);
  };

  const removeMediaItem = (index: number) => {
    setProjectMedia(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <>
      {/* Main Modal */}
      <div 
        className="fixed inset-0 z-50 flex items-start justify-center"
        style={{ 
          paddingTop: '5vh',
          paddingBottom: '35vh',
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 0.15s ease-out'
        }}
        onClick={handleClose}
      >
        <div 
          className="w-full max-w-md relative"
          style={{
            maxWidth: 'calc(100% - 24px)',
            height: '75vh',
            background: 'rgba(20, 20, 20, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '16px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            // Entrance & exit animation
            transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.97) translateY(-10px)',
            opacity: isVisible ? 1 : 0,
            transition: 'transform 0.15s ease-out, opacity 0.15s ease-out',
            transformOrigin: 'top center'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - Fixed solid dark */}
          <div 
            className="flex items-center justify-between flex-shrink-0"
            style={{ 
              height: '55px',
              padding: '0 20px',
              background: '#0D0D0D',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
            }}
          >
            <div className="flex items-center" style={{ gap: '20px' }}>
              <button
                onClick={handleClose}
                disabled={saving || uploadingCover}
                className="flex items-center justify-center transition-opacity"
                style={{ 
                  width: '32px', 
                  height: '32px',
                  opacity: (saving || uploadingCover) ? 0.5 : 1
                }}
              >
                <XMarkIcon className="w-6 h-6" style={{ color: 'rgba(255, 255, 255, 0.6)' }} />
              </button>
              <h2 
                className="font-semibold text-white"
                style={{ fontSize: '17px' }}
              >
                New Project
              </h2>
            </div>
            <button
              onClick={handleSubmit}
              disabled={saving || uploadingCover || !title.trim()}
              className="publish-btn font-semibold transition-all"
              style={{ 
                padding: '0 24px',
                height: '32px',
                background: (saving || uploadingCover || !title.trim()) ? 'rgba(0, 194, 255, 0.3)' : '#00C2FF',
                color: (saving || uploadingCover || !title.trim()) ? 'rgba(255, 255, 255, 0.5)' : '#000',
                borderRadius: '16px',
                fontSize: '14px',
                cursor: (saving || uploadingCover || !title.trim()) ? 'not-allowed' : 'pointer'
              }}
            >
              {saving || uploadingCover ? 'Creating...' : 'Publish'}
            </button>
          </div>

          {/* Scrollable Content Area */}
          <div 
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto"
            style={{ 
              padding: '16px 10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            {/* Cover Image Upload Area */}
            <div>
              {coverPreview ? (
                <div className="relative" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                  <img
                    src={coverPreview}
                    alt="Cover preview"
                    className="w-full object-cover"
                    style={{ maxHeight: '200px' }}
                  />
                  {!saving && !uploadingCover && (
                    <label
                      htmlFor="cover-upload-edit"
                      className="absolute transition-all"
                      style={{
                        top: '8px',
                        right: '8px',
                        padding: '6px 12px',
                        background: 'rgba(0, 0, 0, 0.6)',
                        backdropFilter: 'blur(10px)',
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontSize: '12px',
                        fontWeight: '500',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}
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
                  className="block w-full transition-all cursor-pointer"
                  style={{
                    height: '160px',
                    border: '1px dashed rgba(255, 255, 255, 0.15)',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.02)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(0, 194, 255, 0.4)';
                    e.currentTarget.style.background = 'rgba(0, 194, 255, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                  }}
                >
                  <div className="flex flex-col items-center justify-center h-full">
                    <svg 
                      className="mb-3" 
                      style={{ width: '40px', height: '40px', color: 'rgba(255, 255, 255, 0.3)' }}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p style={{ fontSize: '14px', fontWeight: '500', color: 'rgba(255, 255, 255, 0.5)' }}>
                      Add cover image
                    </p>
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
              <div 
                className="title-input-wrapper"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '12px',
                  transition: 'box-shadow 0s, border 0s'
                }}
              >
                <input
                  ref={titleInputRef}
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onFocus={(e) => {
                    handleInputFocus(titleInputRef);
                    e.currentTarget.parentElement!.style.boxShadow = '0 0 0 1px rgba(0, 194, 255, 0.3)';
                    e.currentTarget.parentElement!.style.border = '1px solid transparent';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.parentElement!.style.boxShadow = 'none';
                    e.currentTarget.parentElement!.style.border = '1px solid rgba(255, 255, 255, 0.06)';
                  }}
                  placeholder="Project title"
                  maxLength={100}
                  style={{ 
                    fontSize: '16px',
                    width: '100%',
                    padding: '14px 16px',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#FFFFFF',
                    caretColor: '#00C2FF'
                  }}
                  disabled={saving || uploadingCover}
                />
              </div>
              <div className="flex justify-end mt-1">
                <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.3)' }}>
                  {title.length}/100
                </span>
              </div>
            </div>

            {/* Description Input */}
            <div>
              <div 
                className="description-input-wrapper"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '12px',
                  transition: 'box-shadow 0s, border 0s'
                }}
              >
                <textarea
                  ref={textareaRef}
                  placeholder="Add a description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onKeyDown={handleTextareaKeyDown}
                  onFocus={(e) => {
                    handleInputFocus(textareaRef);
                    e.currentTarget.parentElement!.style.boxShadow = '0 0 0 1px rgba(0, 194, 255, 0.3)';
                    e.currentTarget.parentElement!.style.border = '1px solid transparent';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.parentElement!.style.boxShadow = 'none';
                    e.currentTarget.parentElement!.style.border = '1px solid rgba(255, 255, 255, 0.06)';
                  }}
                  rows={4}
                  maxLength={500}
                  style={{ 
                    fontSize: '14px',
                    width: '100%',
                    padding: '14px 16px',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    resize: 'none',
                    color: '#FFFFFF',
                    caretColor: '#00C2FF',
                    lineHeight: '1.5'
                  }}
                  disabled={saving || uploadingCover}
                />
              </div>
              <div className="flex justify-between items-center mt-1">
                <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.3)' }}>
                  Tip: Type "- " and Tab for bullets
                </span>
                <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.3)' }}>
                  {description.length}/500
                </span>
              </div>
            </div>

            {/* Add Content Button */}
            <button
              onClick={() => setShowAddContentModal(true)}
              disabled={saving || uploadingCover}
              className="w-full flex items-center justify-center gap-2 transition-all"
              style={{
                padding: '14px',
                border: '1px dashed rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.02)',
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: '14px',
                fontWeight: '500',
                opacity: (saving || uploadingCover) ? 0.5 : 1
              }}
              onMouseEnter={(e) => {
                if (!saving && !uploadingCover) {
                  e.currentTarget.style.borderColor = 'rgba(0, 194, 255, 0.4)';
                  e.currentTarget.style.color = '#00C2FF';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)';
              }}
            >
              <PlusIcon className="w-5 h-5" />
              <span>Add Content</span>
            </button>

            {/* Gallery Preview */}
            {projectMedia.length > 0 && (
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: '600', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '10px' }}>
                  Gallery ({projectMedia.length})
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {projectMedia.map((media, index) => (
                    <div
                      key={index}
                      className="aspect-square relative group"
                      style={{ borderRadius: '8px', overflow: 'hidden', background: 'rgba(255, 255, 255, 0.05)' }}
                    >
                      {media.content_type === 'photo' && media.content_url && (
                        <img
                          src={media.content_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      )}
                      {media.content_type === 'video' && (
                        <div className="w-full h-full flex items-center justify-center" style={{ background: 'rgba(0, 0, 0, 0.3)' }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="white" opacity="0.8">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        </div>
                      )}
                      {/* Remove button on hover */}
                      <button
                        onClick={() => removeMediaItem(index)}
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{
                          width: '20px',
                          height: '20px',
                          background: 'rgba(255, 59, 48, 0.9)',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <XMarkIcon className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Upload Progress Overlay */}
          {(saving || uploadingCover) && (
            <div 
              className="absolute inset-0 flex flex-col items-center justify-center z-20"
              style={{ 
                background: 'rgba(13, 13, 13, 0.95)',
                backdropFilter: 'blur(10px)'
              }}
            >
              {/* Circular progress */}
              <div 
                className="relative"
                style={{ width: '80px', height: '80px' }}
              >
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeWidth="4"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    fill="none"
                    stroke="#00C2FF"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 36}`}
                    strokeDashoffset={`${2 * Math.PI * 36 * (1 - uploadProgress / 100)}`}
                    style={{ transition: 'stroke-dashoffset 0.3s ease-out' }}
                  />
                </svg>
                <div 
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ fontSize: '18px', fontWeight: '600', color: '#FFFFFF' }}
                >
                  {uploadProgress}%
                </div>
              </div>
              <p style={{ marginTop: '16px', fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>
                {uploadingCover ? 'Uploading cover...' : 'Creating project...'}
              </p>
            </div>
          )}

          {/* Sticky Footer */}
          <div 
            className="flex-shrink-0"
            style={{ 
              padding: '12px 10px',
              paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
              background: 'transparent',
              backdropFilter: 'blur(10px)',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)'
            }}
          >
            <button
              onClick={handleSaveAsDraft}
              disabled={saving || uploadingCover || !title.trim()}
              className="flex items-center gap-2 transition-opacity"
              style={{ 
                padding: '8px 14px',
                background: 'rgba(255, 255, 255, 0.06)',
                borderRadius: '8px',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '13px',
                fontWeight: '500',
                opacity: (saving || uploadingCover || !title.trim()) ? 0.4 : 1,
                cursor: (saving || uploadingCover || !title.trim()) ? 'not-allowed' : 'pointer'
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
              </svg>
              Save as draft
            </button>
          </div>
        </div>
      </div>

      {/* Add Content Sub-Modal */}
      {showAddContentModal && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center"
          style={{ 
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)'
          }}
          onClick={() => setShowAddContentModal(false)}
        >
          <div 
            className="w-full"
            style={{
              maxWidth: 'calc(100% - 48px)',
              maxWidth: '340px',
              background: 'rgba(28, 28, 30, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div 
              className="flex items-center justify-center"
              style={{ 
                height: '50px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
              }}
            >
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#FFFFFF' }}>Add Content</h3>
            </div>

            {/* Options */}
            <div style={{ padding: '8px' }}>
              <button
                onClick={() => {
                  setShowAddContentModal(false);
                  setShowAttachExistingModal(true);
                }}
                className="w-full flex items-center gap-3 transition-all"
                style={{
                  padding: '14px 16px',
                  borderRadius: '10px',
                  background: 'transparent'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div 
                  className="flex items-center justify-center"
                  style={{
                    width: '40px',
                    height: '40px',
                    background: 'linear-gradient(135deg, rgba(0, 194, 255, 0.2) 0%, rgba(0, 122, 255, 0.2) 100%)',
                    borderRadius: '10px'
                  }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="#00C2FF" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                  </svg>
                </div>
                <div className="text-left">
                  <div style={{ fontSize: '15px', fontWeight: '500', color: '#FFFFFF' }}>Attach existing post</div>
                  <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)' }}>Select from your portfolio</div>
                </div>
              </button>

              <button
                onClick={handleUploadNewMedia}
                className="w-full flex items-center gap-3 transition-all"
                style={{
                  padding: '14px 16px',
                  borderRadius: '10px',
                  background: 'transparent'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div 
                  className="flex items-center justify-center"
                  style={{
                    width: '40px',
                    height: '40px',
                    background: 'linear-gradient(135deg, rgba(48, 209, 88, 0.2) 0%, rgba(48, 209, 88, 0.1) 100%)',
                    borderRadius: '10px'
                  }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="#30D158" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                </div>
                <div className="text-left">
                  <div style={{ fontSize: '15px', fontWeight: '500', color: '#FFFFFF' }}>Upload new media</div>
                  <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)' }}>Upload photos or videos</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attach Existing Posts Sub-Modal */}
      {showAttachExistingModal && (
        <div 
          className="fixed inset-0 z-[60] flex items-start justify-center"
          style={{ 
            paddingTop: '5vh',
            paddingBottom: '20vh',
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)'
          }}
          onClick={() => setShowAttachExistingModal(false)}
        >
          <div 
            className="w-full"
            style={{
              maxWidth: 'calc(100% - 24px)',
              maxWidth: '500px',
              maxHeight: '70vh',
              background: 'rgba(20, 20, 20, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div 
              className="flex items-center justify-between flex-shrink-0"
              style={{ 
                height: '55px',
                padding: '0 16px',
                background: '#0D0D0D',
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
              }}
            >
              <button
                onClick={() => setShowAttachExistingModal(false)}
                className="flex items-center justify-center"
                style={{ width: '32px', height: '32px' }}
              >
                <ArrowLeftIcon className="w-5 h-5" style={{ color: 'rgba(255, 255, 255, 0.6)' }} />
              </button>
              <h3 style={{ fontSize: '17px', fontWeight: '600', color: '#FFFFFF' }}>Select Posts</h3>
              <button
                onClick={handleAddSelectedItems}
                disabled={selectedPortfolioIds.size === 0}
                style={{
                  padding: '0 16px',
                  height: '32px',
                  background: selectedPortfolioIds.size === 0 ? 'rgba(0, 194, 255, 0.3)' : '#00C2FF',
                  color: selectedPortfolioIds.size === 0 ? 'rgba(255, 255, 255, 0.5)' : '#000',
                  borderRadius: '16px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: selectedPortfolioIds.size === 0 ? 'not-allowed' : 'pointer'
                }}
              >
                Add ({selectedPortfolioIds.size})
              </button>
            </div>

            {/* Portfolio Grid */}
            <div className="flex-1 overflow-y-auto" style={{ padding: '12px' }}>
              {portfolioItems.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {portfolioItems.map((item) => {
                    const isSelected = selectedPortfolioIds.has(item.id);
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          setSelectedPortfolioIds(prev => {
                            const newSet = new Set(prev);
                            if (newSet.has(item.id)) {
                              newSet.delete(item.id);
                            } else {
                              newSet.add(item.id);
                            }
                            return newSet;
                          });
                        }}
                        className="aspect-square cursor-pointer relative"
                        style={{
                          borderRadius: '8px',
                          overflow: 'hidden',
                          border: isSelected ? '2px solid #00C2FF' : '2px solid transparent'
                        }}
                      >
                        {item.content_type === 'photo' && item.content_url && (
                          <img
                            src={item.content_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        )}
                        {item.content_type === 'video' && item.content_url && (
                          <video
                            src={item.content_url}
                            className="w-full h-full object-cover"
                          />
                        )}
                        {isSelected && (
                          <div 
                            className="absolute inset-0 flex items-center justify-center"
                            style={{ background: 'rgba(0, 194, 255, 0.3)' }}
                          >
                            <div 
                              className="flex items-center justify-center"
                              style={{
                                width: '28px',
                                height: '28px',
                                background: '#00C2FF',
                                borderRadius: '50%'
                              }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="#000">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                              </svg>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full" style={{ minHeight: '200px' }}>
                  <svg 
                    className="mb-3" 
                    style={{ width: '48px', height: '48px', color: 'rgba(255, 255, 255, 0.2)' }}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                  <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.4)' }}>No posts to attach</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
