/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    // Colores primarios
    {
      pattern: /(bg|text|border|ring|from|to|via|hover:bg|hover:text|hover:border|hover:from|hover:to|hover:via)-(blue|indigo|red|green|yellow|orange|pink|purple|gray|cyan|teal|lime|stone|zinc|neutral)-(50|100|200|300|400|500|600|700|800|900)/,
    },
    // Gradientes
    {
      pattern: /bg-gradient-to-(r|l|t|b|tr|tl|br|bl)/,
    },
    {
      pattern: /(from|to|via|hover:from|hover:to|hover:via)-(blue|indigo|red|green|yellow|orange|pink|purple|gray|cyan|teal|lime|stone|zinc|neutral)-(50|100|200|300|400|500|600|700|800|900)/,
    },
    // Fuentes
    {
      pattern: /font-(sans|serif|mono|inter|roboto|montserrat)/,
    },
    // Tamaños de fuente
    {
      pattern: /text-(xs|sm|base|lg|xl|2xl|3xl)/,
    }
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1d4ed8',
        secondary: '#9333ea',
        accent: '#10b981',
        gray: {
          25: '#fcfcfc',
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      animation: {
        'gradient-x': 'gradient-x 15s ease infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
      },
      keyframes: {
        'gradient-x': {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          },
        },
        'float': {
          '0%, 100%': {
            transform: 'translateY(0)',
          },
          '50%': {
            transform: 'translateY(-10px)',
          },
        },
        'shimmer': {
          '0%': {
            'background-position': '-1000px 0',
          },
          '100%': {
            'background-position': '1000px 0',
          },
        },
      },
    },
  },
  plugins: [],
};