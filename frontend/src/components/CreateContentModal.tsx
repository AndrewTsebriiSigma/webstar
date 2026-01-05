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
      gradient: 'linear-gradient(135deg, rgba(0, 194, 255, 0.15) 0%, rgba(0, 122, 255, 0.15) 100%)',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
        </svg>
      )
    },
    { 
      type: 'audio' as const, 
      label: 'Audio',
      color: '#A78BFA',
      gradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(167, 139, 250, 0.15) 100%)',
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
      gradient: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(16, 185, 129, 0.15) 100%)',
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
      gradient: 'linear-gradient(135deg, rgba(251, 146, 60, 0.15) 0%, rgba(245, 158, 11, 0.15) 100%)',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
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
        {/* Post Header - Shrinks when expanded */}
        <button
          onClick={postExpanded ? handleCollapse : handlePostClick}
          className="w-full transition-all duration-200 ease-out"
          style={{ 
            padding: postExpanded ? '10px 16px' : '12px',
            background: 'transparent'
          }}
        >
          {postExpanded ? (
            // Thin collapsed bar
            <div className="flex items-center justify-center gap-2">
              <div 
                className="flex-1 h-[3px] rounded-full"
                style={{ background: 'rgba(255, 255, 255, 0.1)' }}
              />
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Post</span>
              <div 
                className="flex-1 h-[3px] rounded-full"
                style={{ background: 'rgba(255, 255, 255, 0.1)' }}
              />
            </div>
          ) : (
            // Full Post option
            <div className="flex items-center gap-3">
              <div 
                className="flex items-center justify-center flex-shrink-0"
                style={{
                  width: '44px',
                  height: '44px',
                  background: 'linear-gradient(135deg, rgba(0, 194, 255, 0.15) 0%, rgba(0, 122, 255, 0.15) 100%)',
                  borderRadius: '10px'
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="#00C2FF" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-[15px] font-semibold text-white">Post</h3>
                <p className="text-[13px]" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Share to your portfolio</p>
              </div>
            </div>
          )}
        </button>

        {/* 4 Post Type Buttons - Slide up when expanded */}
        <div 
          className="grid grid-cols-4 gap-2 transition-all duration-200 ease-out overflow-hidden"
          style={{
            padding: postExpanded ? '0 12px 12px' : '0 12px',
            maxHeight: postExpanded ? '120px' : '0',
            opacity: postExpanded ? 1 : 0
          }}
        >
          {postTypes.map((item) => (
            <button
              key={item.type}
              onClick={() => handleTypeSelect(item.type)}
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all duration-150"
              style={{ background: 'transparent' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: item.gradient }}
              >
                <span style={{ color: item.color }}>{item.icon}</span>
              </div>
              <span className="text-[11px] font-medium text-gray-400">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Divider - Fades out when expanded */}
        <div 
          className="transition-all duration-200 ease-out"
          style={{ 
            height: '1px', 
            background: 'rgba(255, 255, 255, 0.06)', 
            margin: '0 12px',
            opacity: postExpanded ? 0 : 1
          }} 
        />

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
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(236, 72, 153, 0.15) 100%)',
                borderRadius: '10px'
              }}
            >
              <svg className="w-5 h-5" fill="none" stroke="#A78BFA" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
              </svg>
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-[15px] font-semibold text-white">Project</h3>
              <p className="text-[13px]" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Curated collection</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
