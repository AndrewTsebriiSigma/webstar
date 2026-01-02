'use client';

import { XMarkIcon, EyeIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';

interface Notification {
  id: string;
  type: 'view' | 'update' | 'system';
  title: string;
  time: string;
  unread: boolean;
}

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

// Mock notifications data
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'view',
    title: '12 new profile views today',
    time: '8h ago',
    unread: true,
  },
  {
    id: '2',
    type: 'update',
    title: 'Profile updated successfully',
    time: '1d ago',
    unread: false,
  },
  {
    id: '3',
    type: 'view',
    title: '24 new profile views this week',
    time: '3d ago',
    unread: false,
  },
];

export default function NotificationsPanel({ isOpen, onClose }: NotificationsPanelProps) {
  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'view':
        return <EyeIcon className="w-5 h-5 text-cyan-400" />;
      case 'update':
        return <Cog6ToothIcon className="w-5 h-5 text-cyan-400" />;
      default:
        return <EyeIcon className="w-5 h-5 text-cyan-400" />;
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 backdrop-blur-sm z-50"
        style={{ background: 'rgba(17, 17, 17, 0.5)' }}
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="fixed top-0 right-0 w-full max-w-md h-full bg-gray-950 border-l border-gray-800 z-50 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white">Notifications</h2>
            <span className="px-2 py-0.5 bg-cyan-500 text-white text-xs rounded-full font-semibold">
              1
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-800 rounded-lg transition"
          >
            <XMarkIcon className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Notifications List */}
        <div className="overflow-y-auto h-[calc(100%-64px)]">
          {mockNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`flex items-start gap-3 p-4 border-b border-gray-800 hover:bg-gray-900/50 transition cursor-pointer ${
                notification.unread ? 'bg-gray-900/30' : ''
              }`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {getIcon(notification.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium mb-1">
                  {notification.title}
                </p>
                <p className="text-xs text-gray-400">{notification.time}</p>
              </div>
              {notification.unread && (
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-cyan-500 rounded-full" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

