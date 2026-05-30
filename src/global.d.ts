import type { DetailedHTMLProps, HTMLAttributes } from 'react';

// Side-effect CSS import declaration — fixes ts(2882) for import './globals.css'
declare module '*.css' {}

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
