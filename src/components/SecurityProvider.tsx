import React, { useEffect } from 'react';
import { generateCSPHeader, enforceHTTPS } from '@/utils/securityHelpers';

interface SecurityProviderProps {
  children: React.ReactNode;
}

/**
 * Security provider that enforces security policies on the client
 */
export const SecurityProvider: React.FC<SecurityProviderProps> = ({ children }) => {
  useEffect(() => {
    // Enforce HTTPS in production
    if (import.meta.env.PROD) {
      enforceHTTPS();
    }

    // Set CSP header meta tag for client-side enforcement
    const cspMetaTag = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (!cspMetaTag && import.meta.env.PROD) {
      const meta = document.createElement('meta');
      meta.httpEquiv = 'Content-Security-Policy';
      meta.content = generateCSPHeader();
      document.head.appendChild(meta);
    }

    // Add security headers meta tags
    const addMetaTag = (name: string, content: string) => {
      if (!document.querySelector(`meta[name="${name}"]`)) {
        const meta = document.createElement('meta');
        meta.name = name;
        meta.content = content;
        document.head.appendChild(meta);
      }
    };

    // Security headers
    addMetaTag('referrer', 'strict-origin-when-cross-origin');
    addMetaTag('permissions-policy', 'geolocation=(), microphone=(), camera=()');
    
    // X-Frame-Options equivalent
    if (!document.querySelector('meta[name="frame-options"]')) {
      const meta = document.createElement('meta');
      meta.name = 'frame-options';
      meta.content = 'DENY';
      document.head.appendChild(meta);
    }

  }, []);

  return <>{children}</>;
};

export default SecurityProvider;