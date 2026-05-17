/**
 * Initialize Google Analytics
 */
export const initGA = () => {
  if (typeof window === 'undefined') return;

  const gtagId = process.env.NEXT_PUBLIC_GTAG;
  if (!gtagId) return;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gtagId}`;
  document.head.appendChild(script);

  const analyticsWindow = window as typeof window & {
    dataLayer: unknown[][];
    gtag?: (...args: unknown[]) => void;
  };

  analyticsWindow.dataLayer = analyticsWindow.dataLayer || [];
  function gtag(...args: any[]) {
    analyticsWindow.dataLayer.push(args);
  }
  analyticsWindow.gtag = gtag;
  gtag('js', new Date());
  gtag('config', gtagId);
};

/**
 * Track page views
 */
export const trackPageView = (path: string, title: string) => {
  if (typeof window === 'undefined' || !(window as any).gtag) return;

  (window as any).gtag('event', 'page_view', {
    page_path: path,
    page_title: title,
  });
};

/**
 * Track custom events
 */
export const trackEvent = (
  eventName: string,
  eventData: Record<string, any>
) => {
  if (typeof window === 'undefined' || !(window as any).gtag) return;

  (window as any).gtag('event', eventName, eventData);
};

/**
 * Track conversions
 */
export const trackConversion = (conversionId: string) => {
  if (typeof window === 'undefined' || !(window as any).gtag) return;

  (window as any).gtag('event', 'conversion', {
    conversion_id: conversionId,
  });
};
