'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, EyeIcon, Cog6ToothIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { analyticsAPI } from '@/lib/api';

interface Notification {
  id: string;
  type: 'view' | 'update' | 'system' | 'welcome';
  title: string;
  time: string;
  unread: boolean;
}

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationsPanel({ isOpen, onClose }: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      // Fetch real analytics data
      const [profileRes, dailyRes] = await Promise.allSettled([
        analyticsAPI.getProfileAnalytics(),
        analyticsAPI.getDailyAnalytics()
      ]);

      const newNotifications: Notification[] = [];

      // Add view notifications from analytics
      if (dailyRes.status === 'fulfilled') {
        const dailyData = dailyRes.value.data;
        const totalViews = dailyData.reduce((sum: number, d: { profile_views: number }) => sum + d.profile_views, 0);
        const todayViews = dailyData[dailyData.length - 1]?.profile_views || 0;

        if (todayViews > 0) {
          newNotifications.push({
            id: 'today-views',
            type: 'view',
            title: `${todayViews} profile view${todayViews > 1 ? 's' : ''} today`,
            time: 'Today',
            unread: true
          });
        }

        if (totalViews > 0) {
          newNotifications.push({
            id: 'total-views',
            type: 'view',
            title: `${totalViews} total profile views`,
            time: 'All time',
            unread: false
          });
        }
      }

      // Add welcome notification if no activity
      if (newNotifications.length === 0) {
        newNotifications.push({
          id: 'welcome',
          type: 'welcome',
          title: 'Welcome to WebSTAR! Start sharing your work.',
          time: 'Now',
          unread: true
        });
      }

      setNotifications(newNotifications);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      // Fallback notification
      setNotifications([{
        id: 'fallback',
        type: 'system',
        title: 'You\'re all caught up!',
        time: 'Now',
        unread: false
      }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'view':
        return <EyeIcon className="w-5 h-5" style={{ color: '#00C2FF' }} />;
      case 'update':
        return <Cog6ToothIcon className="w-5 h-5" style={{ color: '#00C2FF' }} />;
      case 'welcome':
        return <SparklesIcon className="w-5 h-5" style={{ color: '#FFD60A' }} />;
      default:
        return <EyeIcon className="w-5 h-5" style={{ color: '#00C2FF' }} />;
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
            {notifications.filter(n => n.unread).length > 0 && (
              <span style={{ padding: '2px 8px', background: '#00C2FF', borderRadius: '999px', fontSize: '11px', fontWeight: 700, color: '#FFFFFF' }}>
                {notifications.filter(n => n.unread).length}
              </span>
            )}
          </div>
          <button onClick={onClose} className="flex items-center justify-center hover:opacity-70 transition-opacity" style={{ width: '28px', height: '28px' }}>
            <XMarkIcon style={{ width: '24px', height: '24px', color: 'rgba(255, 255, 255, 0.5)' }} />
          </button>
        </div>

        {/* Notifications List - divider style */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div 
              className="flex items-center justify-center"
              style={{ padding: '40px 16px' }}
            >
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-500"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div 
              className="flex flex-col items-center justify-center"
              style={{ padding: '40px 16px', color: 'rgba(255, 255, 255, 0.4)' }}
            >
              <EyeIcon className="w-8 h-8 mb-2" style={{ opacity: 0.5 }} />
              <p style={{ fontSize: '14px' }}>No notifications yet</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className="flex items-center gap-3 cursor-pointer"
                style={{
                  padding: '12px 16px',
                  background: notification.unread ? 'rgba(0, 194, 255, 0.08)' : 'transparent',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                  transition: 'background 0.15s ease'
                }}
              >
                {/* Icon with circle background */}
                <div 
                  className="flex-shrink-0 flex items-center justify-center"
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: notification.type === 'welcome' ? 'rgba(255, 214, 10, 0.12)' : 'rgba(0, 194, 255, 0.12)'
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
            ))
          )}
        </div>
      </div>
    </div>
  );
}
