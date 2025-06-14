
// Add debugging logs to detect initialization issues
import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import App from './App.tsx'
import './index.css'

console.log('[main.tsx] Starting root initialization');

// Create a root first, then render
const rootElement = document.getElementById('root')
if (!rootElement) {
  console.error('[main.tsx] Failed to find the root element');
  throw new Error('Failed to find the root element');
}
const root = createRoot(rootElement)

console.log('[main.tsx] Root created, rendering...');

// Render your app immediately
root.render(
  <StrictMode>
    <App />
  </StrictMode>
)
console.log('[main.tsx] App render invoked');

// Register service worker after app renders (non-blocking)
if ('serviceWorker' in navigator) {
  // Use requestIdleCallback if available, otherwise setTimeout
  const registerSW = () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  };

  if ('requestIdleCallback' in window) {
    requestIdleCallback(registerSW);
  } else {
    setTimeout(registerSW, 0);
  }
}

