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
  startTime?: number; // Resume position in seconds
}

interface FeedModalProps {
  isOpen: boolean;
  onClose: () => void;
  posts: PortfolioItem[];
  initialPostId?: number;
  profile?: Profile;
  currentAudioTrack?: AudioTrack | null;
  onAudioTrackChange?: (track: AudioTrack | null) => void;
  onPlayInMiniPlayer?: (item: PortfolioItem, showUI?: boolean, startTime?: number) => void;
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
  
  // Track playback positions for resume functionality
  const [playbackPositions, setPlaybackPositions] = useState<Record<number, number>>({});

  // Reverse posts order (newest first in feed)
  const reversedPosts = [...posts].reverse();
  
  // Handler to save playback position when scrolling away
  const savePlaybackPosition = (postId: number, position: number) => {
    setPlaybackPositions(prev => ({
      ...prev,
      [postId]: position
    }));
  };
  
  // Get saved playback position for a post
  const getPlaybackPosition = (postId: number): number => {
    return playbackPositions[postId] || 0;
  };

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

        {/* Progress Bar (gradient fill as user scrolls) */}
        <div 
          style={{
            width: '100%',
            height: '3px',
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '2px',
            overflow: 'hidden',
            marginTop: '4px'
          }}
        >
          <div 
            style={{
              width: `${((currentIndex + 1) / reversedPosts.length) * 100}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #00C2FF, #764BA2)',
              borderRadius: '2px',
              transition: 'width 0.3s ease-out'
            }}
          />
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
              display: 'flex',
              flexDirection: 'column',
              padding: '16px 16px 24px',
              borderBottom: index < reversedPosts.length - 1 ? '1px solid rgba(255, 255, 255, 0.08)' : 'none'
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
                    const startTime = getPlaybackPosition(audioPost.id);
                    onAudioTrackChange({
                      id: audioPost.id,
                      title: audioPost.title || 'Audio Track',
                      url: audioPost.content_url.startsWith('http') 
                        ? audioPost.content_url 
                        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${audioPost.content_url}`,
                      thumbnail: audioPost.thumbnail_url || undefined,
                      startTime: startTime
                    });
                  }
                }}
                onPlayInMiniPlayer={(item, showUI, startTime) => {
                  // For video, use FeedModal's locally saved position
                  // For audio, let the page handle it (page tracks audio positions via MiniPlayer)
                  if (item.content_type === 'video') {
                    const videoPosition = getPlaybackPosition(item.id);
                    onPlayInMiniPlayer?.(item, showUI, videoPosition > 0 ? videoPosition : startTime);
                  } else {
                    // Audio - don't override, let page use its own saved position
                    onPlayInMiniPlayer?.(item, showUI, startTime);
                  }
                }}
                currentPlayingTrackId={currentAudioTrack?.id}
                isMiniPlayerMuted={isMiniPlayerMuted}
                onToggleMiniPlayerMute={onToggleMiniPlayerMute}
                onStopAudio={() => {
                  // Save current audio position before stopping
                  // The MiniPlayer will provide the current time via a callback
                  onAudioTrackChange?.(null);
                }}
                savedPosition={getPlaybackPosition(post.id)}
                onSavePosition={savePlaybackPosition}
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
  onToggleMiniPlayerMute,
  onStopAudio,
  savedPosition,
  onSavePosition
}: { 
  post: PortfolioItem;
  isActive: boolean;
  onAudioClick?: (post: PortfolioItem) => void;
  onPlayInMiniPlayer?: (post: PortfolioItem, showUI?: boolean, startTime?: number) => void;
  currentPlayingTrackId?: number;
  isMiniPlayerMuted?: boolean;
  onToggleMiniPlayerMute?: () => void;
  onStopAudio?: (currentTime?: number) => void;
  savedPosition?: number;
  onSavePosition?: (postId: number, position: number) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [showAttachmentPdfModal, setShowAttachmentPdfModal] = useState(false);

  // Check if this post is currently playing in mini-player
  const isCurrentlyPlaying = currentPlayingTrackId === post.id;
  
  // Auto-play video when it becomes active (starts muted), restore position
  useEffect(() => {
    if (post.content_type === 'video' && videoRef.current) {
      if (isActive) {
        // Restore saved position if available
        if (savedPosition && savedPosition > 0) {
          videoRef.current.currentTime = savedPosition;
        }
        videoRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(error => {
          console.log('Autoplay prevented:', error);
        });
      } else {
        // Save current position before pausing
        if (videoRef.current.currentTime > 0 && onSavePosition) {
          onSavePosition(post.id, videoRef.current.currentTime);
        }
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [isActive, post.content_type, savedPosition, onSavePosition, post.id]);

  // Stop audio when scrolling away from this post (if this post's audio is playing)
  // Also save the current position for resuming later
  useEffect(() => {
    if (!isActive && isCurrentlyPlaying && onStopAudio) {
      // The onStopAudio callback will handle saving position
      onStopAudio();
    }
  }, [isActive, isCurrentlyPlaying, onStopAudio]);

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
      // Show mini player UI when "Add to player" is clicked
      // Pass saved position to resume from where it left off
      onPlayInMiniPlayer(post, true, savedPosition);
    }
  };

  const handleSoundToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrentlyPlaying && onToggleMiniPlayerMute) {
      // Track is playing - just toggle mute
      onToggleMiniPlayerMute();
    } else if (onPlayInMiniPlayer) {
      // Track not playing - play audio WITHOUT showing mini player UI
      // Pass saved position to resume from where it left off
      onPlayInMiniPlayer(post, false, savedPosition);
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
              maxHeight: '65vh',
              borderRadius: '12px',
              overflow: 'hidden',
              marginBottom: '12px',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0, 0, 0, 0.2)'
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
                  maxHeight: '65vh',
                  objectFit: 'contain'
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
                    maxHeight: '65vh',
                    objectFit: 'contain',
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
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#FF6B6B">
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

              {/* Button container - Mute + Add to Player */}
              <div style={{
                position: 'absolute',
                bottom: '16px',
                right: '16px',
                display: 'flex',
                gap: '8px',
                zIndex: 10
              }}>
                {/* Mute Button - Always visible for quick mute */}
                <button
                  onClick={handleSoundToggle}
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: isMiniPlayerMuted ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    border: isMiniPlayerMuted ? '1px solid rgba(255, 100, 100, 0.4)' : '1px solid rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 150ms'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)';
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = isMiniPlayerMuted ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                  title={isMiniPlayerMuted ? 'Unmute' : 'Mute'}
                >
                  {isMiniPlayerMuted ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#FF6B6B">
                      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                    </svg>
                  )}
                </button>

                {/* Add to Player Button */}
                {onPlayInMiniPlayer && (
                  <button
                    onClick={handleMiniPlayerClick}
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: isCurrentlyPlaying ? 'rgba(0, 194, 255, 0.3)' : 'rgba(0, 0, 0, 0.5)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      border: isCurrentlyPlaying ? '1px solid rgba(0, 194, 255, 0.5)' : '1px solid rgba(255, 255, 255, 0.2)',
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
                      e.currentTarget.style.background = isCurrentlyPlaying ? 'rgba(0, 194, 255, 0.3)' : 'rgba(0, 0, 0, 0.5)';
                      e.currentTarget.style.borderColor = isCurrentlyPlaying ? 'rgba(0, 194, 255, 0.5)' : 'rgba(255, 255, 255, 0.2)';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                    title={isCurrentlyPlaying ? 'Playing in mini-player' : 'Add to player'}
                  >
                    {/* Equalizer icon */}
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
        const pdfUrl = post.content_url && post.content_url.startsWith('http') 
          ? post.content_url 
          : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${post.content_url}`;
        return (
          <>
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
              <button
                onClick={() => setShowPdfModal(true)}
                style={{
                  padding: '12px 24px',
                  borderRadius: '20px',
                  background: '#00C2FF',
                  color: '#000000',
                  fontWeight: 600,
                  fontSize: '14px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 150ms',
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
              </button>
            </div>
            
            {/* PDF Preview Modal */}
            {showPdfModal && post.content_url && (
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  // Clicking backdrop closes PDF modal only
                  setShowPdfModal(false);
                }}
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 100,
                  background: 'rgba(0, 0, 0, 0.95)',
                  backdropFilter: 'blur(20px)',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Header */}
                <div 
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}>
                    <svg className="w-5 h-5" fill="none" stroke="#00C2FF" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    {post.title || 'Document'}
                  </h3>
                  <button
                    onClick={() => setShowPdfModal(false)}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="#FFFFFF" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* PDF Viewer */}
                <div 
                  onClick={(e) => e.stopPropagation()}
                  style={{ flex: 1, overflow: 'hidden', padding: '20px' }}
                >
                  <iframe
                    src={pdfUrl}
                    style={{
                      width: '100%',
                      height: '100%',
                      border: 'none',
                      borderRadius: '12px',
                      background: '#FFFFFF',
                    }}
                    title="PDF Document"
                  />
                </div>
              </div>
            )}
          </>
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
        <div style={{ marginBottom: '12px' }}>
          {post.title && (
            <h2 
              style={{
                fontSize: '18px',
                fontWeight: 600,
                color: '#FFFFFF',
                marginBottom: '6px',
                letterSpacing: '-0.3px'
              }}
            >
              {post.title}
            </h2>
          )}
          {post.description && post.content_type !== 'text' && (
            <p 
              style={{
                fontSize: '14px',
                lineHeight: '1.5',
                color: 'rgba(255, 255, 255, 0.6)'
              }}
            >
              {post.description}
            </p>
          )}
        </div>
      )}

      {/* Attachments */}
      {post.attachment_url && post.attachment_type && (
        <div style={{ marginTop: '12px' }}>
          {post.attachment_type === 'audio' && post.attachment_url && (
            <div 
              onClick={() => {
                // Play audio attachment in mini-player by creating a temporary audio item
                if (onPlayInMiniPlayer && post.attachment_url) {
                  // Create a modified post object with the attachment as main content
                  const audioPost: PortfolioItem = {
                    ...post,
                    content_type: 'audio',
                    content_url: post.attachment_url
                  };
                  // Show mini player UI when clicking audio attachment
                  onPlayInMiniPlayer(audioPost, true);
                }
              }}
              style={{
                padding: '12px 16px',
                borderRadius: '12px',
                background: 'rgba(10, 132, 255, 0.08)',
                border: '1px solid rgba(10, 132, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(10, 132, 255, 0.15)';
                e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(10, 132, 255, 0.08)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {/* Music Icon Circle */}
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
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00C2FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18V5l12-2v13" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>
              </div>
              
              {/* Title and Play hint */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#FFFFFF' }}>
                  {post.title || 'Audio Attachment'}
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', marginTop: '2px' }}>
                  Tap to play
                </div>
              </div>
              
              {/* Play Button */}
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: '#00C2FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                  <polygon points="5,3 19,12 5,21" />
                </svg>
              </div>
            </div>
          )}
          
          {post.attachment_type === 'pdf' && (
            <>
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
                  <button
                    onClick={() => setShowAttachmentPdfModal(true)}
                    style={{
                      fontSize: '13px',
                      color: '#EF4444',
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
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
                  </button>
                </div>
              </div>
              
              {/* PDF Attachment Preview Modal */}
              {showAttachmentPdfModal && post.attachment_url && (
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    // Clicking backdrop closes attachment PDF modal only
                    setShowAttachmentPdfModal(false);
                  }}
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 100,
                    background: 'rgba(0, 0, 0, 0.95)',
                    backdropFilter: 'blur(20px)',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {/* Header */}
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px 20px',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: 600,
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}>
                      <svg className="w-5 h-5" fill="none" stroke="#EF4444" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                      PDF Attachment
                    </h3>
                    <button
                      onClick={() => setShowAttachmentPdfModal(false)}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="#FFFFFF" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* PDF Viewer */}
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    style={{ flex: 1, overflow: 'hidden', padding: '20px' }}
                  >
                    <iframe
                      src={post.attachment_url.startsWith('http') 
                        ? post.attachment_url 
                        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${post.attachment_url}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        border: 'none',
                        borderRadius: '12px',
                        background: '#FFFFFF',
                      }}
                      title="PDF Attachment"
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

