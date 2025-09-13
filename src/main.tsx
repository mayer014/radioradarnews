import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ENV } from "./config/environment";
import { enforceHTTPS } from "./utils/securityHelpers";

// Enforce HTTPS in production
if (ENV.IS_PRODUCTION) {
  enforceHTTPS();
}

// Performance optimization: preload critical resources
if (ENV.IS_PRODUCTION) {
  // Preload Supabase connection
  import("@/integrations/supabase/client").then(() => {
    console.log("Supabase client preloaded");
  });
}

// Service Worker registration for production
if (ENV.ENABLE_SERVICE_WORKER && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Error boundary for unhandled errors
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  // In production, you might want to send this to an error tracking service
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  // In production, you might want to send this to an error tracking service
});

const container = document.getElementById("root");

if (!container) {
  throw new Error("Root element not found");
}

const root = createRoot(container);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
