
// Global type definitions
interface Window {
  grecaptcha?: {
    ready: (callback: () => void) => void;
    execute: (siteKey: string, options: { action: string }) => Promise<string>;
    render: (container: string | HTMLElement, parameters: object) => string | number;
  };
  hcaptcha?: {
    render: (element: HTMLElement | string, options: any) => number;
    reset: (widgetId?: number) => void;
    execute: (widgetId?: number) => void;
    ready: (callback: () => void) => void;
  };
  onloadCallback?: () => void;
  gm_authFailure?: () => void;
}
