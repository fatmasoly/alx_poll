export function getClientBaseUrl(): string {
  // In the browser, we can use window.location
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  // Fallback for SSR
  return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
}
