'use client';

import { XMarkIcon } from '@heroicons/react/24/outline';

interface CreateContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPost: () => void;
  onSelectProject: () => void;
}

export default function CreateContentModal({
  isOpen,
  onClose,
  onSelectPost,
  onSelectProject,
}: CreateContentModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div 
        className="bg-[#1a1a1c] rounded-2xl shadow-2xl w-full max-w-md border border-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-lg font-bold text-white">Create</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-800 rounded-lg transition"
          >
            <XMarkIcon className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Post Option */}
          <button
            onClick={() => {
              onSelectPost();
              onClose();
            }}
            className="w-full flex items-center gap-4 p-4 bg-gray-900 hover:bg-gray-800 rounded-xl transition text-left border border-gray-800 hover:border-cyan-500"
          >
            <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-white mb-0.5">Post</h3>
              <p className="text-sm text-gray-400">Share progress in your portfolio</p>
            </div>
          </button>

          {/* Project Option */}
          <button
            onClick={() => {
              onSelectProject();
              onClose();
            }}
            className="w-full flex items-center gap-4 p-4 bg-gray-900 hover:bg-gray-800 rounded-xl transition text-left border border-gray-800 hover:border-cyan-500"
          >
            <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-white mb-0.5">Project</h3>
              <p className="text-sm text-gray-400">Curated collection of your work</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

