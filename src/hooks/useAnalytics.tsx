import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AnalyticsEvent {
  page_type: 'profile' | 'book' | 'dashboard' | 'other';
  page_id?: string;
  referrer?: string;
  user_agent?: string;
  session_id?: string;
  visitor_id?: string;
}

// Generate a unique visitor ID that persists across sessions
const getVisitorId = (): string => {
  let visitorId = localStorage.getItem('visitor_id');
  if (!visitorId) {
    visitorId = 'visitor_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    localStorage.setItem('visitor_id', visitorId);
  }
  return visitorId;
};

// Generate a session ID that changes per browser session
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('session_id');
  if (!sessionId) {
    sessionId = 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    sessionStorage.setItem('session_id', sessionId);
  }
  return sessionId;
};

// Get device type from user agent
const getDeviceType = (userAgent: string): string => {
  if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
    return 'tablet';
  }
  if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
    return 'mobile';
  }
  return 'desktop';
};

// Get country from user's timezone (approximation)
const getApproximateCountry = (): string => {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const country = timezone.split('/')[0];
    return country || 'Unknown';
  } catch {
    return 'Unknown';
  }
};

export const trackPageView = async (event: AnalyticsEvent) => {
  try {
    const userAgent = navigator.userAgent;
    const referrer = document.referrer || 'Direct';
    const visitorId = getVisitorId();
    const sessionId = getSessionId();
    const deviceType = getDeviceType(userAgent);
    const country = getApproximateCountry();

    await supabase.from('page_analytics').insert({
      page_type: event.page_type,
      page_id: event.page_id || null,
      referrer,
      user_agent: userAgent,
      visitor_id: visitorId,
      session_id: sessionId,
      device_type: deviceType,
      country,
    });
  } catch (error) {
    // Silently fail - don't break the user experience for analytics
    console.debug('Analytics tracking failed:', error);
  }
};

export const usePageAnalytics = (pageType: AnalyticsEvent['page_type'], pageId?: string) => {
  useEffect(() => {
    trackPageView({
      page_type: pageType,
      page_id: pageId,
    });
  }, [pageType, pageId]);
};

export default usePageAnalytics;