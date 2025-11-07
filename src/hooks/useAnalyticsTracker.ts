import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface TrackPageViewOptions {
  articleId?: string;
  pageTitle?: string;
}

export const useAnalyticsTracker = () => {
  const location = useLocation();

  const trackPageView = async (options: TrackPageViewOptions = {}) => {
    try {
      await supabase.functions.invoke('analytics-tracker', {
        body: {
          page_path: location.pathname,
          page_title: options.pageTitle || document.title,
          article_id: options.articleId,
          referrer: document.referrer,
        },
      });
    } catch (error) {
      // Falhas de tracking não devem interromper a experiência do usuário
      console.error('Failed to track analytics:', error);
    }
  };

  // Auto-track em mudanças de rota
  useEffect(() => {
    trackPageView();
  }, [location.pathname]);

  return { trackPageView };
};
