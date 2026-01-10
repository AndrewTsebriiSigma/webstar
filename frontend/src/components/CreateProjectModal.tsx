'use client';

import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { uploadsAPI, projectsAPI, portfolioAPI } from '@/lib/api';
import { PortfolioItem, Project } from '@/lib/types';
import toast from 'react-hot-toast';
import { XMarkIcon, ArrowLeftIcon, PlusIcon } from '@heroicons/react/24/outline';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingProject?: Project | null; // When provided, pre-fill modal with existing project data
  defaultSaveAsDraft?: boolean; // When true, primary button is "Save as Draft" instead of "Publish"
}

export default function CreateProjectModal({ isOpen, onClose, onSuccess, editingProject = null, defaultSaveAsDraft = false }: CreateProjectModalProps) {
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [showAttachExistingModal, setShowAttachExistingModal] = useState(false);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [selectedPortfolioIds, setSelectedPortfolioIds] = useState<Set<number>>(new Set());
  const [projectMedia, setProjectMedia] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const titleTextareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Animation states
  const [isClosing, setIsClosing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  // Add Content expandable state (like Post menu)
  const [contentExpanded, setContentExpanded] = useState(false);

  // Pre-fill form when editing an existing project
  useEffect(() => {
    if (editingProject && isOpen) {
      setEditingProjectId(editingProject.id);
      setTitle(editingProject.title || '');
      setDescription(editingProject.description || '');
      if (editingProject.cover_image) {
        setCoverPreview(editingProject.cover_image);
      }
    } else if (!editingProject) {
      setEditingProjectId(null);
    }
  }, [editingProject, isOpen]);

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
    setContentExpanded(false);
    setShowAttachExistingModal(false);
    setProjectMedia([]);
    setSelectedPortfolioIds(new Set());
    setEditingProjectId(null);
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

  // Rich text editing features - Convert "-" to bullet point on Tab
  const handleTextareaKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;
      
      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      const linePrefix = value.substring(lineStart, start);
      const trimmedPrefix = linePrefix.trim();
      
      // Check if line starts with "-" (with optional whitespace)
      // Matches: "-", "- ", " -", " - ", etc.
      if (trimmedPrefix === '-' || trimmedPrefix === '- ' || linePrefix.endsWith('-') || linePrefix.endsWith('- ')) {
        // Replace the dash with a bullet point
        const dashIndex = linePrefix.lastIndexOf('-');
        const beforeDash = value.substring(0, lineStart + dashIndex);
        const afterCursor = value.substring(start);
        const newValue = beforeDash + '• ' + afterCursor;
        setDescription(newValue);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = beforeDash.length + 2;
        }, 0);
      } else {
        // Regular tab - insert spaces
        const newValue = value.substring(0, start) + '  ' + value.substring(end);
        setDescription(newValue);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 2;
        }, 0);
      }
    } else if (e.key === 'Enter') {
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const value = textarea.value;
      
      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      const currentLine = value.substring(lineStart, start);
      
      // Match bullet points (• or -) at the start of the line
      const bulletMatch = currentLine.match(/^(\s*)(•|-)\s*(.*)$/);
      
      if (bulletMatch) {
        e.preventDefault();
        const [, indent, bullet, content] = bulletMatch;
        
        // If the line only has bullet with no content, remove it
        if (content.trim() === '') {
          const newValue = value.substring(0, lineStart) + value.substring(start);
          setDescription(newValue);
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = lineStart;
          }, 0);
        } else {
          // Continue the bullet list on new line
          const newBullet = bullet === '-' ? '-' : '•';
          const newValue = value.substring(0, start) + '\n' + indent + newBullet + ' ' + value.substring(start);
          setDescription(newValue);
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = start + indent.length + 3;
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
    // When editing, cover is optional (already has one)
    if (!coverFile && !editingProjectId && !coverPreview) {
      toast.error('Cover image is required');
      return;
    }

    setSaving(true);
    setUploadProgress(0);
    try {
      let coverUrl = coverPreview; // Use existing cover if no new one
      
      // Upload new cover image if selected
      if (coverFile) {
        setUploadingCover(true);
        setUploadProgress(20);
        const response = await uploadsAPI.uploadProjectCover(coverFile);
        coverUrl = response.data.url;
        setUploadProgress(50);
        setUploadingCover(false);
      }

      setUploadProgress(60);

      if (editingProjectId) {
        // Update existing project
        await projectsAPI.updateProject(editingProjectId, {
          title: title.trim(),
          description: description.trim() || null,
          cover_image: coverUrl || null,
        });
        setUploadProgress(100);
        toast.success('Project updated! 🎉');
      } else {
        // Create new project (published, not draft)
        const projectResponse = await projectsAPI.createProject({
          title: title.trim(),
          description: description.trim() || null,
          cover_image: coverUrl || null,
          tags: null,
          tools: null,
          project_url: null,
          is_draft: false,
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
      }
      
      handleReset();
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Save project error:', error);
      toast.error(error.response?.data?.detail || 'Failed to save project');
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
                {editingProjectId ? 'Edit Project' : 'New Project'}
              </h2>
            </div>
            {(() => {
              const isDisabled = saving || uploadingCover || !title.trim() || (!coverFile && !coverPreview);
              // Determine primary action based on context
              const isEditing = !!editingProjectId;
              const isDraftMode = defaultSaveAsDraft && !isEditing;
              const primaryAction = isDraftMode ? handleSaveAsDraft : handleSubmit;
              const buttonLabel = saving || uploadingCover 
                ? '...' 
                : isEditing 
                  ? 'Save' 
                  : (isDraftMode ? 'Save Draft' : 'Publish');
              
              return (
                <button
                  onClick={primaryAction}
                  disabled={isDisabled}
                  className="publish-btn text-[14px] font-semibold rounded-[8px] transition-all"
                  style={{ 
                    padding: '0 32px',
                    height: '32px',
                    background: isDisabled ? 'rgba(255, 255, 255, 0.2)' : '#00C2FF',
                    color: '#fff',
                    cursor: isDisabled ? 'not-allowed' : 'pointer'
                  }}
                >
                  {buttonLabel}
                </button>
              );
            })()}
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

            {/* Title + Description - Unified block like Post modal */}
            <div
              className="project-input-wrapper"
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '10px',
                position: 'relative',
                transition: 'box-shadow 0s, border 0s',
              }}
            >
              {/* Title Input - 1 line default, expands to max 2 lines */}
              <div style={{ position: 'relative' }}>
                <textarea
                  ref={titleTextareaRef}
                  value={title}
                  onChange={(e) => {
                    if (e.target.value.length <= 44) {
                      setTitle(e.target.value);
                      // Auto-resize: reset then measure
                      e.target.style.height = 'auto';
                      e.target.style.height = Math.min(e.target.scrollHeight, 56) + 'px'; // Max ~2 lines
                    }
                  }}
                  onFocus={(e) => {
                    handleInputFocus(titleTextareaRef);
                    const wrapper = e.currentTarget.closest('.project-input-wrapper') as HTMLElement;
                    if (wrapper) {
                      wrapper.style.boxShadow = '0 0 0 1px rgba(0, 194, 255, 0.3)';
                      wrapper.style.border = '1px solid transparent';
                    }
                  }}
                  onBlur={(e) => {
                    const wrapper = e.currentTarget.closest('.project-input-wrapper') as HTMLElement;
                    if (wrapper) {
                      wrapper.style.boxShadow = 'none';
                      wrapper.style.border = '1px solid rgba(255, 255, 255, 0.06)';
                    }
                  }}
                  placeholder="Project title*"
                  maxLength={44}
                  rows={1}
                  style={{ 
                    fontSize: '14px',
                    width: '100%',
                    padding: '10px 14px',
                    paddingBottom: '18px',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    resize: 'none',
                    color: '#FFFFFF',
                    caretColor: '#00C2FF',
                    lineHeight: '1.4',
                    minHeight: '40px',
                    maxHeight: '56px',
                    overflow: 'hidden'
                  }}
                  disabled={saving || uploadingCover}
                />
                <span 
                  style={{ 
                    position: 'absolute', 
                    bottom: '6px', 
                    right: '12px', 
                    fontSize: '11px', 
                    color: title.length > 40 ? '#FF453A' : title.length > 35 ? '#FF9F0A' : 'rgba(255,255,255,0.4)'
                  }}
                >
                  {title.length}/44
                </span>
              </div>
              
              {/* Divider */}
              <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.06)', margin: '0 14px' }} />
              
              {/* Description Input - with character count inside */}
              <div style={{ position: 'relative' }}>
                <textarea
                  ref={textareaRef}
                  placeholder="Add a description..."
                  value={description}
                  onChange={(e) => {
                    if (e.target.value.length <= 280) {
                      setDescription(e.target.value);
                    }
                  }}
                  onKeyDown={handleTextareaKeyDown}
                  onFocus={(e) => {
                    handleInputFocus(textareaRef);
                    const wrapper = e.currentTarget.closest('.project-input-wrapper') as HTMLElement;
                    if (wrapper) {
                      wrapper.style.boxShadow = '0 0 0 1px rgba(0, 194, 255, 0.3)';
                      wrapper.style.border = '1px solid transparent';
                    }
                  }}
                  onBlur={(e) => {
                    const wrapper = e.currentTarget.closest('.project-input-wrapper') as HTMLElement;
                    if (wrapper) {
                      wrapper.style.boxShadow = 'none';
                      wrapper.style.border = '1px solid rgba(255, 255, 255, 0.06)';
                    }
                  }}
                  rows={3}
                  maxLength={280}
                  style={{ 
                    fontSize: '14px',
                    width: '100%',
                    padding: '12px 14px',
                    paddingBottom: '24px',
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
                <span 
                  style={{ 
                    position: 'absolute', 
                    bottom: '6px', 
                    right: '12px', 
                    fontSize: '11px', 
                    color: description.length > 260 ? '#FF453A' : description.length > 220 ? '#FF9F0A' : 'rgba(255,255,255,0.4)'
                  }}
                >
                  {description.length}/280
                </span>
              </div>
            </div>

            {/* Add Content - Inline expandable like Post menu */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '10px',
                overflow: 'hidden'
              }}
            >
              {/* Header - Collapsible */}
              <button
                onClick={() => setContentExpanded(!contentExpanded)}
                disabled={saving || uploadingCover}
                className="w-full transition-all duration-200 ease-out"
                style={{ 
                  padding: contentExpanded ? '8px 12px' : '12px',
                  background: 'transparent',
                  opacity: (saving || uploadingCover) ? 0.5 : 1
                }}
              >
                {contentExpanded ? (
                  // Shrunk header - just title like Post
                  <div className="flex items-center justify-center">
                    <span className="text-[15px] font-semibold text-white">Add Content</span>
                  </div>
                ) : (
                  // Full button with icon + text - compact for mobile
                  <div className="flex items-center gap-3">
                    <div 
                      className="flex items-center justify-center flex-shrink-0"
                      style={{
                        width: '36px',
                        height: '36px',
                        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%)',
                        borderRadius: '10px'
                      }}
                    >
                      <PlusIcon className="w-4 h-4" style={{ color: '#A78BFA' }} />
                    </div>
                    <h3 className="text-[14px] font-semibold text-white">Add Content</h3>
                  </div>
                )}
              </button>

              {/* Divider - visible when expanded */}
              {contentExpanded && (
                <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.06)', margin: '0 12px' }} />
              )}

              {/* 2 Options - 2x1 grid with gradient blocks */}
              <div 
                className="transition-all duration-200 ease-out overflow-hidden"
                style={{
                  maxHeight: contentExpanded ? '100px' : '0',
                  opacity: contentExpanded ? 1 : 0,
                  padding: contentExpanded ? '8px 12px' : '0 12px'
                }}
              >
                <div className="grid grid-cols-2 gap-2">
                  {/* Attach Existing - darker gradient */}
                  <button
                    onClick={() => {
                      setContentExpanded(false);
                      setShowAttachExistingModal(true);
                    }}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-[10px] transition-all duration-150"
                    style={{ background: 'transparent' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div 
                      className="w-11 h-11 rounded-[10px] flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, rgba(0, 80, 120, 0.8) 0%, rgba(0, 50, 80, 0.9) 100%)' }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="#00C2FF" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                      </svg>
                    </div>
                    <span className="text-[12px] font-medium text-white">Attach existing</span>
                  </button>

                  {/* Upload New - darker gradient */}
                  <button
                    onClick={() => {
                      setContentExpanded(false);
                      handleUploadNewMedia();
                    }}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-[10px] transition-all duration-150"
                    style={{ background: 'transparent' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div 
                      className="w-11 h-11 rounded-[10px] flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, rgba(20, 90, 50, 0.8) 0%, rgba(10, 60, 35, 0.9) 100%)' }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="#30D158" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                    </div>
                    <span className="text-[12px] font-medium text-white">Upload new</span>
                  </button>
                </div>
              </div>
            </div>

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

          {/* Sticky Footer - Same as Post modal */}
          <div 
            className="relative flex-shrink-0"
            style={{
              background: 'transparent',
              borderBottomLeftRadius: '16px',
              borderBottomRightRadius: '16px',
              padding: '12px 16px',
              paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
            }}
          >
            {(() => {
              const isEditing = !!editingProjectId;
              const isDraftMode = defaultSaveAsDraft && !isEditing;
              const secondaryAction = isDraftMode ? handleSubmit : handleSaveAsDraft;
              const secondaryLabel = isDraftMode ? 'Publish instead' : 'Save as draft';
              
              return (
                <div 
                  className="flex items-center justify-between" 
                  style={{ color: 'rgba(255,255,255,0.5)' }}
                >
                  {/* FEATURE_DISABLED: SAVE_AS_DRAFT
                      Save as Draft button temporarily hidden for V1 release.
                      Functionality preserved - can be re-enabled by uncommenting.
                  */}
                  {/* Secondary action button
                  <button
                    onClick={secondaryAction}
                    disabled={saving || uploadingCover || !title.trim() || (isDraftMode && (!coverFile && !coverPreview))}
                    className="flex items-center gap-2 transition disabled:opacity-40"
                  >
                    {isDraftMode ? (
                      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    ) : (
                      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3h11l5 5v11a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 3v5h8V3" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 14h10v7H7z" />
                      </svg>
                    )}
                    <span className="text-[14px] font-medium">{secondaryLabel}</span>
                  </button>
                  END FEATURE_DISABLED: SAVE_AS_DRAFT */}
                </div>
              );
            })()}
          </div>
        </div>
      </div>

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
              maxWidth: 'min(500px, calc(100% - 24px))',
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
                className="rounded-[8px]"
                style={{
                  padding: '0 16px',
                  height: '32px',
                  background: selectedPortfolioIds.size === 0 ? 'rgba(255, 255, 255, 0.2)' : '#00C2FF',
                  color: '#fff',
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
