import { useMemo } from 'react';
import { NewsletterStats } from '@/types/newsletter';
import { newsletterService } from '@/services/NewsletterService';

export const useNewsletterStats = (): NewsletterStats => {
  return useMemo(() => {
    return newsletterService.getStats();
  }, []);
};

export const useSubscriberGrowth = (days: number = 30) => {
  return useMemo(() => {
    const subscribers = newsletterService.getSubscribers();
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);
    
    const recentSubscribers = subscribers.filter(s => 
      new Date(s.subscribedAt) >= daysAgo && s.status === 'active'
    );
    
    // Agrupar por dia
    const dailyGrowth: Record<string, number> = {};
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      dailyGrowth[dateKey] = 0;
    }
    
    recentSubscribers.forEach(sub => {
      const dateKey = sub.subscribedAt.split('T')[0];
      if (dailyGrowth[dateKey] !== undefined) {
        dailyGrowth[dateKey]++;
      }
    });
    
    return Object.entries(dailyGrowth)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [days]);
};