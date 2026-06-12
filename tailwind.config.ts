import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#ecfeff', 100: '#cffafe', 200: '#a5f3fc', 300: '#67e8f9',
          400: '#22d3ee', 500: '#00d3ee', 600: '#00a8c2', 700: '#0e7490',
          800: '#155e75', 900: '#164e63',
        },
        accent: {
          cyan: '#00F2FE',
          orange: '#FF5722',
          blue: '#3b82f6',
          emerald: '#10b981',
          amber: '#f59e0b',
          red: '#ef4444',
          violet: '#8b5cf6',
          pink: '#ec4899',
          indigo: '#6366f1',
        },
        dark: {
          50: '#f9fafb', 100: '#f3f4f6', 200: '#e5e7eb',
          500: '#6b7280', 900: '#111827',
        },
        google: {
          blue: '#4285F4', red: '#EA4335', yellow: '#FBBC04',
          green: '#34A853', gray: '#F1F3F4', dark: '#202124',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system'],
        mono: ['Fira Code', 'monospace'],
      },
      transitionTimingFunction: {
        'premium-out': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'premium-in-out': 'cubic-bezier(0.45, 0, 0.15, 1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-in-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
        'gradient-x': 'gradientX 4s ease infinite',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideIn: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        gradientX: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
      },
      backgroundSize: {
        '200': '200% auto',
      },
    },
  },
  plugins: [],
}

export default config
