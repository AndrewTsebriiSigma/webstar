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
}

export default function ContentDisplay({ 
  item, 
  isActive = false, 
  showAttachments = true,
  onClick 
}: ContentDisplayProps) {
  const getAspectRatio = (type: string) => {
    switch (type) {
      case 'audio': return '8 / 1';
      case 'photo': return '4 / 5';
      case 'video': return '4 / 5';
      case 'text': return '4 / 3';
      case 'pdf': return '3 / 4';
      default: return '4 / 5';
    }
  };

  const renderContent = () => {
    switch (item.content_type) {
      case 'photo':
        return <PhotoDisplay item={item} onClick={onClick} />;
      case 'audio':
        return <AudioDisplay item={item} isActive={isActive} />;
      case 'text':
        return <TextDisplay item={item} onClick={onClick} />;
      case 'pdf':
        return <PDFDisplay item={item} onClick={onClick} />;
      case 'video':
        return <VideoDisplay item={item} onClick={onClick} />;
      default:
        return <PhotoDisplay item={item} onClick={onClick} />;
    }
  };

  return (
    <div 
      className="content-display-wrapper"
      style={{ 
        aspectRatio: getAspectRatio(item.content_type),
        gridColumn: item.content_type === 'audio' ? 'span 3' : 'span 1'
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
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
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
          e.currentTarget.src = '/api/placeholder/400/500';
        }}
      />
    </div>
  );
}

// Audio Display Component
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
        borderRadius: '20px',
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
          {item.title || 'Audio Track'}
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

// Text Display Component
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
        borderRadius: '20px',
        background: 'linear-gradient(135deg, rgba(10, 132, 255, 0.05), rgba(118, 75, 162, 0.05))',
        border: '1px solid rgba(255, 255, 255, 0.08)',
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
          e.currentTarget.style.borderColor = 'rgba(10, 132, 255, 0.3)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
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
        borderRadius: 'var(--radius-lg)',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: onClick ? 'pointer' : 'default',
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
      <DocumentIcon 
        className="w-16 h-16 mb-4"
        style={{ color: '#00C2FF' }}
      />
      <div 
        style={{
          fontSize: '16px',
          fontWeight: 600,
          color: '#FFFFFF',
          textAlign: 'center',
          marginBottom: '8px'
        }}
      >
        {item.title || 'Document'}
      </div>
    </div>
  );
}

// Video Display Component
function VideoDisplay({ item, onClick }: { item: PortfolioItem; onClick?: () => void }) {
  const [isHovering, setIsHovering] = useState(false);

  const videoUrl = item.content_url && item.content_url.startsWith('http') 
    ? item.content_url 
    : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${item.content_url}`;

  return (
    <div 
      className="video-display"
      onClick={onClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      <video
        src={videoUrl}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover'
        }}
        loop
        muted
        playsInline
        autoPlay={isHovering}
      />
    </div>
  );
}

