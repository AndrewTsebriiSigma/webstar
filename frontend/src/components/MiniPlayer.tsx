'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  PlayIcon, 
  PauseIcon, 
  XMarkIcon,
  ForwardIcon,
  BackwardIcon 
} from '@heroicons/react/24/solid';

interface AudioTrack {
  id: number;
  title: string;
  url: string;
  thumbnail?: string;
}

interface MiniPlayerProps {
  track: AudioTrack | null;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onThumbnailClick?: () => void;
}

export default function MiniPlayer({ 
  track, 
  onClose,
  onNext,
  onPrevious,
  onThumbnailClick
}: MiniPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (track && audioRef.current) {
      audioRef.current.src = track.url;
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [track]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      const prog = (audio.currentTime / audio.duration) * 100;
      setProgress(prog);
      setCurrentTime(audio.currentTime);
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      if (onNext) {
        onNext();
      }
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
    });

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadedmetadata', () => {});
    };
  }, [onNext]);

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

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    
    const bounds = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - bounds.left;
    const percentage = x / bounds.width;
    const newTime = percentage * duration;
    
    audioRef.current.currentTime = newTime;
    setProgress(percentage * 100);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!track) return null;

  return (
    <>
      {/* Desktop Player */}
      <div 
        className="mini-player-desktop"
        style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9998,
          width: '90%',
          maxWidth: '480px',
          background: 'rgba(17, 17, 17, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '20px',
          boxShadow: '0 12px 48px rgba(0, 0, 0, 0.5)',
          padding: '16px',
          display: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Album Art / Thumbnail */}
          <div 
            onClick={onThumbnailClick}
            style={{
              width: '56px',
              height: '56px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(0, 194, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              overflow: 'hidden',
              cursor: onThumbnailClick ? 'pointer' : 'default',
              transition: 'transform 150ms cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            onMouseEnter={(e) => onThumbnailClick && (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseLeave={(e) => onThumbnailClick && (e.currentTarget.style.transform = 'scale(1)')}
          >
            {track.thumbnail ? (
              <img 
                src={track.thumbnail} 
                alt={track.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            ) : (
              <svg 
                className="w-6 h-6" 
                fill="#00C2FF" 
                viewBox="0 0 24 24"
              >
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
            )}
          </div>

          {/* Track Info & Controls */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div 
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#FFFFFF',
                marginBottom: '8px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {track.title}
            </div>

            {/* Progress Bar */}
            <div 
              onClick={handleProgressClick}
              style={{
                width: '100%',
                height: '4px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '2px',
                cursor: 'pointer',
                position: 'relative',
                marginBottom: '8px'
              }}
            >
              <div 
                style={{
                  width: `${progress}%`,
                  height: '100%',
                  background: '#00C2FF',
                  borderRadius: '2px',
                  transition: 'width 100ms linear'
                }}
              />
            </div>

            {/* Time & Controls */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span 
                style={{
                  fontSize: '11px',
                  color: 'rgba(255, 255, 255, 0.5)'
                }}
              >
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>

              <div style={{ display: 'flex', gap: '8px' }}>
                {onPrevious && (
                  <button
                    onClick={onPrevious}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: 'transparent',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: '#FFFFFF'
                    }}
                  >
                    <BackwardIcon className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={togglePlay}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#00C2FF',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 150ms'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#33D1FF';
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#00C2FF';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  {isPlaying ? (
                    <PauseIcon className="w-4 h-4 text-black" />
                  ) : (
                    <PlayIcon className="w-4 h-4 text-black ml-0.5" />
                  )}
                </button>

                {onNext && (
                  <button
                    onClick={onNext}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: 'transparent',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: '#FFFFFF'
                    }}
                  >
                    <ForwardIcon className="w-4 h-4" />
                  </button>
                )}
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
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            <XMarkIcon className="w-5 h-5 text-white" />
          </button>
        </div>

        <audio ref={audioRef} />
      </div>

      {/* Mobile Player */}
      <div 
        className="mini-player-mobile"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 9998,
          background: 'rgba(17, 17, 17, 0.98)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.12)',
          padding: '12px 16px',
          display: 'block'
        }}
      >
        {/* Progress Bar */}
        <div 
          onClick={handleProgressClick}
          style={{
            width: '100%',
            height: '3px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '2px',
            cursor: 'pointer',
            marginBottom: '12px'
          }}
        >
          <div 
            style={{
              width: `${progress}%`,
              height: '100%',
              background: '#00C2FF',
              borderRadius: '2px',
              transition: 'width 100ms linear'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Thumbnail */}
          <div 
            onClick={onThumbnailClick}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(0, 194, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              overflow: 'hidden',
              cursor: onThumbnailClick ? 'pointer' : 'default',
              transition: 'transform 150ms cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            onMouseEnter={(e) => onThumbnailClick && (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseLeave={(e) => onThumbnailClick && (e.currentTarget.style.transform = 'scale(1)')}
          >
            {track.thumbnail ? (
              <img 
                src={track.thumbnail} 
                alt={track.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            ) : (
              <svg 
                className="w-5 h-5" 
                fill="#00C2FF" 
                viewBox="0 0 24 24"
              >
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
            )}
          </div>

          {/* Track Title */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div 
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#FFFFFF',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                marginBottom: '2px'
              }}
            >
              {track.title}
            </div>
            <div 
              style={{
                fontSize: '11px',
                color: 'rgba(255, 255, 255, 0.5)'
              }}
            >
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: '#00C2FF',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            {isPlaying ? (
              <PauseIcon className="w-5 h-5 text-black" />
            ) : (
              <PlayIcon className="w-5 h-5 text-black ml-0.5" />
            )}
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'transparent',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            <XMarkIcon className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      <style jsx>{`
        @media (min-width: 768px) {
          .mini-player-desktop {
            display: flex !important;
          }
          .mini-player-mobile {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}

