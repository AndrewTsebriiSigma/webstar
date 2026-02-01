'use client';

import { useState, useEffect, useRef } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { PortfolioItem, Profile } from '@/lib/types';
import ContentDisplay from './ContentDisplay';

// Platform detection utility
const detectPlatform = () => {
  if (typeof window === 'undefined') return 'desktop';
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  const isAndroid = /android/.test(userAgent);
  
  if (isIOS) return 'ios';
  if (isAndroid) return 'android';
  return 'desktop';
};

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
  
  // Animation states
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  
  // Track playback positions for resume functionality
  const [playbackPositions, setPlaybackPositions] = useState<Record<number, number>>({});
  
  // Platform detection for PDF viewer
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop');
  
  // Detect platform on mount
  useEffect(() => {
    setPlatform(detectPlatform());
  }, []);

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
    if (isOpen) {
      requestAnimationFrame(() => setIsVisible(true));
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      setIsVisible(false);
      setIsClosing(false);
    }
    
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

  // Animated close handler
  const handleClose = () => {
    setIsClosing(true);
    setIsVisible(false);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  };

  if (!isOpen && !isClosing) return null;

  const currentPost = reversedPosts[currentIndex];

  return (
    <>
      {/* Backdrop with animation */}
      <div 
        className={`bottom-slider-backdrop ${isVisible ? 'entering' : 'exiting'}`}
        onClick={handleClose}
      />
      
      {/* Feed Content with animation */}
      <div 
        className={`bottom-slider-content ${isVisible ? 'entering' : 'exiting'}`}
        onClick={(e) => e.stopPropagation()}
        style={{
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
            background: 'rgba(20, 20, 20, 0.8)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '12px 16px',
            flexShrink: 0
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
            onClick={handleClose}
            className="flex items-center justify-center hover:opacity-70 transition-opacity"
            style={{ width: '28px', height: '28px' }}
          >
            <XMarkIcon style={{ width: '20px', height: '20px', color: 'rgba(255, 255, 255, 0.6)' }} />
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
                platform={platform}
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
    </>
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
  onSavePosition,
  platform
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
  platform: 'ios' | 'android' | 'desktop';
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [showAttachmentPdfModal, setShowAttachmentPdfModal] = useState(false);
  const [showPhotoAttachmentModal, setShowPhotoAttachmentModal] = useState(false);

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
              aspectRatio: '4 / 5',
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
                  height: '100%',
                  maxHeight: '65vh',
                  objectFit: 'cover',
                  aspectRatio: '4 / 5'
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
                    maxHeight: '65vh',
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
                {/* Button container for sound and mini-player - Fixed positioning to stay visible */}
                <div style={{
                  position: 'absolute',
                  bottom: '16px',
                  right: '16px',
                  display: 'flex',
                  gap: '8px',
                  zIndex: 10
                }}>
                  {/* Sound Toggle Button - always visible for videos */}
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
            {/* Audio Visual Display - Clickable to load in mini-player */}
            <div 
              onClick={() => {
                if (onAudioClick) {
                  onAudioClick(post);
                }
              }}
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
                transition: 'all 180ms cubic-bezier(0.25, 0.8, 0.25, 1)',
                cursor: onAudioClick ? 'pointer' : 'default'
              }}
              onMouseEnter={(e) => {
                if (onAudioClick) {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.borderColor = 'rgba(10, 132, 255, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (onAudioClick) {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.borderColor = 'rgba(10, 132, 255, 0.25)';
                }
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

                {/* Add to Player Button - For audio posts */}
                {onAudioClick && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAudioClick(post);
                    }}
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
      
      case 'pdf': {
        const pdfUrl = post.content_url && post.content_url.startsWith('http') 
          ? post.content_url 
          : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${post.content_url}`;
        return (
          <>
            <div 
              onClick={() => setShowPdfModal(true)}
              style={{
                padding: '48px',
                borderRadius: 'var(--radius-lg)',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                marginBottom: '16px',
                cursor: 'pointer',
                transition: 'all 150ms'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.transform = 'scale(1.01)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                e.currentTarget.style.transform = 'scale(1)';
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
              <div style={{
                padding: '12px 24px',
                borderRadius: '20px',
                background: '#00C2FF',
                color: '#000000',
                fontWeight: 600,
                fontSize: '14px',
                opacity: post.content_url ? 1 : 0.5
              }}>
                View Document
              </div>
            </div>
            
            {/* PDF Preview Modal */}
            {showPdfModal && post.content_url && (
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  // Clicking backdrop closes PDF modal only, not parent modal
                  setShowPdfModal(false);
                }}
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 1000,
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
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowPdfModal(false);
                    }}
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
                  style={{ 
                    flex: 1, 
                    overflow: 'hidden',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {/* Desktop: Use scrollable iframe with hidden scrollbar */}
                  <div 
                    style={{
                      width: '100%',
                      height: '100%',
                      overflow: 'auto',
                      borderRadius: '12px',
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none'
                    }}
                    className="pdf-viewer-container"
                  >
                    <iframe
                      src={pdfUrl ? `${pdfUrl}#toolbar=1&navpanes=1&scrollbar=0` : ''}
                      style={{
                        width: '100%',
                        height: '100%',
                        minHeight: '600px',
                        border: 'none',
                        borderRadius: '12px',
                        background: '#FFFFFF',
                      }}
                      title="PDF Document"
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        );
      }
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
              style={{
                padding: '16px',
                borderRadius: '12px',
                background: 'rgba(10, 132, 255, 0.08)',
                border: '1px solid rgba(10, 132, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                position: 'relative',
                overflow: 'hidden',
                minHeight: '80px'
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
              {/* Animated Equalizer Bars */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                gap: '4px',
                height: '40px',
                flexShrink: 0
              }}>
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: '4px',
                      height: `${20 + (i % 3) * 15}%`,
                      background: 'linear-gradient(to top, #0A84FF, #00C2FF)',
                      borderRadius: '2px',
                      animation: `equalizerAnimation ${0.6 + i * 0.15}s ease-in-out infinite alternate`,
                      transformOrigin: 'bottom'
                    }}
                  />
                ))}
              </div>
              
              {/* Title */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#FFFFFF', textAlign: 'center' }}>
                  {post.title || 'Audio Attachment'}
                </div>
              </div>
              
              {/* Single Play Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                if (onPlayInMiniPlayer && post.attachment_url) {
                  const audioPost: PortfolioItem = {
                    ...post,
                    content_type: 'audio',
                    content_url: post.attachment_url
                  };
                  onPlayInMiniPlayer(audioPost, true);
                }
              }}
              style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: '#00C2FF',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 150ms',
                  boxShadow: '0 4px 12px rgba(0, 194, 255, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1)';
                  e.currentTarget.style.background = '#33D1FF';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 194, 255, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.background = '#00C2FF';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 194, 255, 0.3)';
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <polygon points="5,3 19,12 5,21" />
                </svg>
              </button>

              <style jsx>{`
                @keyframes equalizerAnimation {
                  0% { 
                    height: 20%;
                    opacity: 0.6;
                  }
                  50% {
                    height: 60%;
                    opacity: 1;
                  }
                  100% { 
                    height: 85%;
                    opacity: 0.8;
                  }
                }
              `}</style>
            </div>
          )}
          
          {post.attachment_type === 'photo' && post.attachment_url && (
            <>
              <div 
                onClick={() => setShowPhotoAttachmentModal(true)}
                style={{
                  padding: '16px',
                borderRadius: '12px',
                  background: 'rgba(0, 194, 255, 0.08)',
                  border: '1px solid rgba(0, 194, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 194, 255, 0.15)';
                e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 194, 255, 0.08)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                  borderRadius: '8px',
                  background: 'rgba(0, 194, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                  flexShrink: 0,
                  overflow: 'hidden'
              }}>
                  <img
                    src={post.attachment_url.startsWith('http') 
                      ? post.attachment_url 
                      : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${post.attachment_url}`}
                    alt="Photo attachment"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#FFFFFF',
                    marginBottom: '4px'
                  }}>
                    Photo Attachment
                </div>
                  <div style={{
                    fontSize: '13px',
                    color: '#00C2FF',
                    fontWeight: 600
                  }}>
                    Tap to preview →
                  </div>
                </div>
              </div>
              
              {/* Photo Attachment Preview Modal */}
              {showPhotoAttachmentModal && post.attachment_url && (
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    // Clicking backdrop closes photo attachment modal only, not parent modal
                    setShowPhotoAttachmentModal(false);
                  }}
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 1000,
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
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                      Photo Attachment
                    </h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowPhotoAttachmentModal(false);
                      }}
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

                  {/* Photo Viewer */}
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    style={{ 
                      flex: 1, 
                      overflow: 'auto', 
                      padding: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <img
                      src={post.attachment_url.startsWith('http') 
                        ? post.attachment_url 
                        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${post.attachment_url}`}
                      alt="Photo attachment preview"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'cover',
                        aspectRatio: '4 / 5',
                        borderRadius: '12px'
                      }}
                    />
              </div>
            </div>
              )}
            </>
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
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAttachmentPdfModal(true);
                    }}
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
                    // Clicking backdrop closes attachment PDF modal only, not parent modal
                    setShowAttachmentPdfModal(false);
                  }}
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 1000,
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
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAttachmentPdfModal(false);
                      }}
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
                    style={{ 
                      flex: 1, 
                      overflow: platform === 'desktop' ? 'auto' : 'hidden', 
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {platform === 'ios' || platform === 'android' ? (
                      // Mobile: Use native PDF viewer
                      <div style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '20px',
                        padding: '40px 20px'
                      }}>
                        <div style={{
                          width: '80px',
                          height: '80px',
                          borderRadius: '50%',
                          background: 'rgba(239, 68, 68, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '10px'
                        }}>
                          <svg className="w-10 h-10" fill="none" stroke="#EF4444" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                          </svg>
                        </div>
                        <p style={{
                          fontSize: '16px',
                          fontWeight: 600,
                          color: '#FFFFFF',
                          textAlign: 'center',
                          marginBottom: '8px'
                        }}>
                          PDF Attachment
                        </p>
                        <p style={{
                          fontSize: '14px',
                          color: 'rgba(255, 255, 255, 0.6)',
                          textAlign: 'center',
                          marginBottom: '24px'
                        }}>
                          Tap to open in {platform === 'ios' ? 'Safari' : 'Chrome'} viewer
                        </p>
                        <a
                          href={post.attachment_url.startsWith('http') 
                        ? post.attachment_url 
                        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${post.attachment_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            padding: '14px 32px',
                            borderRadius: '20px',
                            background: '#EF4444',
                            color: '#FFFFFF',
                            fontWeight: 600,
                            fontSize: '15px',
                            textDecoration: 'none',
                            display: 'inline-block',
                            transition: 'all 150ms',
                            cursor: 'pointer'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#F87171';
                            e.currentTarget.style.transform = 'scale(1.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#EF4444';
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            // Open in native viewer
                          }}
                        >
                          Open PDF
                        </a>
                      </div>
                    ) : (
                      // Desktop: Use scrollable iframe
                      <iframe
                        src={`${post.attachment_url.startsWith('http') 
                          ? post.attachment_url 
                          : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${post.attachment_url}`}#toolbar=1&navpanes=1&scrollbar=1`}
                      style={{
                        width: '100%',
                        height: '100%',
                          minHeight: '600px',
                        border: 'none',
                        borderRadius: '12px',
                        background: '#FFFFFF',
                      }}
                      title="PDF Attachment"
                    />
                    )}
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

