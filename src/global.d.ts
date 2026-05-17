import type { DetailedHTMLProps, HTMLAttributes } from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'spline-viewer': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        url?: string;
        logo?: string;
        hint?: string;
        loading?: string;
        'loading-anim'?: boolean;
        'events-target'?: string;
      };
    }
  }
}
