import { useEffect } from 'react';

export const usePerformance = () => {
  useEffect(() => {
    // Measure page load performance
    if (typeof window !== 'undefined' && 'performance' in window) {
      window.addEventListener('load', () => {
        const perfData = window.performance.timing;
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
        
        console.log('Page Load Time:', pageLoadTime, 'ms');

        // Log Core Web Vitals
        if ('web-vital' in window) {
          console.log('Core Web Vitals:', window['web-vital']);
        }
      });
    }

    // Prefetch critical resources
    const prefetchLink = document.createElement('link');
    prefetchLink.rel = 'prefetch';
    prefetchLink.as = 'image';
    prefetchLink.href = '/favicon.ico';
    document.head.appendChild(prefetchLink);
  }, []);
};

export const useImageLazy = (imageRef: React.RefObject<HTMLImageElement>) => {
  useEffect(() => {
    if (!imageRef.current) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        img.src = img.dataset.src || '';
        observer.unobserve(img);
      }
    });

    observer.observe(imageRef.current);

    return () => observer.disconnect();
  }, [imageRef]);
};