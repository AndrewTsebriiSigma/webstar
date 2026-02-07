'use client';

import { useState, useEffect, useRef } from 'react';
import { XMarkIcon, PlayIcon, MusicalNoteIcon, EllipsisVerticalIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Project } from '@/lib/types';
import { projectsAPI } from '@/lib/api';
import toast from 'react-hot-toast';

interface ProjectDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  isOwnProfile?: boolean;
  onEdit?: (project: Project) => void;
  onDelete?: (projectId: number) => void;
}

export default function ProjectDetailModal({
  isOpen,
  onClose,
  project,
  isOwnProfile = false,
  onEdit,
  onDelete
}: ProjectDetailModalProps) {
  const [projectMedia, setProjectMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingMediaId, setDeletingMediaId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Preview states
  const [previewItem, setPreviewItem] = useState<any | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);

  useEffect(() => {
    if (isOpen) {
      // Small delay for entrance animation
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
      
      // Lock body scroll - Safari compatible
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.touchAction = 'none';
    }
    
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.touchAction = '';
      const scrollY = document.body.style.top;
      window.scrollTo(0, parseInt(scrollY || '0') * -1);
    };
  }, [isOpen]);

  // Load project media when project changes
  useEffect(() => {
    const loadProjectMedia = async () => {
      if (project && isOpen) {
        setLoading(true);
        try {
          const response = await projectsAPI.getProjectMedia(project.id);
          setProjectMedia(response.data || []);
        } catch (error) {
          console.error('Failed to load project media:', error);
          setProjectMedia([]);
        } finally {
          setLoading(false);
        }
      }
    };

    loadProjectMedia();
  }, [project, isOpen]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  // Handle audio progress
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const updateProgress = () => {
      if (audio.duration) {
        setAudioProgress((audio.currentTime / audio.duration) * 100);
      }
    };
    
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', () => setIsPlaying(false));
    
    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('ended', () => setIsPlaying(false));
    };
  }, [previewItem]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleEdit = () => {
    setShowMenu(false);
    if (project && onEdit) {
      onEdit(project);
    }
  };

  const handleDeleteClick = () => {
    setShowMenu(false);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (project && onDelete) {
      onDelete(project.id);
      setShowDeleteConfirm(false);
      handleClose();
    }
  };

  const openPreview = (media: any) => {
    setPreviewItem(media);
    setShowPreview(true);
    setIsPlaying(false);
    setAudioProgress(0);
  };

  const closePreview = () => {
    setShowPreview(false);
    setPreviewItem(null);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setIsVisible(false);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
  };

  if ((!isOpen && !isClosing) || !project) return null;

  return (
    <>
      {/* Backdrop with animation */}
      <div 
        className={`bottom-slider-backdrop ${isVisible ? 'entering' : 'exiting'}`}
        onClick={handleClose}
      />
      
      {/* Bottom Slider Content with animation */}
      <div 
        className={`bottom-slider-content ${isVisible ? 'entering' : 'exiting'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - 55px consistent */}
        <div 
          style={{
            height: '55px',
            minHeight: '55px',
            background: 'rgba(20, 20, 20, 0.8)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            gap: '14px',
            flexShrink: 0
          }}
        >
        {/* Left: Just X Icon - No circle */}
        <button
          onClick={handleClose}
          style={{
            width: '32px',
            height: '32px',
            background: 'transparent',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'opacity 150ms',
            opacity: 0.7
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0.7';
          }}
        >
          <XMarkIcon className="w-[22px] h-[22px] text-white" />
        </button>
        
        {/* Title */}
        <h2 
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#FFFFFF',
            letterSpacing: '-0.3px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1
          }}
        >
          {project.title}
        </h2>

        {/* Three-dot menu (owner only) */}
        {isOwnProfile && (
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              style={{
                width: '32px',
                height: '32px',
                background: 'transparent',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'opacity 150ms',
                opacity: 0.7
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '0.7';
              }}
            >
              <EllipsisVerticalIcon className="w-[22px] h-[22px] text-white" />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  background: 'rgba(30, 30, 30, 0.98)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                  overflow: 'hidden',
                  minWidth: '140px',
                  zIndex: 100
                }}
              >
                <button
                  onClick={handleEdit}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'transparent',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: 'pointer',
                    color: '#FFFFFF',
                    fontSize: '14px',
                    fontWeight: 500,
                    transition: 'background 150ms'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <PencilIcon className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={handleDeleteClick}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'transparent',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: 'pointer',
                    color: '#FF453A',
                    fontSize: '14px',
                    fontWeight: 500,
                    transition: 'background 150ms'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 69, 58, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <TrashIcon className="w-4 h-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Scrollable Content - Full page, matching UploadPortfolioModal */}
      <div 
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          background: 'rgba(20, 20, 20, 0.85)'
        }}
      >
        {/* Cover Image - Full Width, no roundings */}
        {project.cover_image && (
          <div 
            style={{
              width: '100%',
              aspectRatio: '16 / 9',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Check if it's a GIF and render as video for looping, otherwise use img */}
            {project.cover_image.toLowerCase().endsWith('.gif') || project.cover_image.toLowerCase().includes('.gif?') ? (
              <video
                src={project.cover_image}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
                loop
                playsInline
                autoPlay
                muted
              />
            ) : (
              <img
                src={project.cover_image}
                alt={project.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            )}
            {/* Gradient overlay with title */}
            <div 
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '40px 20px 20px',
                background: 'linear-gradient(to top, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.6) 50%, transparent 100%)'
              }}
            >
              <h1 
                style={{
                  fontSize: '26px',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  letterSpacing: '-0.5px',
                  lineHeight: 1.2
                }}
              >
                {project.title}
              </h1>
            </div>
            {/* Date - small, right corner */}
            <div
              style={{
                position: 'absolute',
                bottom: '12px',
                right: '16px',
                fontSize: '11px',
                fontWeight: 500,
                color: 'rgba(255, 255, 255, 0.5)',
                letterSpacing: '0.2px'
              }}
            >
              {formatDate(project.created_at)}
            </div>
          </div>
        )}

        {/* Content Area */}
        <div style={{ 
          padding: '20px 16px'
        }}>
          {/* Description - Plain text */}
          {project.description && (
            <div style={{ marginBottom: '20px' }}>
              <p 
                style={{
                  fontSize: '15px',
                  lineHeight: 1.65,
                  color: 'rgba(255, 255, 255, 0.8)',
                  whiteSpace: 'pre-wrap',
                  margin: 0
                }}
              >
                {project.description}
              </p>
            </div>
          )}

          {/* Tags */}
          {project.tags && (
            <div style={{ marginBottom: '28px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {project.tags.split(',').map((tag, index) => (
                  <span
                    key={index}
                    style={{
                      padding: '6px 14px',
                      background: 'rgba(0, 194, 255, 0.12)',
                      borderRadius: '20px',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: '#00C2FF',
                      letterSpacing: '-0.2px'
                    }}
                  >
                    {tag.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Gallery Section */}
          <div>
            <h3 
              style={{
                fontSize: '16px',
                fontWeight: 600,
                color: '#FFFFFF',
                marginBottom: '14px',
                letterSpacing: '-0.3px'
              }}
            >
              Gallery
            </h3>

            {loading ? (
              <div 
                style={{
                  padding: '40px 24px',
                  textAlign: 'center',
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontSize: '14px'
                }}
              >
                Loading...
              </div>
            ) : projectMedia.length > 0 ? (
              <div 
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '10px'
                }}
              >
                {projectMedia.map((media, index) => (
                  <div
                    key={media.id || index}
                    onClick={() => openPreview(media)}
                    style={{
                      aspectRatio: '1 / 1',
                      borderRadius: '0',
                      overflow: 'hidden',
                      background: 'rgba(255, 255, 255, 0.03)',
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'transform 150ms ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.02)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    {/* Delete button for owner */}
                    {isOwnProfile && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (media.id && confirm('Delete this media item?')) {
                            setDeletingMediaId(media.id);
                            try {
                              await projectsAPI.deleteProjectMedia(project!.id, media.id);
                              setProjectMedia(prev => prev.filter(m => m.id !== media.id));
                              toast.success('Media item deleted');
                            } catch (error) {
                              console.error('Failed to delete media:', error);
                              toast.error('Failed to delete media item');
                            } finally {
                              setDeletingMediaId(null);
                            }
                          }
                        }}
                        disabled={deletingMediaId === media.id}
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: 'rgba(255, 59, 48, 0.9)',
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          zIndex: 10,
                          transition: 'all 0.15s ease',
                          opacity: deletingMediaId === media.id ? 0.5 : 1
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.1)';
                          e.currentTarget.style.background = 'rgba(255, 59, 48, 1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.background = 'rgba(255, 59, 48, 0.9)';
                        }}
                        title="Delete media"
                      >
                        {deletingMediaId === media.id ? (
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <XMarkIcon className="w-4 h-4 text-white" />
                        )}
                      </button>
                    )}
                    {/* PHOTO */}
                    {media.media_type === 'photo' && media.media_url && (
                      <img
                        src={media.media_url}
                        alt=""
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    )}
                    
                    {/* VIDEO - with type indicator */}
                    {media.media_type === 'video' && (
                      <>
                        {media.media_url && (
                          <video
                            src={media.media_url}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                        )}
                        {/* Video play indicator */}
                        <div 
                          style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(0, 0, 0, 0.25)'
                          }}
                        >
                          <div
                            style={{
                              width: '44px',
                              height: '44px',
                              borderRadius: '50%',
                              background: 'rgba(255, 255, 255, 0.2)',
                              backdropFilter: 'blur(8px)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <PlayIcon className="w-5 h-5 text-white" style={{ marginLeft: '2px' }} />
                          </div>
                        </div>
                        {/* Video type badge */}
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '8px',
                            right: '8px',
                            padding: '4px 8px',
                            background: 'rgba(0, 0, 0, 0.6)',
                            backdropFilter: 'blur(8px)',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#FFFFFF'
                          }}
                        >
                          VIDEO
                        </div>
                      </>
                    )}

                    {/* AUDIO - with type indicator */}
                    {media.media_type === 'audio' && (
                      <div 
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'linear-gradient(135deg, rgba(10, 132, 255, 0.15), rgba(0, 194, 255, 0.1))',
                          padding: '16px',
                          position: 'relative'
                        }}
                      >
                        <div
                          style={{
                            width: '52px',
                            height: '52px',
                            borderRadius: '50%',
                            background: '#0A84FF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '10px',
                            boxShadow: '0 4px 16px rgba(10, 132, 255, 0.3)'
                          }}
                        >
                          <MusicalNoteIcon className="w-6 h-6 text-white" />
                        </div>
                        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', textAlign: 'center', fontWeight: 500 }}>
                          Audio
                        </span>
                        {/* Audio type badge */}
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '8px',
                            right: '8px',
                            width: '28px',
                            height: '28px',
                            background: 'rgba(10, 132, 255, 0.3)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <MusicalNoteIcon className="w-4 h-4" style={{ color: '#0A84FF' }} />
                        </div>
                      </div>
                    )}
                    
                    {/* DOCUMENT/PDF - with type indicator */}
                    {media.media_type === 'document' && (
                      <div 
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'rgba(255, 255, 255, 0.02)',
                          padding: '16px',
                          position: 'relative'
                        }}
                      >
                        <svg 
                          width="44" 
                          height="44" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="#00C2FF"
                          strokeWidth={1.5}
                          style={{ marginBottom: '10px' }}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center', fontWeight: 500 }}>
                          Document
                        </span>
                        {/* PDF type badge */}
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '8px',
                            right: '8px',
                            padding: '4px 8px',
                            background: 'rgba(0, 194, 255, 0.2)',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#00C2FF'
                          }}
                        >
                          PDF
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div 
                style={{
                  padding: '40px 24px',
                  textAlign: 'center',
                  color: 'rgba(255, 255, 255, 0.4)',
                  fontSize: '14px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '0'
                }}
              >
                No media in gallery
              </div>
            )}
          </div>

          {/* Bottom safe area */}
          <div style={{ height: '40px' }} />
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'rgba(30, 30, 30, 0.98)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '24px',
              maxWidth: '320px',
              width: '100%',
              textAlign: 'center'
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'rgba(255, 69, 58, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}
            >
              <TrashIcon className="w-6 h-6" style={{ color: '#FF453A' }} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#FFFFFF', marginBottom: '8px' }}>
              Delete Project?
            </h3>
            <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '24px' }}>
              This action cannot be undone. All media in this project will be permanently deleted.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: 'transparent',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 150ms'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#FF453A',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'opacity 150ms'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.85';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && previewItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={closePreview}
        >
          {/* Close button */}
          <button
            onClick={closePreview}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10
            }}
          >
            <XMarkIcon className="w-6 h-6 text-white" />
          </button>

          {/* Photo Preview */}
          {previewItem.media_type === 'photo' && previewItem.media_url && (
            <img
              src={previewItem.media_url}
              alt=""
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: '90vw',
                maxHeight: '85vh',
                objectFit: 'contain',
                borderRadius: '8px'
              }}
            />
          )}

          {/* Video Preview */}
          {previewItem.media_type === 'video' && previewItem.media_url && (
            <video
              src={previewItem.media_url}
              controls
              autoPlay
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: '90vw',
                maxHeight: '85vh',
                borderRadius: '8px',
                background: '#000'
              }}
            />
          )}

          {/* Audio Preview */}
          {previewItem.media_type === 'audio' && previewItem.media_url && (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'rgba(30, 30, 30, 0.95)',
                borderRadius: '20px',
                padding: '40px',
                maxWidth: '400px',
                width: '90vw',
                textAlign: 'center'
              }}
            >
              <audio ref={audioRef} src={previewItem.media_url} loop />
              
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0A84FF, #00C2FF)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px',
                  boxShadow: '0 8px 32px rgba(10, 132, 255, 0.4)',
                  cursor: 'pointer',
                  transition: 'transform 150ms'
                }}
                onClick={toggleAudio}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                {isPlaying ? (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                ) : (
                  <PlayIcon className="w-8 h-8 text-white" style={{ marginLeft: '4px' }} />
                )}
              </div>

              <p style={{ fontSize: '16px', fontWeight: 600, color: '#FFFFFF', marginBottom: '16px' }}>
                Audio Track
              </p>

              {/* Progress bar */}
              <div
                style={{
                  width: '100%',
                  height: '4px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '2px',
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    width: `${audioProgress}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #0A84FF, #00C2FF)',
                    transition: 'width 100ms ease'
                  }}
                />
              </div>
            </div>
          )}

          {/* PDF/Document Preview */}
          {previewItem.media_type === 'document' && previewItem.media_url && (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '90vw',
                height: '85vh',
                maxWidth: '900px',
                background: '#FFFFFF',
                borderRadius: '12px',
                overflow: 'hidden'
              }}
            >
              <iframe
                src={previewItem.media_url}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none'
                }}
                title="Document Preview"
              />
            </div>
          )}
        </div>
      )}
      </div>
    </>
  );
}
