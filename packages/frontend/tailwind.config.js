/**
 * Configuración de Tailwind CSS
 * Tema personalizado para SCR Agent
 */

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /**
         * Colores de severidad
         * Alineados con OWASP
         */
        crítico: '#dc2626', // Red
        alto: '#ea580c', // Orange
        medio: '#eab308', // Yellow
        bajo: '#22c55e', // Green
      },
      spacing: {
        128: '32rem',
        144: '36rem',
      },
    },
  },
  plugins: [],
};
