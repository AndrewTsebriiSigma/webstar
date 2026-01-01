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
        // CREATOR OS - Electric Blue (Primary Accent)
        blue: {
          DEFAULT: '#00C2FF',
          hover: '#33D1FF',
          pressed: '#007EA7',
          light: '#5dd9ff',
        },
        
        // Background Colors
        bg: {
          app: '#111111',
          surface1: '#1A1A1A',
          surface2: '#222222',
          surface3: '#2A2A2A',
        },
        
        // Text Colors
        text: {
          primary: '#F5F5F5',
          secondary: '#A0A0A0',
          tertiary: '#707070',
        },
        
        // Semantic Colors
        success: '#00FF87',
        error: '#FF3B5C',
        warning: '#FFB800',
        
        // Legacy compatibility
        primary: {
          DEFAULT: '#00C2FF',
          50: '#e0f7ff',
          100: '#b8edff',
          200: '#8be3ff',
          300: '#5dd9ff',
          400: '#2fd0ff',
          500: '#00C2FF',
          600: '#00a8e0',
          700: '#008ec2',
          800: '#0074a3',
          900: '#005a85',
        },
        dark: {
          DEFAULT: '#111111',
          50: '#F5F5F5',
          100: '#e5e5e5',
          200: '#d4d4d4',
          300: '#A0A0A0',
          400: '#737373',
          500: '#525252',
          600: '#404040',
          700: '#2A2A2A',
          800: '#222222',
          900: '#1A1A1A',
          950: '#111111',
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
      spacing: {
        '0': '0px',
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
      },
      borderRadius: {
        'sm': '12px',
        'md': '16px',
        'lg': '20px',
        'xl': '24px',
        'pill': '999px',
        'full': '9999px',
      },
      fontSize: {
        'h1': ['26px', { lineHeight: '32px', fontWeight: '600' }],
        'h2': ['18px', { lineHeight: '24px', fontWeight: '600' }],
        'body': ['15px', { lineHeight: '22px', fontWeight: '400' }],
        'meta': ['13px', { lineHeight: '18px', fontWeight: '400' }],
        'caption': ['12px', { lineHeight: '16px', fontWeight: '400' }],
        'button': ['15px', { lineHeight: '20px', fontWeight: '600' }],
      },
      width: {
        'container': '420px',
        'container-lg': '480px',
      },
      height: {
        'topbar': '56px',
        'icon-button': '44px',
        'avatar': '120px',
        'cover': '170px',
        'primary-btn': '46px',
        'card-min': '90px',
        'tab': '44px',
      },
      boxShadow: {
        'sm': '0 2px 8px rgba(0, 0, 0, 0.15)',
        'md': '0 8px 32px rgba(0, 0, 0, 0.25)',
        'card': '0 12px 30px rgba(0, 0, 0, 0.45)',
        'fab': '0 16px 40px rgba(0, 0, 0, 0.55)',
        'glow': '0 0 24px rgba(0, 194, 255, 0.4)',
        'glow-sm': '0 4px 16px rgba(0, 194, 255, 0.3)',
        'glow-lg': '0 6px 24px rgba(0, 194, 255, 0.4)',
      },
    },
  },
  plugins: [],
}
export default config

