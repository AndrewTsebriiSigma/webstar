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

const mockNotifications: Notification[] = [
  { id: '1', type: 'view', title: '12 new profile views today', time: '8h ago', unread: true },
  { id: '2', type: 'update', title: 'Profile updated successfully', time: '1d ago', unread: false },
  { id: '3', type: 'view', title: '24 new profile views this week', time: '3d ago', unread: false },
];

export default function NotificationsPanel({ isOpen, onClose }: NotificationsPanelProps) {
  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'view':
        return <EyeIcon className="w-5 h-5" style={{ color: '#00C2FF' }} />;
      case 'update':
        return <Cog6ToothIcon className="w-5 h-5" style={{ color: '#00C2FF' }} />;
      default:
        return <EyeIcon className="w-5 h-5" style={{ color: '#00C2FF' }} />;
    }
  };

  return (
    <>
      {/* Glass Overlay */}
      <div 
        className="fixed inset-0 z-50"
        style={{ 
          background: 'rgba(17, 17, 17, 0.75)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)'
        }}
      >
        {/* Full Screen Panel */}
        <div className="w-full h-full flex flex-col" style={{ background: 'transparent' }}>
          {/* Header - 55px, darker */}
          <div 
            className="flex items-center justify-between flex-shrink-0"
            style={{ 
              height: '55px',
              padding: '0 16px',
              background: '#0D0D0D',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
            }}
          >
            <div className="flex items-center gap-2">
              <span style={{ fontSize: '20px', fontWeight: 600, color: '#FFFFFF' }}>Notifications</span>
              <span 
                style={{ 
                  padding: '2px 8px',
                  background: '#00C2FF',
                  borderRadius: '999px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#FFFFFF'
                }}
              >
                1
              </span>
            </div>
            <button
              onClick={onClose}
              className="flex items-center justify-center hover:opacity-70 transition-opacity"
              style={{ width: '28px', height: '28px' }}
            >
              <XMarkIcon style={{ width: '24px', height: '24px', color: 'rgba(255, 255, 255, 0.5)' }} />
            </button>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto" style={{ padding: '16px' }}>
            {mockNotifications.map((notification) => (
              <div
                key={notification.id}
                className="flex items-center gap-3 cursor-pointer"
                style={{
                  padding: '14px 16px',
                  marginBottom: '8px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  transition: 'background 0.15s ease'
                }}
              >
                <div className="flex-shrink-0">
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: '14px', fontWeight: 500, color: '#FFFFFF', marginBottom: '2px' }}>
                    {notification.title}
                  </p>
                  <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.4)' }}>{notification.time}</p>
                </div>
                {notification.unread && (
                  <div className="flex-shrink-0">
                    <div style={{ width: '8px', height: '8px', background: '#00C2FF', borderRadius: '50%' }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
