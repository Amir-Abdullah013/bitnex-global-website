'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button, Card, Loader, Toast } from '@/components';
import { formatDistanceToNow } from 'date-fns';

export default function UserNotificationsPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAsRead, setMarkingAsRead] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      loadNotifications();
    } else if (!authLoading && !isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [authLoading, isAuthenticated, user]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/notifications?userId=${user.id}&limit=25&offset=0`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      
      const data = await response.json();
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setToast({
        type: 'error',
        message: 'Failed to load notifications'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      setMarkingAsRead(notificationId);
      
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, status: 'READ' }
            : notification
        )
      );
      
      setToast({
        type: 'success',
        message: 'Notification marked as read'
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      setToast({
        type: 'error',
        message: 'Failed to mark notification as read'
      });
    } finally {
      setMarkingAsRead(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/notifications/read-all', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, status: 'READ' }))
      );
      
      setToast({
        type: 'success',
        message: 'All notifications marked as read'
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      setToast({
        type: 'error',
        message: 'Failed to mark all notifications as read'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewNotification = (notificationId) => {
    router.push(`/user/notifications/${notificationId}`);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'alert':
        return '🚨';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  const getNotificationColor = (type, status) => {
    if (status === 'read') {
      return 'bg-binance-surface border-binance-border';
    }
    
    switch (type) {
      case 'success':
        return 'bg-binance-green/10 border-binance-green/30';
      case 'warning':
        return 'bg-binance-primary/10 border-binance-primary/30';
      case 'alert':
        return 'bg-binance-red/10 border-binance-red/30';
      case 'info':
      default:
        return 'bg-binance-surface border-binance-border';
    }
  };

  if (loading && !notifications.length) {
    return (
      <div className="min-h-screen bg-binance-background flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  const unreadCount = notifications.filter(n => n.status === 'unread').length;

  return (
    <div className="min-h-screen bg-binance-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-binance-textPrimary">Notifications</h1>
              <p className="text-binance-textSecondary mt-2">
                {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
              </p>
            </div>
            {unreadCount > 0 && (
              <Button
                onClick={handleMarkAllAsRead}
                disabled={loading}
                className="bg-binance-primary hover:bg-binance-primary/80 text-binance-background"
              >
                Mark All as Read
              </Button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <Card className="text-center py-12">
            <div className="text-binance-textTertiary text-6xl mb-4">🔔</div>
            <h3 className="text-xl font-semibold text-binance-textPrimary mb-2">No notifications yet</h3>
            <p className="text-binance-textSecondary">You'll see important updates and announcements here.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification, index) => (
              <Card
                key={notification.id || notification.$id || `notification-${index}`}
                className={`cursor-pointer transition-all duration-200 hover:shadow-md ${getNotificationColor(notification.type, notification.status)} ${
                  notification.status === 'unread' ? 'ring-2 ring-binance-primary/30' : ''
                }`}
                onClick={() => handleViewNotification(notification.$id)}
              >
                <div className="flex items-start space-x-4">
                  <div className="text-2xl">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className={`text-lg font-semibold ${
                        notification.status === 'unread' ? 'text-binance-textPrimary' : 'text-binance-textSecondary'
                      }`}>
                        {notification.title}
                      </h3>
                      <div className="flex items-center space-x-2">
                        {notification.status === 'unread' && (
                          <div className="w-2 h-2 bg-binance-primary rounded-full"></div>
                        )}
                        <span className="text-sm text-binance-textTertiary">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    
                    <p className={`mt-2 ${
                      notification.status === 'unread' ? 'text-binance-textPrimary' : 'text-binance-textSecondary'
                    }`}>
                      {notification.message.length > 150 
                        ? `${notification.message.substring(0, 150)}...` 
                        : notification.message
                      }
                    </p>
                    
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          notification.type === 'success' ? 'bg-binance-green/20 text-binance-green border border-binance-green/30' :
                          notification.type === 'warning' ? 'bg-binance-primary/20 text-binance-primary border border-binance-primary/30' :
                          notification.type === 'alert' ? 'bg-binance-red/20 text-binance-red border border-binance-red/30' :
                          'bg-binance-surface border border-binance-border text-binance-textSecondary'
                        }`}>
                          {notification.type}
                        </span>
                        {notification.userId && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-binance-primary/20 text-binance-primary border border-binance-primary/30">
                            Personal
                          </span>
                        )}
                        {!notification.userId && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-binance-surface border border-binance-border text-binance-textSecondary">
                            Global
                          </span>
                        )}
                      </div>
                      
                      {notification.status === 'unread' && (
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notification.$id);
                          }}
                          disabled={markingAsRead === notification.$id}
                          className="bg-binance-primary hover:bg-binance-primary/80 text-binance-background text-sm"
                        >
                          {markingAsRead === notification.$id ? 'Marking...' : 'Mark as Read'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Back Button */}
        <div className="mt-8">
          <Button
            onClick={() => router.push('/user/dashboard')}
            className="bg-binance-surface hover:bg-binance-surfaceHover text-binance-textPrimary border border-binance-border"
          >
            ← Back to Dashboard
          </Button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}












