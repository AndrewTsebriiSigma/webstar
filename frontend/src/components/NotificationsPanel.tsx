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
        return <EyeIcon className="w-[18px] h-[18px]" style={{ color: '#00C2FF' }} />;
      case 'update':
        return <Cog6ToothIcon className="w-[18px] h-[18px]" style={{ color: '#00C2FF' }} />;
      default:
        return <EyeIcon className="w-[18px] h-[18px]" style={{ color: '#00C2FF' }} />;
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50"
      style={{ 
        background: 'rgba(17, 17, 17, 0.92)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)'
      }}
    >
      <div className="w-full h-full flex flex-col" style={{ background: 'transparent' }}>
        {/* Header - 55px */}
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
            <span style={{ padding: '2px 8px', background: '#00C2FF', borderRadius: '999px', fontSize: '11px', fontWeight: 700, color: '#FFFFFF' }}>1</span>
          </div>
          <button onClick={onClose} className="flex items-center justify-center hover:opacity-70 transition-opacity" style={{ width: '28px', height: '28px' }}>
            <XMarkIcon style={{ width: '24px', height: '24px', color: 'rgba(255, 255, 255, 0.5)' }} />
          </button>
        </div>

        {/* Notifications List - divider style */}
        <div className="flex-1 overflow-y-auto">
          {mockNotifications.map((notification) => (
            <div
              key={notification.id}
              className="flex items-center gap-3 cursor-pointer"
              style={{
                padding: '12px 16px',
                background: notification.unread ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                transition: 'background 0.15s ease'
              }}
            >
              {/* Icon with glassy circle background */}
              <div 
                className="flex-shrink-0 flex items-center justify-center"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(0, 194, 255, 0.08)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)'
                }}
              >
                {getIcon(notification.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p style={{ fontSize: '14px', fontWeight: 500, color: '#FFFFFF', marginBottom: '2px' }}>{notification.title}</p>
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
  );
}
