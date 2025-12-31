'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Project } from '@/lib/types';

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

  useEffect(() => {
    if (!isOpen) return;

    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Load project media when project changes
  useEffect(() => {
    if (project && isOpen) {
      // TODO: Load project media from API
      // For now, using mock data
      setProjectMedia([
        { id: 1, media_type: 'photo', media_url: project.cover_image },
        { id: 2, media_type: 'photo', media_url: project.cover_image },
        { id: 3, media_type: 'video', media_url: '/sample-video.mp4' },
        { id: 4, media_type: 'document', media_url: '/sample.pdf', thumbnail_url: null }
      ]);
    }
  }, [project, isOpen]);

  if (!isOpen || !project) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.95)',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto'
      }}
    >
      {/* Header */}
      <div 
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(17, 17, 17, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '16px 20px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: '#FFFFFF',
              letterSpacing: '-0.5px'
            }}
          >
            {project.title}
          </h1>
          
          <button
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 150ms',
              flexShrink: 0
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <XMarkIcon className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div 
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          width: '100%',
          padding: '24px 20px'
        }}
      >
        {/* Cover Image with Title Overlay */}
        {project.cover_image && (
          <div 
            style={{
              width: '100%',
              aspectRatio: '16 / 9',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              marginBottom: '24px',
              position: 'relative'
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
            {/* Title overlay on cover */}
            <div 
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '24px',
                background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 50%, transparent 100%)'
              }}
            >
              <h2 
                style={{
                  fontSize: '28px',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  letterSpacing: '-0.5px',
                  marginBottom: '4px'
                }}
              >
                {project.title}
              </h2>
            </div>
          </div>
        )}

        {/* Description */}
        {project.description && (
          <div style={{ marginBottom: '32px' }}>
            <p 
              style={{
                fontSize: '15px',
                lineHeight: '1.6',
                color: 'rgba(255, 255, 255, 0.8)',
                whiteSpace: 'pre-wrap'
              }}
            >
              {project.description}
            </p>
            
            {/* Project metadata */}
            <div style={{ marginTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
              {project.tags && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {project.tags.split(',').map((tag, index) => (
                    <span
                      key={index}
                      style={{
                        padding: '4px 12px',
                        background: 'rgba(0, 194, 255, 0.15)',
                        border: '1px solid rgba(0, 194, 255, 0.3)',
                        borderRadius: '16px',
                        fontSize: '12px',
                        fontWeight: 500,
                        color: '#00C2FF'
                      }}
                    >
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Gallery Section */}
        <div>
          <h3 
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: '#FFFFFF',
              marginBottom: '16px',
              letterSpacing: '-0.3px'
            }}
          >
            Gallery
          </h3>

          {projectMedia.length > 0 ? (
            <div 
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px'
              }}
            >
              {projectMedia.map((media, index) => (
                <div
                  key={media.id || index}
                  style={{
                    aspectRatio: '4 / 5',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    position: 'relative'
                  }}
                >
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
                  
                  {media.media_type === 'video' && (
                    <div 
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(0, 0, 0, 0.5)'
                      }}
                    >
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="white" style={{ opacity: 0.8 }}>
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                  )}
                  
                  {media.media_type === 'document' && (
                    <div 
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px',
                        textAlign: 'center'
                      }}
                    >
                      <svg 
                        width="48" 
                        height="48" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="#00C2FF"
                        strokeWidth={2}
                        style={{ marginBottom: '12px' }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)' }}>
                        Press Release.pdf
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div 
              style={{
                padding: '48px 24px',
                textAlign: 'center',
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: '14px'
              }}
            >
              No media in gallery
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

