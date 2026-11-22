// Dynamic API Base URL resolution:
// 1. In Production on Vercel: relative path '' (e.g. /api/chat -> handled by Vercel Serverless Function)
// 2. In Android APK (file:///): connect directly to live Vercel Cloud Backend (https://auraai-fawn.vercel.app)
// 3. In Local Dev (localhost:5173): connect to http://localhost:3001

export function getApiBaseUrl() {
  if (typeof window !== 'undefined') {
    // Wenn in der Android APK (geladen über file:///) -> IMMER das Live-Vercel-Backend nutzen!
    // Dadurch funktioniert die APK weltweit unterwegs (Unterwegs, Mobile Daten, fremdes WLAN)!
    if (window.location.protocol === 'file:' || !window.location.hostname) {
      return 'https://auraai-fawn.vercel.app';
    }
    
    // Wenn über Vercel im Webbrowser aufgerufen (z.B. auraai-fawn.vercel.app)
    if (window.location.hostname && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')) {
      return ''; // Relative URLs -> Vercel Serverless Handler /api/*
    }
    
    return 'http://localhost:3001';
  }
  return '';
}
