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
  
  // Animation states
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setIsVisible(true));
      fetchNotifications();
    } else {
      setIsVisible(false);
      setIsClosing(false);
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

  // Animated close handler
  const handleClose = () => {
    setIsClosing(true);
    setIsVisible(false);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  };

  if (!isOpen && !isClosing) return null;

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
    <>
      {/* Backdrop with animation */}
      <div 
        className={`bottom-slider-backdrop ${isVisible ? 'entering' : 'exiting'}`}
        onClick={handleClose}
      />
      
      {/* Bottom Slider Content with animation */}
      <div className={`bottom-slider-content ${isVisible ? 'entering' : 'exiting'}`}>
        {/* Header - 55px with close on LEFT, title CENTERED */}
        <div 
          className="flex items-center flex-shrink-0"
          style={{ 
            height: '55px',
            padding: '0 16px',
            background: 'rgba(20, 20, 20, 0.8)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            position: 'relative'
          }}
        >
          {/* Close button - absolute left */}
          <button 
            onClick={handleClose} 
            className="flex items-center justify-center hover:opacity-70 transition-opacity" 
            style={{ 
              position: 'absolute',
              left: '16px',
              width: '32px', 
              height: '32px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              borderRadius: '8px'
            }}
          >
            <XMarkIcon style={{ width: '20px', height: '20px', color: 'rgba(255, 255, 255, 0.6)' }} />
          </button>
          
          {/* Title - centered with badge */}
          <div className="flex items-center gap-2 mx-auto">
            <span style={{ fontSize: '17px', fontWeight: 600, color: '#FFFFFF' }}>Notifications</span>
            {notifications.filter(n => n.unread).length > 0 && (
              <span style={{ padding: '2px 8px', background: '#00C2FF', borderRadius: '999px', fontSize: '11px', fontWeight: 700, color: '#FFFFFF' }}>
                {notifications.filter(n => n.unread).length}
              </span>
            )}
          </div>
        </div>

        {/* Notifications List - scrollable content */}
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
    </>
  );
}
