'use client';

import { useState } from 'react';
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

  if (!isOpen) return null;

  const handleReset = () => {
    setTextContent('');
    setTitle('');
    setPosting(false);
  };

  const handleClose = () => {
    if (!posting) {
      handleReset();
      onClose();
    }
  };

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
    <div
      className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      style={{ background: 'rgba(11, 11, 12, 0.9)' }}
    >
      <div 
        className="rounded-3xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto border"
        style={{
          background: 'rgba(22, 22, 24, 0.95)',
          borderColor: 'rgba(255, 255, 255, 0.12)',
          backdropFilter: 'blur(20px)'
        }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-6 border-b"
          style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}
        >
          <h2 
            className="text-xl font-semibold"
            style={{ 
              color: '#FFFFFF',
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'
            }}
          >
            Create Text Post
          </h2>
          <button
            onClick={handleClose}
            disabled={posting}
            className="p-2 rounded-full transition-all"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              color: 'rgba(255, 255, 255, 0.6)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
            }}
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
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
          className="p-6 border-t flex items-center justify-between"
          style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}
        >
          <button
            onClick={handleClose}
            disabled={posting}
            className="px-5 py-2.5 rounded-xl font-medium transition-all text-sm"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              color: 'rgba(255, 255, 255, 0.8)',
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
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
                ? 'rgba(10, 132, 255, 0.4)' 
                : '#0A84FF',
              color: '#FFFFFF',
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'
            }}
            onMouseEnter={(e) => {
              if (!posting && textContent.trim() && !isOverLimit) {
                e.currentTarget.style.background = '#0066CC';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(10, 132, 255, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (!posting && textContent.trim() && !isOverLimit) {
                e.currentTarget.style.background = '#0A84FF';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
          >
            {posting ? 'Publishing...' : 'Publish Post'}
          </button>
        </div>
      </div>
    </div>
  );
}

