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
  onPlayInMiniPlayer?: (item: PortfolioItem) => void;
  isMiniPlayerMuted?: boolean;
  onToggleMiniPlayerMute?: () => void;
}

export default function FeedModal({
  isOpen,
  onClose,
  posts,
  initialPostId,
  profile,
  currentAudioTrack,
  onAudioTrackChange,
  onPlayInMiniPlayer,
  isMiniPlayerMuted,
  onToggleMiniPlayerMute
}: FeedModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Reverse posts order (newest first in feed)
  const reversedPosts = [...posts].reverse();

  // Track if initial scroll has been done
  const hasScrolledToInitial = useRef(false);

  useEffect(() => {
    if (isOpen && initialPostId && !hasScrolledToInitial.current) {
      const index = reversedPosts.findIndex(p => p.id === initialPostId);
      if (index !== -1) {
        setCurrentIndex(index);
        // Scroll to the initial post
        setTimeout(() => {
          const postElement = document.querySelector(`[data-index="${index}"]`);
          if (postElement) {
            postElement.scrollIntoView({ behavior: 'instant', block: 'start' });
            hasScrolledToInitial.current = true;
          }
        }, 100);
      }
    }
    
    // Reset flag when modal closes
    if (!isOpen) {
      hasScrolledToInitial.current = false;
    }
  }, [isOpen, initialPostId]);

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
    if (!scrollContainerRef.current || !isOpen) return;

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
  }, [isOpen]); // Only re-run when modal opens/closes

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
                onPlayInMiniPlayer={onPlayInMiniPlayer}
                currentPlayingTrackId={currentAudioTrack?.id}
                isMiniPlayerMuted={isMiniPlayerMuted}
                onToggleMiniPlayerMute={onToggleMiniPlayerMute}
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
  onAudioClick,
  onPlayInMiniPlayer,
  currentPlayingTrackId,
  isMiniPlayerMuted,
  onToggleMiniPlayerMute
}: { 
  post: PortfolioItem;
  isActive: boolean;
  onAudioClick?: (post: PortfolioItem) => void;
  onPlayInMiniPlayer?: (post: PortfolioItem) => void;
  currentPlayingTrackId?: number;
  isMiniPlayerMuted?: boolean;
  onToggleMiniPlayerMute?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Check if this post is currently playing in mini-player
  const isCurrentlyPlaying = currentPlayingTrackId === post.id;
  // Auto-play video when it becomes active (starts muted)
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

  const handleMiniPlayerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPlayInMiniPlayer) {
      onPlayInMiniPlayer(post);
    }
  };

  const handleSoundToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Only toggle mute if this track is currently playing in mini-player
    if (isCurrentlyPlaying && onToggleMiniPlayerMute) {
      onToggleMiniPlayerMute();
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
                  muted // Video always muted - audio via mini-player only
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
                {/* Button container for sound and mini-player */}
                <div style={{
                  position: 'absolute',
                  bottom: '16px',
                  right: '16px',
                  display: 'flex',
                  gap: '8px',
                  zIndex: 10
                }}>
                  {/* Sound Toggle Button - only visible when this track is playing in mini-player */}
                  {isCurrentlyPlaying && (
                    <button
                      onClick={handleSoundToggle}
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        background: isMiniPlayerMuted ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 194, 255, 0.3)',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        border: isMiniPlayerMuted ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(0, 194, 255, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 150ms'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = isMiniPlayerMuted ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 194, 255, 0.4)';
                        e.currentTarget.style.transform = 'scale(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = isMiniPlayerMuted ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 194, 255, 0.3)';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                      title={isMiniPlayerMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMiniPlayerMuted ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                          <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                        </svg>
                      )}
                    </button>
                  )}

                  {/* Mini-Player Button - Opens audio in mini-player */}
                  {onPlayInMiniPlayer && (
                    <button
                      onClick={handleMiniPlayerClick}
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        background: isCurrentlyPlaying ? 'rgba(0, 194, 255, 0.3)' : 'rgba(0, 0, 0, 0.6)',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        border: isCurrentlyPlaying ? '1px solid rgba(0, 194, 255, 0.5)' : '1px solid rgba(255, 255, 255, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 150ms'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(0, 194, 255, 0.3)';
                        e.currentTarget.style.borderColor = 'rgba(0, 194, 255, 0.5)';
                        e.currentTarget.style.transform = 'scale(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = isCurrentlyPlaying ? 'rgba(0, 194, 255, 0.3)' : 'rgba(0, 0, 0, 0.6)';
                        e.currentTarget.style.borderColor = isCurrentlyPlaying ? 'rgba(0, 194, 255, 0.5)' : 'rgba(255, 255, 255, 0.15)';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                      title="Play in mini-player"
                    >
                      {/* Modern equalizer/waveform icon */}
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                        <rect x="4" y="8" width="2" height="8" rx="1" fill="white" />
                        <rect x="9" y="5" width="2" height="14" rx="1" fill="white" />
                        <rect x="14" y="7" width="2" height="10" rx="1" fill="white" />
                        <rect x="19" y="9" width="2" height="6" rx="1" fill="white" />
                      </svg>
                    </button>
                  )}
                </div>
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
          >
            {/* Audio Visual Display - No inline audio element, uses mini-player */}
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

              {/* Button container for sound and mini-player */}
              <div style={{
                position: 'absolute',
                bottom: '16px',
                right: '16px',
                display: 'flex',
                gap: '8px',
                zIndex: 10
              }}>
                {/* Sound Toggle Button - only visible when this track is playing in mini-player */}
                {isCurrentlyPlaying && (
                  <button
                    onClick={handleSoundToggle}
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: isMiniPlayerMuted ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 194, 255, 0.3)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      border: isMiniPlayerMuted ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(0, 194, 255, 0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 150ms'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = isMiniPlayerMuted ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 194, 255, 0.4)';
                      e.currentTarget.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = isMiniPlayerMuted ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 194, 255, 0.3)';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                    title={isMiniPlayerMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMiniPlayerMuted ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                        <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                      </svg>
                    )}
                  </button>
                )}

                {/* Mini-Player Button - Opens audio in mini-player */}
                {onPlayInMiniPlayer && (
                  <button
                    onClick={handleMiniPlayerClick}
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: isCurrentlyPlaying ? 'rgba(0, 194, 255, 0.3)' : 'rgba(0, 0, 0, 0.6)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      border: isCurrentlyPlaying ? '1px solid rgba(0, 194, 255, 0.5)' : '1px solid rgba(255, 255, 255, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 150ms'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(0, 194, 255, 0.3)';
                      e.currentTarget.style.borderColor = 'rgba(0, 194, 255, 0.5)';
                      e.currentTarget.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = isCurrentlyPlaying ? 'rgba(0, 194, 255, 0.3)' : 'rgba(0, 0, 0, 0.6)';
                      e.currentTarget.style.borderColor = isCurrentlyPlaying ? 'rgba(0, 194, 255, 0.5)' : 'rgba(255, 255, 255, 0.15)';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                    title="Play in mini-player"
                  >
                    {/* Modern equalizer/waveform icon */}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                      <rect x="4" y="8" width="2" height="8" rx="1" fill="white" />
                      <rect x="9" y="5" width="2" height="14" rx="1" fill="white" />
                      <rect x="14" y="7" width="2" height="10" rx="1" fill="white" />
                      <rect x="19" y="9" width="2" height="6" rx="1" fill="white" />
                    </svg>
                  </button>
                )}
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

      {/* Attachments */}
      {post.attachment_url && post.attachment_type && (
        <div style={{ marginTop: '16px' }}>
          {post.attachment_type === 'audio' && (
            <div 
              style={{
                padding: '16px',
                borderRadius: '12px',
                background: 'rgba(10, 132, 255, 0.08)',
                border: '1px solid rgba(10, 132, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'rgba(10, 132, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <svg
                  width="20"
                  height="20"
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
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#FFFFFF',
                  marginBottom: '4px'
                }}>
                  Audio Attachment
                </div>
                <audio 
                  controls 
                  style={{ 
                    width: '100%', 
                    height: '32px',
                    outline: 'none'
                  }}
                  src={post.attachment_url.startsWith('http') 
                    ? post.attachment_url 
                    : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${post.attachment_url}`}
                >
                  Your browser does not support the audio element.
                </audio>
              </div>
            </div>
          )}
          
          {post.attachment_type === 'pdf' && (
            <div 
              style={{
                padding: '16px',
                borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#EF4444"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#FFFFFF',
                  marginBottom: '4px'
                }}>
                  PDF Document
                </div>
                <a
                  href={post.attachment_url.startsWith('http') 
                    ? post.attachment_url 
                    : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${post.attachment_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: '13px',
                    color: '#EF4444',
                    textDecoration: 'none',
                    fontWeight: 600
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.textDecoration = 'underline';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.textDecoration = 'none';
                  }}
                >
                  View Document →
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

