'use client';

interface CreateContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPost: () => void;
  onSelectProject: () => void;
  navHeightReduction?: number; // 0 to 1, how much nav has shrunk
}

export default function CreateContentModal({
  isOpen,
  onClose,
  onSelectPost,
  onSelectProject,
  navHeightReduction = 0,
}: CreateContentModalProps) {
  if (!isOpen) return null;

  // Nav base height ~54px (11px padding + 32px button + 11px padding), shrinks by ~10px max
  // Dropdown sits right below with 6px gap - sticky to nav
  const navHeight = 54 - (10 * navHeightReduction);
  const dropdownTop = navHeight + 6;

  return (
    <div 
      className="fixed inset-0 z-50"
      style={{
        background: 'rgba(0, 0, 0, 0.3)',
      }}
      onClick={onClose}
    >
      {/* Dropdown - full width, anchored to nav */}
      <div 
        className="absolute left-3 right-3"
        style={{
          top: `${dropdownTop}px`,
          background: 'rgba(18, 18, 18, 0.95)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          border: '1px solid #2D2D2D',
          borderRadius: '16px',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Post Option - Cyan/Blue gradient (static) */}
        <button
          onClick={() => {
            onSelectPost();
            onClose();
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
        </button>

        {/* Divider */}
        <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.06)', margin: '0 12px' }} />

        {/* Project Option - Purple/Pink gradient (static) */}
        <button
          onClick={() => {
            onSelectProject();
            onClose();
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
  );
}
