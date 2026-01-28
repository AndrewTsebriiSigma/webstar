'use client';

import { useState, useEffect } from 'react';
import { portfolioAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface TextPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TextPostModal({ isOpen, onClose, onSuccess }: TextPostModalProps) {
  const [textContent, setTextContent] = useState('');
  const [title, setTitle] = useState('');
  const [posting, setPosting] = useState(false);
  
  // Animation states
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
      setIsClosing(false);
    }
  }, [isOpen]);

  const handleReset = () => {
    setTextContent('');
    setTitle('');
    setPosting(false);
  };

  const handleClose = () => {
    if (!posting) {
      setIsClosing(true);
      setIsVisible(false);
      setTimeout(() => {
        handleReset();
        setIsClosing(false);
        onClose();
      }, 300);
    }
  };

  if (!isOpen && !isClosing) return null;

  const handleSubmit = async () => {
    if (!textContent.trim()) {
      toast.error('Please enter some text');
      return;
    }

    if (textContent.length > 500) {
      toast.error('Text must be 500 characters or less');
      return;
    }

    setPosting(true);

    try {
      // Create text post
      await portfolioAPI.createItem({
        content_type: 'text',
        text_content: textContent.trim(),
        title: title.trim() || null,
        aspect_ratio: '4:3',
      });

      toast.success('Text post published! 📝');
      handleReset();
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Post error:', error);
      toast.error(error.response?.data?.detail || 'Failed to create post');
    } finally {
      setPosting(false);
    }
  };

  const charCount = textContent.length;
  const charLimit = 500;
  const isOverLimit = charCount > charLimit;

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
          className="flex items-center justify-between flex-shrink-0"
          style={{ 
            height: '55px',
            padding: '0 16px',
            background: 'rgba(20, 20, 20, 0.8)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <span style={{ fontSize: '17px', fontWeight: 600, color: '#FFFFFF' }}>Create Text Post</span>
          <button
            onClick={handleClose}
            disabled={posting}
            className="flex items-center justify-center hover:opacity-70 transition-opacity"
            style={{ width: '28px', height: '28px' }}
          >
            <XMarkIcon style={{ width: '20px', height: '20px', color: 'rgba(255, 255, 255, 0.6)' }} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Title Input (Optional) */}
          <div>
            <label 
              className="block text-xs font-medium mb-2 tracking-wide"
              style={{ color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase' }}
            >
              Title (Optional)
            </label>
            <input
              type="text"
              placeholder="Give your post a title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all text-sm"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                borderColor: 'rgba(255, 255, 255, 0.12)',
                color: '#FFFFFF',
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#0A84FF';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(10, 132, 255, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              disabled={posting}
              maxLength={100}
            />
          </div>

          {/* Text Content */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label 
                className="block text-xs font-medium tracking-wide"
                style={{ color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase' }}
              >
                Your Text
              </label>
              <span 
                className="text-xs font-medium"
                style={{ 
                  color: isOverLimit ? '#FF453A' : 'rgba(255, 255, 255, 0.4)'
                }}
              >
                {charCount}/{charLimit}
              </span>
            </div>
            <textarea
              placeholder="What's on your mind? Share your thoughts..."
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              rows={8}
              className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all resize-none"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                borderColor: isOverLimit ? '#FF453A' : 'rgba(255, 255, 255, 0.12)',
                color: '#FFFFFF',
                fontSize: '15px',
                lineHeight: '1.6',
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'
              }}
              onFocus={(e) => {
                if (!isOverLimit) {
                  e.currentTarget.style.borderColor = '#0A84FF';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(10, 132, 255, 0.1)';
                }
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = isOverLimit ? '#FF453A' : 'rgba(255, 255, 255, 0.12)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              disabled={posting}
            />
            {isOverLimit && (
              <p className="text-xs mt-2" style={{ color: '#FF453A' }}>
                Text is too long. Please keep it under 500 characters.
              </p>
            )}
          </div>

          {/* Preview */}
          {textContent.trim() && !isOverLimit && (
            <div>
              <label 
                className="block text-xs font-medium mb-2 tracking-wide"
                style={{ color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase' }}
              >
                Preview
              </label>
              <div 
                className="p-6 rounded-2xl border"
                style={{
                  background: 'linear-gradient(135deg, rgba(10, 132, 255, 0.05), rgba(118, 75, 162, 0.05))',
                  borderColor: 'rgba(255, 255, 255, 0.08)',
                  minHeight: '150px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}
              >
                <p 
                  className="text-center italic"
                  style={{
                    fontSize: '18px',
                    lineHeight: '1.5',
                    color: '#FFFFFF',
                    fontWeight: 500
                  }}
                >
                  "{textContent}"
                </p>
                {title.trim() && (
                  <p 
                    className="text-center mt-3"
                    style={{
                      fontSize: '13px',
                      color: 'rgba(255, 255, 255, 0.6)'
                    }}
                  >
                    — {title}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div 
          className="flex-shrink-0 p-4 border-t flex items-center justify-between"
          style={{ 
            borderColor: 'rgba(255, 255, 255, 0.08)',
            paddingBottom: 'max(16px, env(safe-area-inset-bottom))'
          }}
        >
          <button
            onClick={handleClose}
            disabled={posting}
            className="px-5 py-2.5 rounded-xl font-medium transition-all text-sm"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              color: 'rgba(255, 255, 255, 0.8)'
            }}
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={posting || !textContent.trim() || isOverLimit}
            className="px-6 py-2.5 rounded-xl font-semibold transition-all text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: posting || !textContent.trim() || isOverLimit 
                ? 'rgba(0, 194, 255, 0.4)' 
                : '#00C2FF',
              color: '#FFFFFF'
            }}
          >
            {posting ? 'Publishing...' : 'Publish Post'}
          </button>
        </div>
      </div>
    </>
  );
}

