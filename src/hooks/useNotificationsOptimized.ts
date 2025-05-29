
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
      // Ensure we're in a browser environment and Notification API exists
      if (typeof window === 'undefined' || !window.Notification || !('Notification' in window)) {
        setIsNotificationsEnabled(false);
        return;
      }

      setIsNotificationsEnabled(window.Notification.permission === 'granted');
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      requestIdleCallback(checkPermission);
    } else {
      setTimeout(checkPermission, 100);
    }
  }, [user]);

  const requestNotificationPermission = async () => {
    // Check if we're in a browser environment and Notification API exists
    if (typeof window === 'undefined' || !window.Notification || !('Notification' in window)) {
      return false;
    }

    try {
      const permission = await window.Notification.requestPermission();
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
