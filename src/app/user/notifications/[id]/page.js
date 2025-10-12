'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
// Removed direct database import - using API calls instead
import { authHelpers } from '@/lib/supabase';
import { Button, Card, Loader, Toast } from '@/components';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(false);
  const [markingAsRead, setMarkingAsRead] = useState(false);
  const [toast, setToast] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUserAndNotification();
  }, [params.id]);

  const loadUserAndNotification = async () => {
    try {
      setLoading(true);
      const currentUser = await authHelpers.getCurrentUser();
      
      if (!currentUser) {
        router.push('/auth/signin');
        return;
      }

      setUser(currentUser);
      
      // Fetch notification via API
      const response = await fetch(`/api/notifications/${params.id}`);
      if (response.ok) {
        const notificationData = await response.json();
        setNotification(notificationData.notification);
      } else {
        throw new Error('Failed to load notification');
      }
    } catch (error) {
      console.error('Error loading notification:', error);
      setToast({
        type: 'error',
        message: 'Failed to load notification'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async () => {
    try {
      setMarkingAsRead(true);
      
      const response = await fetch(`/api/notifications/${notification.id}/read`, {
        method: 'PATCH'
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark as read');
      }
      
      // Update local state
      setNotification(prev => ({ ...prev, status: 'read' }));
      
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
      setMarkingAsRead(false);
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-binance-background flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!notification) {
    return (
      <div className="min-h-screen bg-binance-background flex items-center justify-center">
        <Card className="text-center py-12">
          <div className="text-binance-textTertiary text-6xl mb-4">❌</div>
          <h3 className="text-xl font-semibold text-binance-textPrimary mb-2">Notification not found</h3>
          <p className="text-binance-textSecondary mb-6">The notification you're looking for doesn't exist or you don't have access to it.</p>
          <Button
            onClick={() => router.push('/user/notifications')}
            className="bg-binance-primary hover:bg-binance-primary/80 text-binance-background"
          >
            Back to Notifications
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-binance-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => router.push('/user/notifications')}
            className="mb-4 bg-binance-surface hover:bg-binance-surfaceHover text-binance-textPrimary border border-binance-border"
          >
            ← Back to Notifications
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-binance-textPrimary">Notification Details</h1>
              <p className="text-binance-textSecondary mt-2">
                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
              </p>
            </div>
            {notification.status === 'unread' && (
              <Button
                onClick={handleMarkAsRead}
                disabled={markingAsRead}
                className="bg-binance-primary hover:bg-binance-primary/80 text-binance-background"
              >
                {markingAsRead ? 'Marking as Read...' : 'Mark as Read'}
              </Button>
            )}
          </div>
        </div>

        {/* Notification Content */}
        <Card className={`${getNotificationColor(notification.type, notification.status)} ${
          notification.status === 'unread' ? 'ring-2 ring-binance-primary/30' : ''
        }`}>
          <div className="flex items-start space-x-4">
            <div className="text-4xl">
              {getNotificationIcon(notification.type)}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-2xl font-bold ${
                  notification.status === 'unread' ? 'text-binance-textPrimary' : 'text-binance-textSecondary'
                }`}>
                  {notification.title}
                </h2>
                {notification.status === 'unread' && (
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-binance-primary rounded-full"></div>
                    <span className="text-sm font-medium text-binance-primary">Unread</span>
                  </div>
                )}
              </div>
              
              <div className="mb-6">
                <p className={`text-lg leading-relaxed ${
                  notification.status === 'unread' ? 'text-binance-textPrimary' : 'text-binance-textSecondary'
                }`}>
                  {notification.message}
                </p>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-binance-border">
                <div className="flex items-center space-x-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    notification.type === 'success' ? 'bg-binance-green/20 text-binance-green border border-binance-green/30' :
                    notification.type === 'warning' ? 'bg-binance-primary/20 text-binance-primary border border-binance-primary/30' :
                    notification.type === 'alert' ? 'bg-binance-red/20 text-binance-red border border-binance-red/30' :
                    'bg-binance-surface border border-binance-border text-binance-textSecondary'
                  }`}>
                    {notification.type}
                  </span>
                  
                  {notification.userId && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-binance-primary/20 text-binance-primary border border-binance-primary/30">
                      Personal Notification
                    </span>
                  )}
                  
                  {!notification.userId && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-binance-surface border border-binance-border text-binance-textSecondary">
                      Global Notification
                    </span>
                  )}
                </div>
                
                <div className="text-sm text-binance-textTertiary">
                  Created {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="mt-8 flex items-center justify-between">
          <Button
            onClick={() => router.push('/user/notifications')}
            className="bg-binance-surface hover:bg-binance-surfaceHover text-binance-textPrimary border border-binance-border"
          >
            ← Back to Notifications
          </Button>
          
          {notification.status === 'unread' && (
            <Button
              onClick={handleMarkAsRead}
              disabled={markingAsRead}
              className="bg-binance-primary hover:bg-binance-primary/80 text-binance-background"
            >
              {markingAsRead ? 'Marking as Read...' : 'Mark as Read'}
            </Button>
          )}
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












