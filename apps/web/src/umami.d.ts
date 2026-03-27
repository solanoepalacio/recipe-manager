// apps/web/src/umami.d.ts
declare global {
  interface Window {
    umami?: {
      track(eventName: string, data?: Record<string, string | number | boolean>): void;
    };
  }
}
export {};
