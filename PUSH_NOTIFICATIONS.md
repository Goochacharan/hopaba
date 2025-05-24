# Push Notifications for New Messages

This feature provides real-time push notifications for new unread messages in the Hopaba messaging system.

## Features

- **Browser Push Notifications**: Get notified even when the app is not active
- **Smart Notifications**: Only shows push notifications when the page is not visible
- **Direct Navigation**: Click notifications to go directly to the conversation
- **Permission Management**: Easy enable/disable through settings
- **Cross-Browser Support**: Works on Chrome, Firefox, Safari, and other modern browsers

## How It Works

1. **Service Worker**: A service worker (`/public/sw.js`) handles push notifications
2. **Permission Request**: Users are prompted to enable notifications when visiting messages
3. **Real-time Integration**: Integrates with existing Supabase real-time messaging
4. **Smart Display**: Shows toast notifications when page is active, push notifications when inactive

## User Experience

### Enabling Notifications

1. Visit the Messages page (`/messages`)
2. Click "Enable" on the notification prompt, or
3. Go to Settings → Notifications tab
4. Click "Enable Notifications"

### Notification Behavior

- **Page Active**: Shows toast notification at bottom of screen
- **Page Inactive**: Shows browser push notification
- **Click Action**: Opens the specific conversation
- **Close Action**: Dismisses the notification

### Settings Management

Users can manage notifications in:
- Settings page → Notifications tab
- Browser settings (for advanced users)

## Technical Implementation

### Components

- `useNotifications` hook: Manages permission and service worker
- `NotificationSettings` component: Settings UI
- `NotificationPrompt` component: Encourages users to enable
- Service Worker: Handles push notifications and click events

### Integration Points

- `useConversations` hook: Enhanced with push notification support
- Real-time message handler: Shows notifications for new messages
- Main layout: Shows notification status indicator

### Browser Support

- ✅ Chrome/Chromium browsers
- ✅ Firefox
- ✅ Safari (macOS/iOS)
- ✅ Edge
- ❌ Internet Explorer (not supported)

## Privacy & Security

- Notifications only contain message metadata (no content)
- No personal data is sent to external services
- Uses browser's native notification system
- Respects user's browser notification settings

## Troubleshooting

### Notifications Not Working

1. Check browser permissions in address bar
2. Ensure notifications are enabled in browser settings
3. Check if service worker is registered (Developer Tools → Application → Service Workers)
4. Verify the page is not in focus when testing

### Re-enabling After Blocking

1. Click the lock/shield icon in address bar
2. Set Notifications to "Allow"
3. Refresh the page
4. Or use the "Browser Settings" button in Settings → Notifications

## Development Notes

- Service worker is registered in `main.tsx`
- Notifications are debounced to prevent spam
- Uses browser's native Notification API
- Integrates with existing toast notification system 