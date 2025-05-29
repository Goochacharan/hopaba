
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

export const useNotificationsOptimized = () => {
  const { user } = useAuth();
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(false);

  useEffect(() => {
    // Only check notification permission if user is logged in
    if (!user) {
      setIsNotificationsEnabled(false);
      return;
    }

    // Check notification permission with requestIdleCallback for better performance
    const checkPermission = () => {
      if ('Notification' in window) {
        setIsNotificationsEnabled(Notification.permission === 'granted');
      }
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(checkPermission);
    } else {
      setTimeout(checkPermission, 100);
    }
  }, [user]);

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      setIsNotificationsEnabled(granted);
      return granted;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  return {
    isNotificationsEnabled,
    requestNotificationPermission
  };
};
