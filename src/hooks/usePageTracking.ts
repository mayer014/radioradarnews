import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

// Generate a simple hash for visitor identification
const generateVisitorHash = (): string => {
  const data = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    new Date().getTimezoneOffset(),
  ].join('|');
  
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
};

// Get device type
const getDeviceType = (): string => {
  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return 'mobile';
  return 'desktop';
};

// Get or create session ID
const getSessionId = (): string => {
  const key = 'rrn_session_id';
  let sessionId = sessionStorage.getItem(key);
  if (!sessionId) {
    sessionId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem(key, sessionId);
  }
  return sessionId;
};

// Check if this is a unique visit in this session
const isUniqueVisit = (pagePath: string): boolean => {
  const key = 'rrn_visited_pages';
  const visited = JSON.parse(sessionStorage.getItem(key) || '[]');
  if (visited.includes(pagePath)) {
    return false;
  }
  visited.push(pagePath);
  sessionStorage.setItem(key, JSON.stringify(visited));
  return true;
};

// Extract article ID from path if applicable
const extractArticleId = (path: string): string | null => {
  const match = path.match(/\/artigo\/([a-f0-9-]+)/i);
  return match ? match[1] : null;
};

export const usePageTracking = () => {
  const location = useLocation();
  const lastTrackedPath = useRef<string>('');

  useEffect(() => {
    const trackPageView = async () => {
      const currentPath = location.pathname;
      
      // Avoid tracking the same page multiple times in quick succession
      if (currentPath === lastTrackedPath.current) {
        return;
      }
      
      // Don't track admin pages
      if (currentPath.startsWith('/admin')) {
        return;
      }

      lastTrackedPath.current = currentPath;

      try {
        const visitorHash = generateVisitorHash();
        const sessionId = getSessionId();
        const isUnique = isUniqueVisit(currentPath);
        const articleId = extractArticleId(currentPath);

        const trackingData = {
          page_path: currentPath,
          page_title: document.title || null,
          visitor_hash: visitorHash,
          session_id: sessionId,
          is_unique_visit: isUnique,
          device_type: getDeviceType(),
          referrer: document.referrer || null,
          user_agent: navigator.userAgent,
          article_id: articleId,
        };

        const { error } = await supabase
          .from('site_analytics')
          .insert(trackingData);

        if (error) {
          console.error('Analytics tracking error:', error);
        }
      } catch (error) {
        // Silently fail - analytics shouldn't break the app
        console.error('Analytics tracking failed:', error);
      }
    };

    // Small delay to ensure page has loaded
    const timeoutId = setTimeout(trackPageView, 100);
    
    return () => clearTimeout(timeoutId);
  }, [location.pathname]);
};

export default usePageTracking;
