import type { DetailedHTMLProps, HTMLAttributes } from 'react';

// CSS module declarations — fixes "Cannot find module" for side-effect CSS imports
declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

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
