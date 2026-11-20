/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Plus Jakarta Sans',
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Oxygen',
          'Ubuntu',
          'Cantarell',
          'sans-serif',
        ],
      },
      colors: {
        brand: {
          50: '#F1EBFF',
          100: '#E4D7FF',
          200: '#CCB3FF',
          300: '#AD82FF',
          400: '#8F56FF',
          500: '#7138F5',
          600: '#5E24E5',
          700: '#4C18C4',
          800: '#3D159B',
          900: '#32147B',
          950: '#1C0A4A',
        },
        electric: {
          purple: '#7138F5',
          blue: '#2878FF',
          cyan: '#20C8E8',
          soft: '#F1EBFF',
        },
        surface: {
          light: '#F7F8FC',
          card: '#FFFFFF',
          border: '#E7EAF2',
          dark: '#070A18',
          darkCard: '#0F142B',
          darkElevated: '#151C3A',
          darkBorder: '#1E2749',
        },
      },
      backgroundImage: {
        'omni-gradient': 'linear-gradient(135deg, #7138F5 0%, #2878FF 100%)',
        'omni-gradient-tri': 'linear-gradient(135deg, #7138F5 0%, #2878FF 55%, #20C8E8 100%)',
        'omni-soft': 'linear-gradient(135deg, rgba(113,56,245,0.08) 0%, rgba(40,120,255,0.08) 55%, rgba(32,200,232,0.08) 100%)',
        'cosmic-radial': 'radial-gradient(ellipse at top right, rgba(113,56,245,0.22), transparent 55%), radial-gradient(ellipse at bottom left, rgba(32,200,232,0.16), transparent 55%)',
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgb(15 23 42 / 0.04)',
        soft: '0 4px 20px -4px rgb(17 24 39 / 0.06), 0 1px 4px -1px rgb(17 24 39 / 0.04)',
        elevated: '0 16px 40px -10px rgb(17 24 39 / 0.12), 0 4px 12px -4px rgb(17 24 39 / 0.06)',
        'glow-purple': '0 8px 28px -6px rgba(113, 56, 245, 0.42)',
        'glow-blue': '0 8px 28px -6px rgba(40, 120, 255, 0.38)',
        'glow-cyan': '0 8px 28px -6px rgba(32, 200, 232, 0.38)',
        'glow-card': '0 0 0 1px rgba(113, 56, 245, 0.22), 0 12px 36px -12px rgba(40, 120, 255, 0.28)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.65' },
          '50%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.24s ease-out forwards',
        floatSlow: 'floatSlow 6s ease-in-out infinite',
        pulseGlow: 'pulseGlow 3.2s ease-in-out infinite',
        shimmer: 'shimmer 1.8s linear infinite',
        spinSlow: 'spin 20s linear infinite',
      },
    },
  },
  plugins: [],
};
