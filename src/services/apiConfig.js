// Dynamic API Base URL resolution:
// 1. In Production on Vercel: relative path '' (e.g. /api/chat -> handled by Vercel Serverless Function)
// 2. In Android APK (file:///): connect to local network PC (http://192.168.178.168:3001) with fallback to Vercel
// 3. In Local Dev (localhost:5173): connect to http://localhost:3001

export function getApiBaseUrl() {
  if (typeof window !== 'undefined') {
    // Wenn in der Android APK (geladen über file:///)
    if (window.location.protocol === 'file:' || !window.location.hostname) {
      return 'http://192.168.178.168:3001';
    }
    
    // Wenn über Vercel aufgerufen (z.B. auraai-fawn.vercel.app oder jede andere Web-Domain)
    if (window.location.hostname && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')) {
      return ''; // Relative URLs -> Vercel Serverless Handler /api/*
    }
    
    return 'http://localhost:3001';
  }
  return '';
}
