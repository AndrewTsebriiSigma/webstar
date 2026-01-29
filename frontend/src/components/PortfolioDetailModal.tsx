'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, HeartIcon, BookmarkIcon, ShareIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon, BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import { portfolioAPI } from '@/lib/api';
import { PortfolioItem } from '@/lib/types';
import toast from 'react-hot-toast';

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
  
  // Attachment preview modals
  const [showPhotoAttachmentModal, setShowPhotoAttachmentModal] = useState(false);
  const [showPdfAttachmentModal, setShowPdfAttachmentModal] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop');
  
  // Detect platform on mount
  useEffect(() => {
    setPlatform(detectPlatform());
  }, []);

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

          {/* Attachments */}
          {item.attachment_url && item.attachment_type && (
            <div className="p-4" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              {item.attachment_type === 'photo' && (
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
                        src={getContentUrl(item.attachment_url)}
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
                  {showPhotoAttachmentModal && item.attachment_url && (
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
                          <XMarkIcon style={{ width: '20px', height: '20px', color: '#FFFFFF' }} />
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
                          src={getContentUrl(item.attachment_url)}
                          alt="Photo attachment preview"
                          style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'contain',
                            borderRadius: '12px'
                          }}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
              
              {item.attachment_type === 'pdf' && (
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
                          setShowPdfAttachmentModal(true);
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
                  {showPdfAttachmentModal && item.attachment_url && (
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        // Clicking backdrop closes PDF attachment modal only, not parent modal
                        setShowPdfAttachmentModal(false);
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
                            setShowPdfAttachmentModal(false);
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
                          <XMarkIcon style={{ width: '20px', height: '20px', color: '#FFFFFF' }} />
                        </button>
                      </div>

                      {/* PDF Viewer */}
                      <div 
                        onClick={(e) => e.stopPropagation()}
                        style={{ flex: 1, overflow: 'hidden', padding: '20px' }}
                      >
                        <iframe
                          src={getContentUrl(item.attachment_url)}
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

