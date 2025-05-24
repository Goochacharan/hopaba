import React from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const NotificationSettings: React.FC = () => {
  const { 
    permissionState, 
    requestPermission, 
    isNotificationsEnabled 
  } = useNotifications();

  const getPermissionStatus = () => {
    if (!permissionState.isSupported) {
      return {
        icon: <AlertCircle className="h-4 w-4" />,
        text: 'Not Supported',
        variant: 'destructive' as const,
        description: 'Your browser does not support push notifications'
      };
    }

    switch (permissionState.permission) {
      case 'granted':
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          text: 'Enabled',
          variant: 'default' as const,
          description: 'You will receive push notifications for new messages'
        };
      case 'denied':
        return {
          icon: <BellOff className="h-4 w-4" />,
          text: 'Blocked',
          variant: 'destructive' as const,
          description: 'Notifications are blocked. Please enable them in your browser settings'
        };
      default:
        return {
          icon: <Bell className="h-4 w-4" />,
          text: 'Not Set',
          variant: 'secondary' as const,
          description: 'Click to enable push notifications for new messages'
        };
    }
  };

  const status = getPermissionStatus();

  const handleEnableNotifications = async () => {
    await requestPermission();
  };

  const openBrowserSettings = () => {
    // Guide users to browser settings
    const userAgent = navigator.userAgent.toLowerCase();
    let instructions = '';
    
    if (userAgent.includes('chrome')) {
      instructions = 'Chrome: Click the lock icon in the address bar → Notifications → Allow';
    } else if (userAgent.includes('firefox')) {
      instructions = 'Firefox: Click the shield icon in the address bar → Permissions → Notifications → Allow';
    } else if (userAgent.includes('safari')) {
      instructions = 'Safari: Safari menu → Preferences → Websites → Notifications → Allow for this site';
    } else {
      instructions = 'Check your browser settings to enable notifications for this site';
    }

    alert(instructions);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Push Notifications
        </CardTitle>
        <CardDescription>
          Get notified when you receive new messages, even when the app is not open
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Status:</span>
            <Badge variant={status.variant} className="flex items-center gap-1">
              {status.icon}
              {status.text}
            </Badge>
          </div>
          
          {permissionState.permission === 'default' && permissionState.isSupported && (
            <Button onClick={handleEnableNotifications} size="sm">
              Enable Notifications
            </Button>
          )}
          
          {permissionState.permission === 'denied' && (
            <Button onClick={openBrowserSettings} variant="outline" size="sm">
              Browser Settings
            </Button>
          )}
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {status.description}
          </AlertDescription>
        </Alert>

        {isNotificationsEnabled && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              ✅ Push notifications are working! You'll receive alerts for new messages when the app is not active.
            </AlertDescription>
          </Alert>
        )}

        {!permissionState.isSupported && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your browser doesn't support push notifications. Consider using a modern browser like Chrome, Firefox, or Safari for the best experience.
            </AlertDescription>
          </Alert>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Notifications only appear when the app is not active</p>
          <p>• Click on a notification to go directly to the conversation</p>
          <p>• You can disable notifications anytime in your browser settings</p>
        </div>
      </CardContent>
    </Card>
  );
}; 