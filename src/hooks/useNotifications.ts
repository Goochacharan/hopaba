import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';

export interface NotificationPermissionState {
  permission: NotificationPermission;
  isSupported: boolean;
  isServiceWorkerRegistered: boolean;
}

export const useNotifications = () => {
  const [permissionState, setPermissionState] = useState<NotificationPermissionState>({
    permission: 'default',
    isSupported: false,
    isServiceWorkerRegistered: false
  });

  // Check if notifications are supported
  const checkNotificationSupport = useCallback(() => {
    const isSupported = 'Notification' in window && 'serviceWorker' in navigator;
    return isSupported;
  }, []);

  // Register service worker
  const registerServiceWorker = useCallback(async () => {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported');
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      console.log('Service Worker registered successfully:', registration);
      
      // Wait for the service worker to be ready
      await navigator.serviceWorker.ready;
      
      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!checkNotificationSupport()) {
      toast({
        title: 'Notifications not supported',
        description: 'Your browser does not support push notifications',
        variant: 'destructive'
      });
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermissionState(prev => ({ ...prev, permission }));
      
      if (permission === 'granted') {
        toast({
          title: 'Notifications enabled',
          description: 'You will now receive push notifications for new messages',
        });
        return true;
      } else if (permission === 'denied') {
        toast({
          title: 'Notifications blocked',
          description: 'Please enable notifications in your browser settings to receive message alerts',
          variant: 'destructive'
        });
        return false;
      } else {
        toast({
          title: 'Notifications dismissed',
          description: 'You can enable notifications later in your browser settings',
        });
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast({
        title: 'Error',
        description: 'Failed to request notification permission',
        variant: 'destructive'
      });
      return false;
    }
  }, [checkNotificationSupport]);

  // Show notification via service worker
  const showNotification = useCallback(async (
    title: string,
    options: {
      body: string;
      conversationId?: string;
      senderName?: string;
    }
  ) => {
    if (permissionState.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return false;
    }

    if (!permissionState.isServiceWorkerRegistered) {
      console.warn('Service Worker not registered');
      return false;
    }

    try {
      // Check if the page is currently visible
      const isPageVisible = document.visibilityState === 'visible';
      
      // Only show push notification if page is not visible
      if (!isPageVisible) {
        const registration = await navigator.serviceWorker.ready;
        
        // Send message to service worker to show notification
        registration.active?.postMessage({
          type: 'SHOW_NOTIFICATION',
          title,
          body: options.body,
          conversationId: options.conversationId,
          senderName: options.senderName
        });
        
        return true;
      }
      
      return false; // Don't show notification if page is visible
    } catch (error) {
      console.error('Error showing notification:', error);
      return false;
    }
  }, [permissionState]);

  // Initialize notifications
  const initializeNotifications = useCallback(async () => {
    const isSupported = checkNotificationSupport();
    
    if (!isSupported) {
      setPermissionState({
        permission: 'denied',
        isSupported: false,
        isServiceWorkerRegistered: false
      });
      return false;
    }

    const isServiceWorkerRegistered = await registerServiceWorker();
    const currentPermission = Notification.permission;

    setPermissionState({
      permission: currentPermission,
      isSupported,
      isServiceWorkerRegistered
    });

    return isServiceWorkerRegistered;
  }, [checkNotificationSupport, registerServiceWorker]);

  // Auto-initialize on mount
  useEffect(() => {
    initializeNotifications();
  }, [initializeNotifications]);

  // Listen for permission changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      // Update permission state when page becomes visible
      if (document.visibilityState === 'visible') {
        setPermissionState(prev => ({
          ...prev,
          permission: Notification.permission
        }));
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return {
    permissionState,
    requestPermission,
    showNotification,
    initializeNotifications,
    isNotificationsEnabled: permissionState.permission === 'granted' && permissionState.isServiceWorkerRegistered
  };
}; 