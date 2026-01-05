'use client';

import { useState } from 'react';

interface CreateContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPost: (type?: 'media' | 'audio' | 'pdf' | 'text') => void;
  onSelectProject: () => void;
  navHeightReduction?: number;
}

export default function CreateContentModal({
  isOpen,
  onClose,
  onSelectPost,
  onSelectProject,
  navHeightReduction = 0,
}: CreateContentModalProps) {
  const [postExpanded, setPostExpanded] = useState(false);

  if (!isOpen) return null;

  const navHeight = 54 - (10 * navHeightReduction);
  const dropdownTop = navHeight + 6;

  const postTypes = [
    { 
      type: 'media' as const, 
      label: 'Media',
      color: '#00C2FF',
      gradient: 'linear-gradient(135deg, rgba(0, 80, 120, 0.8) 0%, rgba(0, 50, 80, 0.9) 100%)',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
      )
    },
    { 
      type: 'audio' as const, 
      label: 'Audio',
      color: '#A78BFA',
      gradient: 'linear-gradient(135deg, rgba(80, 50, 140, 0.8) 0%, rgba(50, 30, 90, 0.9) 100%)',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V4.5l-10.5 3v9.75M6 19.5a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" />
        </svg>
      )
    },
    { 
      type: 'pdf' as const, 
      label: 'PDF',
      color: '#22C55E',
      gradient: 'linear-gradient(135deg, rgba(20, 90, 50, 0.8) 0%, rgba(10, 60, 35, 0.9) 100%)',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      )
    },
    { 
      type: 'text' as const, 
      label: 'Memo',
      color: '#FB923C',
      gradient: 'linear-gradient(135deg, rgba(120, 60, 20, 0.8) 0%, rgba(80, 40, 15, 0.9) 100%)',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
        </svg>
      )
    },
  ];

  const handleClose = () => {
    setPostExpanded(false);
    onClose();
  };

  const handlePostClick = () => {
    setPostExpanded(true);
  };

  const handleTypeSelect = (type: 'media' | 'audio' | 'pdf' | 'text') => {
    onSelectPost(type);
    setPostExpanded(false);
    onClose();
  };

  const handleCollapse = () => {
    setPostExpanded(false);
  };

  return (
    <div 
      className="fixed inset-0 z-50"
      style={{ background: 'rgba(0, 0, 0, 0.3)' }}
      onClick={handleClose}
    >
      <div 
        className="absolute left-3 right-3"
        style={{
          top: `${dropdownTop}px`,
          background: 'rgba(18, 18, 18, 0.95)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Post Section */}
        <button
          onClick={postExpanded ? handleCollapse : handlePostClick}
          className="w-full transition-all duration-200 ease-out"
          style={{ 
            padding: postExpanded ? '3px 12px' : '12px',
            background: 'transparent'
          }}
        >
          {postExpanded ? (
            // Shrunk header - same size/color as original Post title
            <div className="flex items-center justify-center">
              <span className="text-[15px] font-semibold text-white">Post</span>
            </div>
          ) : (
            // Original Post option - UNCHANGED
            <div className="flex items-center gap-3">
              <div 
                className="flex items-center justify-center flex-shrink-0"
                style={{
                  width: '44px',
                  height: '44px',
                  background: 'linear-gradient(135deg, rgba(0, 194, 255, 0.2) 0%, rgba(0, 122, 255, 0.2) 100%)',
                  borderRadius: '10px'
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="#00C2FF" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 8.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v8.25A2.25 2.25 0 006 16.5h2.25m8.25-8.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-7.5A2.25 2.25 0 018.25 18v-1.5m8.25-8.25h-6a2.25 2.25 0 00-2.25 2.25v6" />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-[15px] font-semibold text-white">Post</h3>
                <p className="text-[13px]" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Share progress in your portfolio</p>
              </div>
            </div>
          )}
        </button>

        {/* Divider - Always visible */}
        <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.06)', margin: '0 12px' }} />

        {/* 4 Post Type Buttons - Slide up when expanded */}
        <div 
          className="transition-all duration-200 ease-out overflow-hidden"
          style={{
            maxHeight: postExpanded ? '100px' : '0',
            opacity: postExpanded ? 1 : 0,
            padding: postExpanded ? '8px 12px' : '0 12px'
          }}
        >
          <div className="grid grid-cols-4 gap-1">
            {postTypes.map((item) => (
              <button
                key={item.type}
                onClick={() => handleTypeSelect(item.type)}
                className="flex flex-col items-center gap-1.5 p-1.5 rounded-[10px] transition-all duration-150"
                style={{ background: 'transparent' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div 
                  className="w-12 h-12 rounded-[10px] flex items-center justify-center"
                  style={{ background: item.gradient }}
                >
                  <span style={{ color: item.color }}>{item.icon}</span>
                </div>
                <span className="text-[12px] font-medium text-white">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Project Option - Fades out when expanded */}
        <div
          className="transition-all duration-200 ease-out overflow-hidden"
          style={{
            maxHeight: postExpanded ? '0' : '80px',
            opacity: postExpanded ? 0 : 1
          }}
        >
          <button
            onClick={() => {
              onSelectProject();
              handleClose();
            }}
            className="w-full flex items-center gap-3 p-3 transition-colors"
            style={{ background: 'transparent' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <div 
              className="flex items-center justify-center flex-shrink-0"
              style={{
                width: '44px',
                height: '44px',
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%)',
                borderRadius: '10px'
              }}
            >
              <svg className="w-5 h-5" fill="none" stroke="#A78BFA" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10.5v6m3-3H9m4.06-7.19l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
              </svg>
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-[15px] font-semibold text-white">Project</h3>
              <p className="text-[13px]" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Curated collection of your work</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
