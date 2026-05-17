import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV === 'development';

// Base headers — applied to every route (no CSP here)
const baseHeaders = [
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  ...(isDev
    ? []
    : [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]),
];

// Strict CSP — applied ONLY to dashboard routes (sensitive user data)
// Marketing pages intentionally have no CSP so Spline, analytics etc work freely
const dashboardCSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://accounts.google.com https://www.googletagmanager.com https://checkout.razorpay.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  `connect-src 'self' ${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'} https://accounts.google.com wss: https://api.razorpay.com`,
  "frame-src https://accounts.google.com https://api.razorpay.com https://checkout.razorpay.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  ...(isDev ? [] : ['upgrade-insecure-requests']),
].join('; ');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'supabase.co' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },  // Google profile pics
      { protocol: 'https', hostname: 'prod.spline.design' },
      { protocol: 'https', hostname: 'b9automation.com' },
      { protocol: 'https', hostname: 'cdn.b9automation.com' },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  headers: async () => [
    // Base security headers on every page
    {
      source: '/(.*)',
      headers: baseHeaders,
    },
    // Strict CSP only on dashboard (user data, auth-protected)
    {
      source: '/dashboard/:path*',
      headers: [
        { key: 'Content-Security-Policy', value: dashboardCSP },
      ],
    },
    // CORS for public widget embed script
    {
      source: '/api/widget/:path*',
      headers: [
        { key: 'Access-Control-Allow-Credentials', value: 'true' },
        { key: 'Access-Control-Allow-Origin', value: '*' },
        { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,POST' },
        { key: 'Access-Control-Allow-Headers', value: 'X-Requested-With, Accept, Content-Type, X-BrainAI-Visitor-Id' },
      ],
    },
  ],

  redirects: async () => [],
  rewrites: async () => [],

  webpack: (config, { isServer }) => {
    if (!isServer) {
      const splitChunks = config.optimization?.splitChunks;
      if (splitChunks && typeof splitChunks !== 'boolean') {
        splitChunks.cacheGroups = {
          ...splitChunks.cacheGroups,
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: 'react',
            priority: 10,
          },
        };
      }
    }
    return config;
  },
};

// Wrap with Sentry only when the package is installed and DSN is configured.
// Run `npm install` after adding @sentry/nextjs to package.json to enable.
let exportedConfig: NextConfig = nextConfig;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { withSentryConfig } = require('@sentry/nextjs');
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    exportedConfig = withSentryConfig(nextConfig, {
      silent: true,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
    });
  }
} catch {
  // @sentry/nextjs not installed yet — skip
}

export default exportedConfig;
