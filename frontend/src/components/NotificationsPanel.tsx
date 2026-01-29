'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, EyeIcon, Cog6ToothIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { analyticsAPI } from '@/lib/api';

interface Notification {
  id: string;
  type: 'view' | 'update' | 'system' | 'welcome';
  title: string;
  time: string;
  timestamp?: Date; // Optional timestamp for proper formatting
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

  // Format time like Telegram/iOS: "today at 12:29", "yesterday at 14:30", "Jan 15 at 10:00"
  const formatNotificationTime = (date: Date): string => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const notificationDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
    if (notificationDate.getTime() === today.getTime()) {
      return `today at ${timeStr}`;
    } else if (notificationDate.getTime() === yesterday.getTime()) {
      return `yesterday at ${timeStr}`;
    } else {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = monthNames[date.getMonth()];
      const day = date.getDate();
      return `${month} ${day} at ${timeStr}`;
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      // Fetch real analytics data
      const [profileRes, dailyRes] = await Promise.allSettled([
        analyticsAPI.getProfileAnalytics(),
        analyticsAPI.getDailyAnalytics()
      ]);

      const newNotifications: Notification[] = [];
      const now = new Date();

      // Debug: Log API responses
      if (profileRes.status === 'rejected') {
        console.error('Profile analytics API failed:', profileRes.reason);
      }
      if (dailyRes.status === 'rejected') {
        console.error('Daily analytics API failed:', dailyRes.reason);
      }

      // Add view notifications from analytics
      if (dailyRes.status === 'fulfilled' && dailyRes.value?.data) {
        const dailyData = dailyRes.value.data;
        
        // Debug: Log daily data structure
        console.log('Daily analytics data:', dailyData);
        
        // Ensure dailyData is an array
        if (Array.isArray(dailyData) && dailyData.length > 0) {
          const totalViews = dailyData.reduce((sum: number, d: { profile_views?: number }) => {
            return sum + (d.profile_views || 0);
          }, 0);
          
          // Get today's views (last item in array should be today)
          const todayData = dailyData[dailyData.length - 1];
          const todayViews = todayData?.profile_views || 0;

          console.log('Total views:', totalViews, 'Today views:', todayViews);

          if (todayViews > 0) {
            // Use current time for "today" notification
            const notificationTime = new Date();
            newNotifications.push({
              id: 'today-views',
              type: 'view',
              title: `${todayViews} profile view${todayViews > 1 ? 's' : ''} today`,
              time: formatNotificationTime(notificationTime),
              timestamp: notificationTime,
              unread: true
            });
          }

          // Don't show "all time" notification - it's redundant with today's notification
          // If user wants to see total views, they can check analytics
        } else {
          console.warn('Daily analytics data is not an array or is empty:', dailyData);
        }
      } else {
        console.warn('Daily analytics request failed or returned no data');
      }

      // Add welcome notification if no activity
      if (newNotifications.length === 0) {
        const welcomeTime = new Date();
        newNotifications.push({
          id: 'welcome',
          type: 'welcome',
          title: 'Welcome to WebSTAR! Start sharing your work.',
          time: formatNotificationTime(welcomeTime),
          timestamp: welcomeTime,
          unread: true
        });
      }

      console.log('Final notifications:', newNotifications);
      setNotifications(newNotifications);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      // Fallback notification
      const fallbackTime = new Date();
      setNotifications([{
        id: 'fallback',
        type: 'system',
        title: 'You\'re all caught up!',
        time: formatNotificationTime(fallbackTime),
        timestamp: fallbackTime,
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
      <div className={`bottom-slider-content bottom-slider-content-full-width ${isVisible ? 'entering' : 'exiting'}`}>
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
