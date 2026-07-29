declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

// Safe wrapper around the Meta Pixel: no-ops during SSR or if the
// pixel script is blocked / not loaded yet.
export function fbTrack(event: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  window.fbq?.("track", event, params);
}
