/**
 * Configuración de Tailwind CSS
 * Tema personalizado para SCR Agent - Business Dark + Orange
 */

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Acento principal
        primary: '#F97316',
        'primary-hover': '#EA6D00',

        // Backgrounds
        'bg-deep': '#111111',
        'bg-surface': '#1C1C1E',
        'bg-elevated': '#242424',
        'bg-card': '#1E1E20',

        // Borders
        'border-subtle': '#2D2D2D',
        'border-bright': '#404040',

        // Severidad
        crítico: '#EF4444',
        alto: '#FB923C',
        medio: '#EAB308',
        bajo: '#22C55E',

        // Acento secundario
        indigo: '#6366F1',
      },
      zIndex: {
        // Standard tailwind zIndex extended for ModalContext
        0: '0',
        10: '10',
        20: '20',
        30: '30',
        40: '40',
        50: '50',
        60: '60',
        70: '70',
        80: '80',
        90: '90',
        100: '100',
        // ModalContext levels (1000 + level * 100)
        1000: '1000',
        1100: '1100',
        1200: '1200',
        1300: '1300',
        1400: '1400',
        1500: '1500',
        1600: '1600',
        1700: '1700',
      },
      spacing: {
        128: '32rem',
        144: '36rem',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};
