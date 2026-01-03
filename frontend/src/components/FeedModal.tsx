'use client';

import { useState, useEffect, useRef } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { PortfolioItem, Profile } from '@/lib/types';
import ContentDisplay from './ContentDisplay';

interface AudioTrack {
  id: number;
  title: string;
  url: string;
  thumbnail?: string;
}

interface FeedModalProps {
  isOpen: boolean;
  onClose: () => void;
  posts: PortfolioItem[];
  initialPostId?: number;
  profile?: Profile;
  currentAudioTrack?: AudioTrack | null;
  onAudioTrackChange?: (track: AudioTrack | null) => void;
}

export default function FeedModal({
  isOpen,
  onClose,
  posts,
  initialPostId,
  profile,
  currentAudioTrack,
  onAudioTrackChange
}: FeedModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Reverse posts order (newest first in feed)
  const reversedPosts = [...posts].reverse();

  useEffect(() => {
    if (isOpen && initialPostId) {
      const index = reversedPosts.findIndex(p => p.id === initialPostId);
      if (index !== -1) {
        setCurrentIndex(index);
        // Scroll to the initial post
        setTimeout(() => {
          const postElement = document.querySelector(`[data-index="${index}"]`);
          if (postElement) {
            postElement.scrollIntoView({ behavior: 'instant', block: 'start' });
          }
        }, 100);
      }
    }
  }, [isOpen, initialPostId, reversedPosts]);

  useEffect(() => {
    if (!isOpen) return;

    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Intersection Observer for tracking visible post
  useEffect(() => {
    if (!scrollContainerRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.getAttribute('data-index') || '0');
            setCurrentIndex(index);
          }
        });
      },
      { threshold: 0.5 }
    );

    const postElements = scrollContainerRef.current.querySelectorAll('.feed-post-item');
    postElements.forEach((post) => observerRef.current?.observe(post));

    return () => {
      observerRef.current?.disconnect();
    };
  }, [reversedPosts, isOpen]);

  if (!isOpen) return null;

  const currentPost = reversedPosts[currentIndex];

  return (
    <div 
      className="feed-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#111111',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header with Profile */}
      <div 
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(17, 17, 17, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '12px 16px'
        }}
      >
        {/* Profile Header with Close Button */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px'
          }}
        >
          {/* Profile Info */}
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '2px solid rgba(255, 255, 255, 0.1)',
                flexShrink: 0
              }}
            >
              {profile?.profile_picture ? (
                <img
                  src={profile.profile_picture}
                  alt={profile.display_name || profile.username}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(135deg, #00C2FF 0%, #764BA2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    fontSize: '16px',
                    fontWeight: 600
                  }}
                >
                  {profile?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
            </div>
            
            <div>
              <div 
                style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  color: '#FFFFFF',
                  lineHeight: 1.2
                }}
              >
                {profile?.display_name || profile?.username || 'User'}
              </div>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
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

        {/* Post Counter */}
        <div 
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.5)',
            textAlign: 'center'
          }}
        >
          {currentIndex + 1} / {reversedPosts.length}
        </div>
      </div>

      {/* Scrollable Content */}
      <div 
        ref={scrollContainerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {reversedPosts.map((post, index) => (
          <div
            key={post.id}
            data-index={index}
            className="feed-post-item"
            style={{
              minHeight: '100vh',
              display: 'flex',
              flexDirection: 'column',
              padding: '24px 16px',
              borderBottom: index < reversedPosts.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none'
            }}
          >
            {/* Content Display */}
            <div 
              style={{
                maxWidth: '600px',
                margin: '0 auto',
                width: '100%'
              }}
            >
              <FeedPostContent 
                post={post} 
                isActive={index === currentIndex}
                onAudioClick={(audioPost) => {
                  // Handle audio click - set the track for mini player
                  if (onAudioTrackChange && audioPost.content_url) {
                    onAudioTrackChange({
                      id: audioPost.id,
                      title: audioPost.title || 'Audio Track',
                      url: audioPost.content_url.startsWith('http') 
                        ? audioPost.content_url 
                        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${audioPost.content_url}`,
                      thumbnail: audioPost.thumbnail_url || undefined
                    });
                  }
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Individual Feed Post Content
function FeedPostContent({ 
  post, 
  isActive,
  onAudioClick
}: { 
  post: PortfolioItem;
  isActive: boolean;
  onAudioClick?: (post: PortfolioItem) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Auto-play video when it becomes active
  useEffect(() => {
    if (post.content_type === 'video' && videoRef.current) {
      if (isActive) {
        videoRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(error => {
          console.log('Autoplay prevented:', error);
        });
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [isActive, post.content_type]);

  const handleVideoClick = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const renderPrimaryContent = () => {
    switch (post.content_type) {
      case 'photo':
      case 'video':
        return (
          <div 
            style={{
              width: '100%',
              aspectRatio: '4 / 5',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              marginBottom: '16px',
              position: 'relative'
            }}
          >
            {post.content_type === 'photo' && post.content_url ? (
              <img
                src={post.content_url.startsWith('http') 
                  ? post.content_url 
                  : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${post.content_url}`}
                alt={post.title || 'Post'}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            ) : post.content_type === 'video' && post.content_url ? (
              <>
                <video
                  ref={videoRef}
                  src={post.content_url.startsWith('http') 
                    ? post.content_url 
                    : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${post.content_url}`}
                  loop
                  playsInline
                  muted={false}
                  onClick={handleVideoClick}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    cursor: 'pointer'
                  }}
                />
                {/* Play/Pause indicator - subtle overlay */}
                {!isPlaying && (
                  <div
                    onClick={handleVideoClick}
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      background: 'rgba(0, 0, 0, 0.5)',
                      backdropFilter: 'blur(10px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 150ms',
                      pointerEvents: 'all'
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                )}
              </>
            ) : null}
          </div>
        );
      
      case 'audio':
        return (
          <div 
            style={{ 
              marginBottom: '16px',
              cursor: 'pointer',
              borderRadius: '20px',
              overflow: 'hidden',
              position: 'relative'
            }}
            onClick={() => onAudioClick?.(post)}
          >
            {/* Audio Visual Display - No actual audio element */}
            <div 
              style={{
                width: '100%',
                aspectRatio: '4 / 5',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, rgba(10, 132, 255, 0.12), rgba(0, 194, 255, 0.08))',
                border: '1px solid rgba(10, 132, 255, 0.25)',
                padding: '32px 24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '24px',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 180ms cubic-bezier(0.25, 0.8, 0.25, 1)'
              }}
            >
              {/* Background Equalizer Pattern */}
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                opacity: 0.15,
                pointerEvents: 'none'
              }}>
                {[...Array(16)].map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: '4px',
                      height: `${30 + (i % 4) * 15}%`,
                      background: 'linear-gradient(to top, #0A84FF, #00C2FF)',
                      borderRadius: '2px',
                      animation: `audioWave ${0.8 + (i % 3) * 0.2}s ease-in-out infinite ${i * 0.1}s`
                    }}
                  />
                ))}
              </div>

              {/* Audio Icon */}
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'rgba(10, 132, 255, 0.2)',
                border: '2px solid rgba(10, 132, 255, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                zIndex: 1
              }}>
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#00C2FF"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 18V5l12-2v13" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>
              </div>

              {/* Title */}
              {post.title && (
                <div 
                  style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    color: '#FFFFFF',
                    textAlign: 'center',
                    position: 'relative',
                    zIndex: 1,
                    maxWidth: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'
                  }}
                >
                  {post.title}
                </div>
              )}

              {/* Tap to Play hint */}
              <div 
                style={{
                  fontSize: '13px',
                  color: 'rgba(10, 132, 255, 0.8)',
                  textAlign: 'center',
                  fontWeight: 600,
                  position: 'relative',
                  zIndex: 1,
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'
                }}
              >
                Tap to play in mini player
              </div>
            </div>
          </div>
        );
      
      case 'text':
        return (
          <div 
            style={{
              padding: '32px',
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, rgba(0, 194, 255, 0.08), rgba(118, 75, 162, 0.08))',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              marginBottom: '16px'
            }}
          >
            <div 
              style={{
                fontSize: '22px',
                lineHeight: '1.5',
                color: '#FFFFFF',
                fontWeight: 500,
                textAlign: 'center',
                fontStyle: 'italic'
              }}
            >
              "{post.text_content || post.description || post.title || 'Text content'}"
            </div>
          </div>
        );
      
      case 'pdf':
        return (
          <div 
            style={{
              padding: '48px',
              borderRadius: 'var(--radius-lg)',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginBottom: '16px'
            }}
          >
            <div 
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'rgba(0, 194, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}
            >
              <svg 
                className="w-10 h-10" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="#00C2FF"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <a
              href={post.content_url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '12px 24px',
                borderRadius: '20px',
                background: '#00C2FF',
                color: '#000000',
                fontWeight: 600,
                fontSize: '14px',
                textDecoration: 'none',
                transition: 'all 150ms',
                pointerEvents: post.content_url ? 'auto' : 'none',
                opacity: post.content_url ? 1 : 0.5
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#33D1FF';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#00C2FF';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              View Document
            </a>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div>
      {/* Primary Content */}
      {renderPrimaryContent()}

      {/* Title & Description */}
      {(post.title || post.description) && (
        <div style={{ marginBottom: '16px' }}>
          {post.title && (
            <h2 
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: '#FFFFFF',
                marginBottom: '8px',
                letterSpacing: '-0.5px'
              }}
            >
              {post.title}
            </h2>
          )}
          {post.description && post.content_type !== 'text' && (
            <p 
              style={{
                fontSize: '15px',
                lineHeight: '1.5',
                color: 'rgba(255, 255, 255, 0.7)'
              }}
            >
              {post.description}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

