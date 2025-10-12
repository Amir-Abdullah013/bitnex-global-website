'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authHelpers } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUserAndNotifications();
  }, []);

  const loadUserAndNotifications = async () => {
    try {
      const currentUser = await authHelpers.getCurrentUser();
      
      if (!currentUser) {
        return;
      }

      setUser(currentUser);
      
      // Load recent notifications (last 5)
      try {
        const notificationsResponse = await fetch(`/api/notifications?userId=${currentUser.id}&limit=5&offset=0`);
        if (notificationsResponse.ok) {
          const notificationsData = await notificationsResponse.json();
          setNotifications(notificationsData.notifications || []);
        } else {
          console.warn('Failed to load notifications:', notificationsResponse.status);
          setNotifications([]);
        }
      } catch (notifError) {
        console.error('Error loading notifications:', notifError);
        setNotifications([]);
      }
      
      // Get unread count
      try {
        const unreadResponse = await fetch(`/api/notifications/unread-count?userId=${currentUser.id}`);
        if (unreadResponse.ok) {
          const unreadData = await unreadResponse.json();
          setUnreadCount(unreadData.count || 0);
        } else {
          console.warn('Failed to load unread count:', unreadResponse.status);
          setUnreadCount(0);
        }
      } catch (unreadError) {
        console.error('Error loading unread count:', unreadError);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error loading user and notifications:', error);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/mark-read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user?.id })
      });
      
      if (response.ok) {
        // Update local state
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, isRead: true }
              : notification
          )
        );
        
        // Update unread count
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleViewAll = () => {
    setIsOpen(false);
    router.push('/user/notifications');
  };

  const handleViewNotification = (notificationId) => {
    setIsOpen(false);
    router.push(`/user/notifications/${notificationId}`);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'SUCCESS':
        return '✅';
      case 'WARNING':
        return '⚠️';
      case 'ALERT':
        return '🚨';
      case 'INFO':
      default:
        return 'ℹ️';
    }
  };

  const getNotificationColor = (type, status) => {
    if (status === 'READ') {
      return 'bg-binance-surface';
    }
    
    switch (type) {
      case 'SUCCESS':
        return 'bg-binance-green/10';
      case 'WARNING':
        return 'bg-binance-primary/10';
      case 'ALERT':
        return 'bg-binance-red/10';
      case 'INFO':
      default:
        return 'bg-binance-surface';
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-binance-textSecondary hover:text-binance-textPrimary focus:outline-none focus:ring-2 focus:ring-binance-primary rounded-full transition-colors"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-binance-red text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Modal */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Modal Content */}
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 max-w-[90vw] bg-binance-surface rounded-xl shadow-2xl border border-binance-border z-50 max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-binance-border">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-binance-textPrimary">Notifications</h3>
                <button
                  onClick={handleViewAll}
                  className="text-sm text-binance-primary hover:text-binance-primary/80 font-medium"
                >
                  View all
                </button>
              </div>
              {unreadCount > 0 && (
                <p className="text-sm text-binance-textSecondary mt-1">
                  {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
                </p>
              )}
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-6 py-8 text-center">
                  <div className="text-binance-textTertiary text-4xl mb-2">🔔</div>
                  <p className="text-binance-textSecondary">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-binance-border">
                  {notifications.map((notification, index) => (
                    <div
                      key={notification.id || notification.$id || `notification-${index}`}
                      className={`px-6 py-4 hover:bg-binance-surfaceHover cursor-pointer transition-colors ${getNotificationColor(notification.type, notification.status)}`}
                      onClick={() => handleViewNotification(notification.id || notification.$id)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="text-lg">
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className={`text-sm font-medium ${
                              notification.status === 'UNREAD' ? 'text-binance-textPrimary' : 'text-binance-textSecondary'
                            }`}>
                              {notification.title}
                            </h4>
                            {notification.status === 'UNREAD' && (
                              <div className="w-2 h-2 bg-binance-primary rounded-full flex-shrink-0"></div>
                            )}
                          </div>
                          
                          <p className="text-sm text-binance-textSecondary mt-1 line-clamp-2">
                            {notification.message.length > 80 
                              ? `${notification.message.substring(0, 80)}...` 
                              : notification.message
                            }
                          </p>
                          
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-binance-textTertiary">
                              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                            </span>
                            
                            {notification.status === 'UNREAD' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsRead(notification.$id);
                                }}
                                className="text-xs text-binance-primary hover:text-binance-primary/80 font-medium"
                              >
                                Mark as read
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-6 py-4 border-t border-binance-border">
                <button
                  onClick={handleViewAll}
                  className="w-full text-center text-sm text-binance-primary hover:text-binance-primary/80 font-medium py-2 px-4 rounded-lg hover:bg-binance-primary/10 transition-colors"
                >
                  View all notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}




