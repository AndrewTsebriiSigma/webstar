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

  useEffect(() => {
    if (item && isOpen) {
      // Could load like/save status from API if implemented
    }
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#161618] rounded-3xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col md:flex-row border border-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left: Media Content */}
        <div className="md:w-2/3 bg-black flex items-center justify-center p-4 md:p-8">
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

        {/* Right: Details */}
        <div className="md:w-1/3 flex flex-col bg-[#161618]">
          {/* Header */}
          <div className="p-6 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {authorProfilePicture ? (
                <img
                  src={authorProfilePicture}
                  alt={authorDisplayName}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-lg font-bold">
                  {authorDisplayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <a
                  href={`/${authorUsername}`}
                  className="font-semibold text-white hover:text-cyan-400 transition"
                >
                  {authorDisplayName}
                </a>
                <p className="text-xs text-gray-500">@{authorUsername}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition"
            >
              <XMarkIcon className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          {/* Title & Description */}
          <div className="p-6 border-b border-gray-800 flex-1 overflow-y-auto">
            {item.title && (
              <h2 className="text-2xl font-bold text-white mb-4">{item.title}</h2>
            )}
            {item.description && (
              <p className="text-gray-300 leading-relaxed whitespace-pre-wrap mb-4">{item.description}</p>
            )}
            {item.created_at && (
              <p className="text-xs text-gray-500 mt-4">
                {formatDate(item.created_at)}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="p-6 border-t border-gray-800 flex items-center justify-around">
            <button
              onClick={() => setIsLiked(!isLiked)}
              className={`flex flex-col items-center gap-2 transition ${
                isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'
              }`}
            >
              {isLiked ? (
                <HeartSolidIcon className="w-7 h-7" />
              ) : (
                <HeartIcon className="w-7 h-7" />
              )}
              <span className="text-xs font-medium">Like</span>
            </button>
            
            <button
              onClick={() => setIsSaved(!isSaved)}
              className={`flex flex-col items-center gap-2 transition ${
                isSaved ? 'text-cyan-500' : 'text-gray-400 hover:text-cyan-400'
              }`}
            >
              {isSaved ? (
                <BookmarkSolidIcon className="w-7 h-7" />
              ) : (
                <BookmarkIcon className="w-7 h-7" />
              )}
              <span className="text-xs font-medium">Save</span>
            </button>

            <button
              onClick={handleShare}
              className="flex flex-col items-center gap-2 text-gray-400 hover:text-cyan-400 transition"
            >
              <ShareIcon className="w-7 h-7" />
              <span className="text-xs font-medium">Share</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

