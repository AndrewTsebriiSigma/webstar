'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  PlayIcon, 
  PauseIcon, 
  DocumentIcon,
  MusicalNoteIcon 
} from '@heroicons/react/24/solid';
import { PortfolioItem } from '@/lib/types';

interface ContentDisplayProps {
  item: PortfolioItem;
  isActive?: boolean;
  showAttachments?: boolean;
  onClick?: () => void;
  variant?: 'compact' | 'full'; // Add variant prop
  customRadius?: number; // Custom border radius from grid customization
  onPlayInMiniPlayer?: (item: PortfolioItem, showUI?: boolean) => void; // Callback to spawn mini-player
  currentPlayingTrackId?: number; // ID of currently playing track in mini-player
  isMiniPlayerMuted?: boolean; // Mute state of mini-player
  onToggleMiniPlayerMute?: () => void; // Callback to toggle mini-player mute
}

export default function ContentDisplay({ 
  item, 
  isActive = false, 
  showAttachments = true,
  onClick,
  variant = 'compact', // Default to compact for grid
  customRadius,
  onPlayInMiniPlayer,
  currentPlayingTrackId,
  isMiniPlayerMuted,
  onToggleMiniPlayerMute
}: ContentDisplayProps) {
  // All items use same aspect ratio in grid (4:5) for compact
  // Full variant can have dynamic sizing
  const aspectRatio = variant === 'compact' ? '4 / 5' : undefined;

  const renderContent = () => {
    switch (item.content_type) {
      case 'photo':
        return <PhotoDisplay item={item} onClick={onClick} />;
      case 'audio':
        return variant === 'full' ? (
          <AudioDisplay item={item} isActive={isActive} />
        ) : (
          <AudioDisplayCompact 
            item={item} 
            onClick={onClick} 
            onPlayInMiniPlayer={onPlayInMiniPlayer}
            currentPlayingTrackId={currentPlayingTrackId}
            isMiniPlayerMuted={isMiniPlayerMuted}
            onToggleMiniPlayerMute={onToggleMiniPlayerMute}
          />
        );
      case 'text':
        return variant === 'full' ? (
          <TextDisplay item={item} onClick={onClick} />
        ) : (
          <TextDisplayCompact item={item} onClick={onClick} />
        );
      case 'pdf':
        return <PDFDisplay item={item} onClick={onClick} />;
      case 'video':
        return (
          <VideoDisplay 
            item={item} 
            onClick={onClick} 
            onPlayInMiniPlayer={onPlayInMiniPlayer}
            currentPlayingTrackId={currentPlayingTrackId}
            isMiniPlayerMuted={isMiniPlayerMuted}
            onToggleMiniPlayerMute={onToggleMiniPlayerMute}
          />
        );
      default:
        return <PhotoDisplay item={item} onClick={onClick} />;
    }
  };

  return (
    <div 
      className="content-display-wrapper"
      style={{ 
        aspectRatio: aspectRatio,
        width: '100%',
        height: variant === 'full' ? 'auto' : '100%',
        minWidth: 0, // Prevent overflow
        overflow: 'hidden',
        boxSizing: 'border-box',
        position: 'relative',
        borderRadius: customRadius !== undefined ? (customRadius === 0 ? '0px' : `${customRadius}px`) : undefined
      }}
    >
      {renderContent()}
    </div>
  );
}

