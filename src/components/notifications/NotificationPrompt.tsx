import React, { useState, useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Bell, X } from 'lucide-react';

interface NotificationPromptProps {
  onDismiss?: () => void;
  className?: string;
}

export const NotificationPrompt: React.FC<NotificationPromptProps> = ({ 
  onDismiss,
  className = ""
}) => {
  const { permissionState, requestPermission, isNotificationsEnabled } = useNotifications();
  const [isDismissed, setIsDismissed] = useState(false);

  // Check if user has already dismissed this prompt
  useEffect(() => {
    const dismissed = localStorage.getItem('notification-prompt-dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  const handleEnableNotifications = async () => {
    await requestPermission();
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('notification-prompt-dismissed', 'true');
    onDismiss?.();
  };

  // Don't show if already dismissed, notifications are enabled, or not supported
  if (isDismissed || 
      isNotificationsEnabled || 
      !permissionState.isSupported || 
      permissionState.permission === 'denied') {
    return null;
  }

  return (
    <Alert className={`border-blue-200 bg-blue-50 ${className}`}>
      <Bell className="h-4 w-4 text-blue-600" />
      <div className="flex items-center justify-between w-full">
        <div className="flex-1">
          <AlertDescription className="text-blue-800">
            <strong>Stay connected!</strong> Enable push notifications to get instant alerts for new messages, even when the app is closed.
          </AlertDescription>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <Button 
            onClick={handleEnableNotifications}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Enable
          </Button>
          <Button 
            onClick={handleDismiss}
            variant="ghost"
            size="sm"
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Alert>
  );
}; 