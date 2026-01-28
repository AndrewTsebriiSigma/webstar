'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, HeartIcon, BookmarkIcon, ShareIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon, BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import { portfolioAPI } from '@/lib/api';
import { PortfolioItem } from '@/lib/types';
import toast from 'react-hot-toast';

interface PortfolioDetailModalProps {
  item: PortfolioItem | null;
  isOpen: boolean;
  onClose: () => void;
  authorUsername: string;
  authorDisplayName: string;
  authorProfilePicture?: string;
  isOwnItem: boolean;
}

export default function PortfolioDetailModal({
  item,
  isOpen,
  onClose,
  authorUsername,
  authorDisplayName,
  authorProfilePicture,
  isOwnItem,
}: PortfolioDetailModalProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  // Animation states
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setIsVisible(true));
      // Lock body scroll
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
    } else {
      setIsVisible(false);
      setIsClosing(false);
    }
    
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      const scrollY = document.body.style.top;
      window.scrollTo(0, parseInt(scrollY || '0') * -1);
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setIsVisible(false);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  };

  if ((!isOpen && !isClosing) || !item) return null;

  const handleShare = () => {
    const url = `${window.location.origin}/${authorUsername}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const getContentUrl = (url: string) => {
    if (url.startsWith('http')) return url;
    return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${url}`;
  };

  return (
    <>
      {/* Backdrop with animation */}
      <div 
        className={`bottom-slider-backdrop ${isVisible ? 'entering' : 'exiting'}`}
        onClick={handleClose}
      />
      
      {/* Bottom Slider Content with animation */}
      <div 
        className={`bottom-slider-content ${isVisible ? 'entering' : 'exiting'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - 55px consistent */}
        <div 
          style={{
            height: '55px',
            minHeight: '55px',
            background: 'rgba(20, 20, 20, 0.8)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            flexShrink: 0
          }}
        >
          <span style={{ fontSize: '17px', fontWeight: 600, color: '#FFFFFF' }}>
            {item.title || 'Post'}
          </span>
          <button
            onClick={handleClose}
            className="flex items-center justify-center hover:opacity-70 transition-opacity"
            style={{ width: '28px', height: '28px' }}
          >
            <XMarkIcon style={{ width: '20px', height: '20px', color: 'rgba(255, 255, 255, 0.6)' }} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          {/* Media Content */}
          <div className="flex items-center justify-center p-4" style={{ background: '#111111' }}>
          {item.content_type === 'photo' && item.content_url && (
            <img
              src={getContentUrl(item.content_url)}
              alt={item.title || 'Portfolio item'}
              className="max-w-full max-h-[80vh] object-contain rounded-2xl"
              onError={(e) => {
                console.error('Failed to load image:', item.content_url);
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          )}
          {item.content_type === 'video' && item.content_url && (
            <video
              src={getContentUrl(item.content_url)}
              controls
              className="max-w-full max-h-[80vh] object-contain rounded-2xl"
            >
              Your browser does not support the video tag.
            </video>
          )}
          {item.content_type === 'audio' && item.content_url && (
            <div className="w-full flex flex-col items-center justify-center gap-6">
              <svg className="w-24 h-24 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
              <audio
                src={getContentUrl(item.content_url)}
                controls
                loop
                className="w-full max-w-md"
              >
                Your browser does not support the audio tag.
              </audio>
            </div>
          )}
          {item.content_type === 'link' && (
            <div className="w-full flex flex-col items-center justify-center gap-6 p-8">
              <div className="w-32 h-32 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full flex items-center justify-center">
                <svg className="w-16 h-16 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              {item.content_url && (
                <a
                  href={item.content_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-semibold transition"
                >
                  Open Link
                </a>
              )}
            </div>
          )}
          </div>

          {/* Author Info */}
          <div className="p-4 flex items-center gap-3 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}>
            {authorProfilePicture ? (
              <img
                src={authorProfilePicture}
                alt={authorDisplayName}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold">
                {authorDisplayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <a
                href={`/${authorUsername}`}
                style={{ fontSize: '14px', fontWeight: 600, color: '#FFFFFF' }}
              >
                {authorDisplayName}
              </a>
              <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>@{authorUsername}</p>
            </div>
          </div>

          {/* Description */}
          {item.description && (
            <div className="p-4" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.8)', lineHeight: '1.5' }}>{item.description}</p>
              {item.created_at && (
                <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.4)', marginTop: '12px' }}>
                  {formatDate(item.created_at)}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Actions Footer */}
        <div 
          className="flex-shrink-0 flex items-center justify-around"
          style={{ 
            padding: '16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            paddingBottom: 'max(16px, env(safe-area-inset-bottom))'
          }}
        >
          <button
            onClick={() => setIsLiked(!isLiked)}
            className="flex flex-col items-center gap-1 transition"
            style={{ color: isLiked ? '#FF453A' : 'rgba(255, 255, 255, 0.5)' }}
          >
            {isLiked ? (
              <HeartSolidIcon className="w-6 h-6" />
            ) : (
              <HeartIcon className="w-6 h-6" />
            )}
            <span style={{ fontSize: '11px', fontWeight: 500 }}>Like</span>
          </button>
          
          <button
            onClick={() => setIsSaved(!isSaved)}
            className="flex flex-col items-center gap-1 transition"
            style={{ color: isSaved ? '#00C2FF' : 'rgba(255, 255, 255, 0.5)' }}
          >
            {isSaved ? (
              <BookmarkSolidIcon className="w-6 h-6" />
            ) : (
              <BookmarkIcon className="w-6 h-6" />
            )}
            <span style={{ fontSize: '11px', fontWeight: 500 }}>Save</span>
          </button>

          <button
            onClick={handleShare}
            className="flex flex-col items-center gap-1 transition"
            style={{ color: 'rgba(255, 255, 255, 0.5)' }}
          >
            <ShareIcon className="w-6 h-6" />
            <span style={{ fontSize: '11px', fontWeight: 500 }}>Share</span>
          </button>
        </div>
      </div>
    </>
  );
}