// Photo Display Component
function PhotoDisplay({ item, onClick }: { item: PortfolioItem; onClick?: () => void }) {
  const imageUrl = item.content_url && item.content_url.startsWith('http') 
    ? item.content_url 
    : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${item.content_url}`;

  return (
    <div 
      className="photo-display"
      onClick={onClick}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        background: 'rgba(255, 255, 255, 0.03)'
      }}
    >
      <img
        src={imageUrl}
        alt={item.title || 'Portfolio item'}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover'
        }}
        onError={(e) => {
          console.error('Failed to load image:', imageUrl);
          // Use a simple gradient placeholder instead of broken URL
          e.currentTarget.style.display = 'none';
          if (e.currentTarget.parentElement) {
            e.currentTarget.parentElement.style.background = 'linear-gradient(135deg, rgba(0, 194, 255, 0.2), rgba(118, 75, 162, 0.2))';
          }
        }}
      />
    </div>
  );
}

// Audio Display Component - Compact for Grid (Preview - No Controls)
function AudioDisplayCompact({ 
  item, 
  onClick,
  onPlayInMiniPlayer,
  currentPlayingTrackId,
  isMiniPlayerMuted,
  onToggleMiniPlayerMute
}: { 
  item: PortfolioItem; 
  onClick?: () => void;
  onPlayInMiniPlayer?: (item: PortfolioItem, showUI?: boolean) => void;
  currentPlayingTrackId?: number;
  isMiniPlayerMuted?: boolean;
  onToggleMiniPlayerMute?: () => void;
}) {
  // Check if this item is currently playing in mini-player
  const isCurrentlyPlaying = currentPlayingTrackId === item.id;

  return (
    <div 
      className="audio-display-compact"
      onClick={onClick}
      style={{
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, rgba(10, 132, 255, 0.12), rgba(0, 194, 255, 0.08))',
        padding: '24px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer'
      }}
    >
      {/* Animated Equalizer Bars - Always visible */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: '4px',
        height: '50px',
        zIndex: 1
      }}>
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            style={{
              width: '4px',
              height: `${20 + (i % 3) * 20}%`,
              background: 'linear-gradient(to top, #0A84FF, #00C2FF)',
              borderRadius: '2px',
              animation: `equalizerAnimation ${0.6 + i * 0.15}s ease-in-out infinite alternate`,
              transformOrigin: 'bottom'
            }}
          />
        ))}
      </div>

      {/* Track Title - Display file name if available */}
      <div style={{
        fontSize: '14px',
        fontWeight: 600,
        color: '#FFFFFF',
        textAlign: 'center',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
        zIndex: 1,
        lineHeight: '1.4',
        padding: '0 8px',
        wordBreak: 'break-word'
      }}>
        {item.title || 'Audio'}
      </div>

      {/* Now Playing Indicator - subtle badge only when active */}
      {isCurrentlyPlaying && (
      <div style={{
        position: 'absolute',
          bottom: '8px',
          right: '8px',
        display: 'flex',
        alignItems: 'center',
          gap: '4px',
          padding: '4px 8px',
          background: 'rgba(0, 194, 255, 0.2)',
          borderRadius: '12px',
          zIndex: 10
      }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '12px' }}>
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                style={{
                  width: '3px',
                  height: `${6 + (i % 2) * 4}px`,
                  background: '#00C2FF',
                  borderRadius: '1px',
                  animation: `audioWave ${0.5 + i * 0.1}s ease-in-out infinite`
                }}
              />
            ))}
      </div>
          <span style={{ fontSize: '10px', fontWeight: 600, color: '#00C2FF' }}>Playing</span>
        </div>
      )}

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
  );
}

// Audio Display Component - Full Size for Modal/Feed
function AudioDisplay({ item, isActive }: { item: PortfolioItem; isActive?: boolean }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      const prog = (audio.currentTime / audio.duration) * 100;
      setProgress(prog);
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    
    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, []);

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const audioUrl = item.content_url && item.content_url.startsWith('http') 
    ? item.content_url 
    : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${item.content_url}`;

  return (
    <div 
      className="audio-display"
      style={{
        width: '100%',
        height: '100%',
        background: 'rgba(10, 132, 255, 0.08)',
        border: '1px solid rgba(10, 132, 255, 0.2)',
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 180ms cubic-bezier(0.25, 0.8, 0.25, 1)'
      }}
    >
      {/* Animated Equalizer Background */}
      <div 
        style={{
          position: 'absolute',
          left: '16px',
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          gap: '3px',
          height: '40px',
          opacity: isPlaying ? 0.3 : 0.12,
          transition: 'opacity 300ms'
        }}
      >
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="equalizer-bar"
            style={{
              width: '4px',
              height: '20%',
              background: 'linear-gradient(to top, #0A84FF, #00C2FF)',
              borderRadius: '2px',
              animation: isPlaying ? `equalizerAnimation ${0.6 + i * 0.15}s ease-in-out infinite alternate` : 'none',
              transformOrigin: 'bottom'
            }}
          />
        ))}
      </div>

      {/* Play Button */}
      <button
        onClick={togglePlay}
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: '#0A84FF',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
          zIndex: 1,
          transition: 'all 180ms cubic-bezier(0.25, 0.8, 0.25, 1)',
          boxShadow: '0 4px 12px rgba(10, 132, 255, 0.3)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.08)';
          e.currentTarget.style.background = '#0066CC';
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(10, 132, 255, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.background = '#0A84FF';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(10, 132, 255, 0.3)';
        }}
      >
        {isPlaying ? (
          <PauseIcon className="w-7 h-7" style={{ color: '#FFFFFF' }} />
        ) : (
          <PlayIcon className="w-7 h-7" style={{ color: '#FFFFFF', marginLeft: '2px' }} />
        )}
      </button>

      {/* Track Info & Controls */}
      <div style={{ flex: 1, minWidth: 0, zIndex: 1 }}>
        <div 
          style={{
            color: '#FFFFFF',
            fontSize: '17px',
            fontWeight: 600,
            marginBottom: '10px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'
          }}
        >
          {item.title || 'Audio'}
        </div>
        
        {/* Progress Bar */}
        <div 
          style={{
            width: '100%',
            height: '6px',
            background: 'rgba(255, 255, 255, 0.15)',
            borderRadius: '3px',
            overflow: 'hidden',
            marginBottom: '8px',
            cursor: 'pointer'
          }}
          onClick={(e) => {
            if (audioRef.current && duration) {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const percentage = x / rect.width;
              audioRef.current.currentTime = percentage * duration;
            }
          }}
        >
          <div 
            style={{
              width: `${progress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #0A84FF, #00C2FF)',
              transition: 'width 100ms linear',
              borderRadius: '3px'
            }}
          />
        </div>

        {/* Time Display */}
        <div 
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.6)',
            fontWeight: 500,
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'
          }}
        >
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Audio Waveform Icon */}
      <div style={{ 
        flexShrink: 0, 
        zIndex: 1,
        opacity: 0.4
      }}>
        <MusicalNoteIcon className="w-6 h-6" style={{ color: '#0A84FF' }} />
      </div>

      {/* Hidden Audio Element */}
      <audio ref={audioRef} src={audioUrl} loop />

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
  );
}

// Text Display Component - Compact for Grid (Preview)
function TextDisplayCompact({ item, onClick }: { item: PortfolioItem; onClick?: () => void }) {
  // Use text_content if available, otherwise fallback to description
  const displayText = item.text_content || item.description || item.title || 'Text content';
  
  // Create preview - first ~60 characters for compact view
  const previewText = displayText.length > 60 ? displayText.substring(0, 60) + '...' : displayText;
  
  return (
    <div 
      className="text-display-compact"
      onClick={onClick}
      style={{
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, rgba(10, 132, 255, 0.05), rgba(118, 75, 162, 0.05))',
        padding: '20px 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
        minHeight: '100%'
      }}
    >
      {/* Decorative gradient orb - FIXED sizing */}
      <div style={{
        position: 'absolute',
        top: '-40%',
        right: '-30%',
        width: '100px',
        height: '100px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(10, 132, 255, 0.08), transparent)',
        filter: 'blur(25px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      
      {/* Preview Text - FIXED height and clamping */}
      <div 
        style={{
          fontSize: '13px',
          lineHeight: '1.45',
          color: '#FFFFFF',
          fontWeight: 500,
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          wordBreak: 'break-word',
          maxHeight: '60px',
          width: '100%',
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'
        }}
      >
        "{previewText}"
      </div>
      
      {/* Title if exists - FIXED single line */}
      {item.title && item.text_content && (
        <div 
          style={{
            fontSize: '11px',
            color: 'rgba(255, 255, 255, 0.5)',
            textAlign: 'center',
            fontWeight: 500,
            position: 'relative',
            zIndex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            width: '100%',
            maxWidth: '100%',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'
          }}
        >
          — {item.title}
        </div>
      )}
      
      {/* "Read more" indicator removed for memos/text posts */}
    </div>
  );
}

// Text Display Component - Full Size for Modal/Feed
function TextDisplay({ item, onClick }: { item: PortfolioItem; onClick?: () => void }) {
  // Use text_content if available, otherwise fallback to description
  const displayText = item.text_content || item.description || item.title || 'Text content';
  
  return (
    <div 
      className="text-display"
      onClick={onClick}
      style={{
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, rgba(10, 132, 255, 0.05), rgba(118, 75, 162, 0.05))',
        padding: '32px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Decorative gradient orb */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        right: '-20%',
        width: '200px',
        height: '200px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(10, 132, 255, 0.1), transparent)',
        filter: 'blur(40px)',
        pointerEvents: 'none'
      }} />
      
      <div 
        style={{
          fontSize: '19px',
          lineHeight: '1.6',
          color: '#FFFFFF',
          fontWeight: 500,
          textAlign: 'center',
          fontStyle: 'italic',
          marginBottom: item.title ? '16px' : '0',
          position: 'relative',
          zIndex: 1,
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'
        }}
      >
        "{displayText}"
      </div>
      {item.title && item.text_content && (
        <div 
          style={{
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.6)',
            textAlign: 'center',
            marginTop: '12px',
            fontWeight: 500,
            position: 'relative',
            zIndex: 1,
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'
          }}
        >
          — {item.title}
        </div>
      )}
    </div>
  );
}

// PDF Display Component
function PDFDisplay({ item, onClick }: { item: PortfolioItem; onClick?: () => void }) {
  return (
    <div 
      className="pdf-display"
      onClick={onClick}
      style={{
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, rgba(0, 194, 255, 0.08), rgba(0, 194, 255, 0.04))',
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* PDF Icon */}
      <div style={{
        width: '56px',
        height: '56px',
        borderRadius: '12px',
        background: 'rgba(0, 194, 255, 0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <DocumentIcon 
          className="w-8 h-8"
          style={{ color: '#00C2FF' }}
        />
      </div>
      
      {/* PDF Title - File name if available */}
      <div 
        style={{
          fontSize: '14px',
          fontWeight: 600,
          color: '#FFFFFF',
          textAlign: 'center',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          lineHeight: '1.4',
          padding: '0 4px',
          wordBreak: 'break-word',
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'
        }}
      >
        {item.title || 'PDF'}
      </div>

      {/* PDF Badge */}
      <div style={{
        position: 'absolute',
        bottom: '10px',
        right: '10px',
        padding: '3px 8px',
        borderRadius: '6px',
        background: 'rgba(0, 194, 255, 0.2)',
        fontSize: '10px',
        fontWeight: 700,
        color: '#00C2FF',
        letterSpacing: '0.5px'
      }}>
        PDF
      </div>
    </div>
  );
}

// Video Display Component - Auto-play muted preview with mini-player button
function VideoDisplay({ 
  item, 
  onClick,
  onPlayInMiniPlayer,
  currentPlayingTrackId,
  isMiniPlayerMuted,
  onToggleMiniPlayerMute
}: { 
  item: PortfolioItem; 
  onClick?: () => void;
  onPlayInMiniPlayer?: (item: PortfolioItem, showUI?: boolean) => void;
  currentPlayingTrackId?: number;
  isMiniPlayerMuted?: boolean;
  onToggleMiniPlayerMute?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);

  // Check if this item is currently playing in mini-player
  const isCurrentlyPlaying = currentPlayingTrackId === item.id;

  const videoUrl = item.content_url && item.content_url.startsWith('http') 
    ? item.content_url 
    : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${item.content_url}`;

  // Auto-play muted on mount for preview
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      videoRef.current.play().catch(() => {
        // Autoplay was prevented - this is expected on some browsers without user interaction
      });
    }
  }, [isMuted]);

  // Sync with mini-player mute state when playing in mini-player
  useEffect(() => {
    if (isCurrentlyPlaying && videoRef.current && onToggleMiniPlayerMute !== undefined) {
      videoRef.current.muted = isMiniPlayerMuted ?? true;
      setIsMuted(isMiniPlayerMuted ?? true);
    }
  }, [isCurrentlyPlaying, isMiniPlayerMuted, onToggleMiniPlayerMute]);

  const handleMiniPlayerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPlayInMiniPlayer) {
      onPlayInMiniPlayer(item);
    }
  };

  const handleSoundToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    // If playing in mini-player, use mini-player mute control
    if (isCurrentlyPlaying && onToggleMiniPlayerMute) {
      onToggleMiniPlayerMute();
    } else {
      // Otherwise, toggle local video mute
      const newMuted = !isMuted;
      setIsMuted(newMuted);
      if (videoRef.current) {
        videoRef.current.muted = newMuted;
      }
    }
  };

  return (
    <div 
      className="video-display"
      onClick={onClick}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover'
        }}
        loop
        muted={isMuted}
        playsInline
        autoPlay
      />
      {/* Button container removed from portfolio preview - only shown in feed modal */}
    </div>
  );
}

