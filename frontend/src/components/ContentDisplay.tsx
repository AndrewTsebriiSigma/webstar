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
  onPlayInMiniPlayer?: (item: PortfolioItem) => void; // Callback to spawn mini-player
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
        background: 'rgba(255, 255, 255, 0.03)',
        transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)'
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 12px 48px rgba(0, 0, 0, 0.3)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }
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

// Audio Display Component - Compact for Grid
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
  onPlayInMiniPlayer?: (item: PortfolioItem) => void;
  currentPlayingTrackId?: number;
  isMiniPlayerMuted?: boolean;
  onToggleMiniPlayerMute?: () => void;
}) {
  // Check if this item is currently playing in mini-player
  const isCurrentlyPlaying = currentPlayingTrackId === item.id;

  const handleMiniPlayerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPlayInMiniPlayer) {
      onPlayInMiniPlayer(item);
    }
  };

  const handleSoundToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Only toggle mute if this track is currently playing in mini-player
    if (isCurrentlyPlaying && onToggleMiniPlayerMute) {
      onToggleMiniPlayerMute();
    }
  };

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
        cursor: 'pointer',
        transition: 'all 180ms cubic-bezier(0.25, 0.8, 0.25, 1)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 12px 32px rgba(10, 132, 255, 0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Background Equalizer Pattern */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        opacity: 0.08,
        pointerEvents: 'none'
      }}>
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            style={{
              width: '3px',
              height: `${30 + (i % 3) * 20}%`,
              background: 'linear-gradient(to top, #0A84FF, #00C2FF)',
              borderRadius: '2px'
            }}
          />
        ))}
      </div>

      {/* Play Icon - Clickable to start mini-player */}
      <div 
        onClick={(e) => {
          e.stopPropagation();
          if (onPlayInMiniPlayer) {
            onPlayInMiniPlayer(item);
          }
        }}
        style={{
        width: '64px',
        height: '64px',
        borderRadius: '50%',
          background: isCurrentlyPlaying ? '#00C2FF' : '#0A84FF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
          boxShadow: isCurrentlyPlaying ? '0 8px 24px rgba(0, 194, 255, 0.4)' : '0 8px 24px rgba(10, 132, 255, 0.3)',
          zIndex: 1,
          cursor: 'pointer',
          transition: 'all 150ms'
        }}
      >
        {isCurrentlyPlaying ? (
          <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
        <PlayIcon className="w-8 h-8" style={{ color: '#FFFFFF', marginLeft: '3px' }} />
        )}
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
      <audio ref={audioRef} src={audioUrl} />

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
        transition: 'all 180ms cubic-bezier(0.25, 0.8, 0.25, 1)',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 18px 40px rgba(10, 132, 255, 0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
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
      
      {/* "Read more" indicator - FIXED positioning */}
      {displayText.length > 60 && (
        <div style={{
          fontSize: '10px',
          color: 'rgba(10, 132, 255, 0.8)',
          textAlign: 'center',
          fontWeight: 600,
          position: 'relative',
          zIndex: 1,
          marginTop: 'auto',
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'
        }}>
          Read more →
        </div>
      )}
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
        transition: 'all 180ms cubic-bezier(0.25, 0.8, 0.25, 1)',
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 18px 40px rgba(10, 132, 255, 0.15)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }
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
        transition: 'all 180ms cubic-bezier(0.25, 0.8, 0.25, 1)',
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 194, 255, 0.2)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }
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
  onPlayInMiniPlayer?: (item: PortfolioItem) => void;
  currentPlayingTrackId?: number;
  isMiniPlayerMuted?: boolean;
  onToggleMiniPlayerMute?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Check if this item is currently playing in mini-player
  const isCurrentlyPlaying = currentPlayingTrackId === item.id;

  const videoUrl = item.content_url && item.content_url.startsWith('http') 
    ? item.content_url 
    : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${item.content_url}`;

  // Auto-play muted on mount for preview (video always stays muted)
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay was prevented - this is expected on some browsers without user interaction
      });
    }
  }, []);

  const handleMiniPlayerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPlayInMiniPlayer) {
      onPlayInMiniPlayer(item);
    }
  };

  const handleSoundToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Only toggle mute if this track is currently playing in mini-player
    if (isCurrentlyPlaying && onToggleMiniPlayerMute) {
      onToggleMiniPlayerMute();
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
        muted // Video always muted - audio via mini-player only
        playsInline
        autoPlay
      />
      {/* Button container for sound and mini-player */}
      <div style={{
          position: 'absolute',
          bottom: '8px',
          right: '8px',
        display: 'flex',
        gap: '6px',
        zIndex: 10
      }}>
        {/* Sound Toggle Button - only visible when this track is playing in mini-player */}
        {isCurrentlyPlaying && (
          <button
            onClick={handleSoundToggle}
            style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
              background: isMiniPlayerMuted ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 194, 255, 0.3)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
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
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
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
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: isCurrentlyPlaying ? 'rgba(0, 194, 255, 0.3)' : 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
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
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
              <rect x="4" y="8" width="2" height="8" rx="1" fill="white" />
              <rect x="9" y="5" width="2" height="14" rx="1" fill="white" />
              <rect x="14" y="7" width="2" height="10" rx="1" fill="white" />
              <rect x="19" y="9" width="2" height="6" rx="1" fill="white" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

