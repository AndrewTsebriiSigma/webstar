'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, PlayIcon, MusicalNoteIcon } from '@heroicons/react/24/outline';
import { Project } from '@/lib/types';
import { projectsAPI } from '@/lib/api';

interface ProjectDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
}

export default function ProjectDetailModal({
  isOpen,
  onClose,
  project
}: ProjectDetailModalProps) {
  const [projectMedia, setProjectMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

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

  const handleClose = () => {
    setIsClosing(true);
    setIsVisible(false);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
  };

  if (!isOpen || !project) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#0A0A0A',
        display: 'flex',
        flexDirection: 'column',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.2s ease-out'
      }}
    >
      {/* Header - Full width, no roundings */}
      <div 
        style={{
          height: '55px',
          minHeight: '55px',
          background: 'rgba(13, 13, 13, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: '14px',
          flexShrink: 0
        }}
      >
        {/* Left: Circle Close Button */}
        <button
          onClick={handleClose}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'all 150ms'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
          }}
        >
          <XMarkIcon className="w-[18px] h-[18px] text-white" />
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
      </div>

      {/* Scrollable Content - Full page */}
      <div 
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch'
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
            <img
              src={project.cover_image}
              alt={project.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
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
          </div>
        )}

        {/* Content Area */}
        <div style={{ padding: '20px 16px' }}>
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
                    style={{
                      aspectRatio: '1 / 1',
                      borderRadius: '8px',
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
                  borderRadius: '12px'
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
    </div>
  );
}
