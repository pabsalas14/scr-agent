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
