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
  const imageUrl = item.content_url.startsWith('http') 
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
      {item.title && (
        <div 
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '16px',
            background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
            color: '#FFFFFF',
            fontSize: '14px',
            fontWeight: 600
          }}
        >
          {item.title}
        </div>
      )}
    </div>
  );
}

// Audio Display Component
function AudioDisplay({ item, isActive }: { item: PortfolioItem; isActive?: boolean }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
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
    };

    audio.addEventListener('timeupdate', updateProgress);
    return () => audio.removeEventListener('timeupdate', updateProgress);
  }, []);

  const audioUrl = item.content_url.startsWith('http') 
    ? item.content_url 
    : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${item.content_url}`;

  return (
    <div 
      className="audio-display"
      style={{
        width: '100%',
        height: '100%',
        borderRadius: 'var(--radius-lg)',
        background: 'rgba(0, 194, 255, 0.08)',
        border: '1px solid rgba(0, 194, 255, 0.2)',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Animated Equalizer Bars */}
      <div 
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '100px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
          opacity: isPlaying ? 0.3 : 0.1
        }}
      >
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            style={{
              width: '4px',
              height: isPlaying ? `${20 + Math.random() * 40}%` : '20%',
              background: '#00C2FF',
              borderRadius: '2px',
              animation: isPlaying ? `equalizer ${0.5 + i * 0.1}s ease-in-out infinite alternate` : 'none'
            }}
          />
        ))}
      </div>

      {/* Play Button */}
      <button
        onClick={togglePlay}
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
          zIndex: 1,
          transition: 'all 150ms'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.background = '#33D1FF';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.background = '#00C2FF';
        }}
      >
        {isPlaying ? (
          <PauseIcon className="w-6 h-6 text-black" />
        ) : (
          <PlayIcon className="w-6 h-6 text-black ml-1" />
        )}
      </button>

      {/* Track Info */}
      <div style={{ flex: 1, minWidth: 0, zIndex: 1 }}>
        <div 
          style={{
            color: '#FFFFFF',
            fontSize: '16px',
            fontWeight: 600,
            marginBottom: '8px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {item.title || 'Audio Track'}
        </div>
        
        {/* Progress Bar */}
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
              width: `${progress}%`,
              height: '100%',
              background: '#00C2FF',
              transition: 'width 100ms linear'
            }}
          />
        </div>
      </div>

      {/* Hidden Audio Element */}
      <audio ref={audioRef} src={audioUrl} />

      <style jsx>{`
        @keyframes equalizer {
          from { height: 20%; }
          to { height: 80%; }
        }
      `}</style>
    </div>
  );
}

// Text Display Component
function TextDisplay({ item, onClick }: { item: PortfolioItem; onClick?: () => void }) {
  return (
    <div 
      className="text-display"
      onClick={onClick}
      style={{
        width: '100%',
        height: '100%',
        borderRadius: 'var(--radius-lg)',
        background: 'linear-gradient(135deg, rgba(0, 194, 255, 0.05), rgba(118, 75, 162, 0.05))',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)'
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 12px 48px rgba(0, 194, 255, 0.2)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
    >
      <div 
        style={{
          fontSize: '20px',
          lineHeight: '1.5',
          color: '#FFFFFF',
          fontWeight: 500,
          textAlign: 'center',
          fontStyle: 'italic',
          marginBottom: '12px'
        }}
      >
        "{item.description || item.title || 'Text content'}"
      </div>
      {item.title && item.description !== item.title && (
        <div 
          style={{
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.6)',
            textAlign: 'center',
            marginTop: '8px'
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
      {item.description && (
        <div 
          style={{
            fontSize: '13px',
            color: 'rgba(255, 255, 255, 0.6)',
            textAlign: 'center'
          }}
        >
          {item.description}
        </div>
      )}
    </div>
  );
}

// Video Display Component
function VideoDisplay({ item, onClick }: { item: PortfolioItem; onClick?: () => void }) {
  const [isHovering, setIsHovering] = useState(false);

  const videoUrl = item.content_url.startsWith('http') 
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
      {item.title && (
        <div 
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '16px',
            background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
            color: '#FFFFFF',
            fontSize: '14px',
            fontWeight: 600
          }}
        >
          {item.title}
        </div>
      )}
    </div>
  );
}

