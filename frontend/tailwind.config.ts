import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e0f7ff',
          100: '#b8edff',
          200: '#8be3ff',
          300: '#5dd9ff',
          400: '#2fd0ff',
          500: '#00C2FF', // webSTAR blue
          600: '#00a8e0',
          700: '#008ec2',
          800: '#0074a3',
          900: '#005a85',
        },
        accent: {
          50: '#e0f7ff',
          100: '#b8edff',
          200: '#8be3ff',
          300: '#5dd9ff',
          400: '#2fd0ff',
          500: '#00C2FF',
          600: '#0EA5E9',
          700: '#0284c7',
          800: '#0369a1',
          900: '#075985',
        },
        dark: {
          DEFAULT: '#111111',
          50: '#f5f5f5',
          100: '#e5e5e5',
          200: '#d4d4d4',
          300: '#a3a3a3',
          400: '#737373',
          500: '#525252',
          600: '#404040',
          700: '#262626',
          800: '#1a1a1a',
          900: '#111111',
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          750: '#2d3748',
          800: '#1f2937',
          850: '#1a202c',
          900: '#111827',
          950: '#0a0a0a',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(0, 194, 255, 0.5)',
        'glow-sm': '0 0 10px rgba(0, 194, 255, 0.3)',
        'glow-lg': '0 0 30px rgba(0, 194, 255, 0.6)',
      },
    },
  },
  plugins: [],
}
export default config

