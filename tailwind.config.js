const { createGlobPatternsForDependencies } = require('@nx/angular/tailwind');
const { join } = require('path');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    join(__dirname, 'src/**/!(*.stories|*.spec).{ts,html,scss}'),
    ...createGlobPatternsForDependencies(__dirname),
  ],
  theme: {
    extend: {
      // =======================================================================
      // COLORES - Mapean las CSS custom properties del cliente
      // =======================================================================
      colors: {
        // Paleta primaria (Gris claro)
        'client-primary': {
          DEFAULT: '#A4A7AE',
          light: '#B8BBC2',
          dark: '#90949B',
        },
        // Paleta secundaria
        'client-secondary': {
          DEFAULT: 'var(--inta-secondary)',
          light: 'var(--inta-secondary-light)',
          dark: 'var(--inta-secondary-dark)',
        },
        // Paleta terciaria
        'client-tertiary': {
          DEFAULT: 'var(--inta-tertiary)',
          light: 'var(--inta-tertiary-light)',
          dark: 'var(--inta-tertiary-dark)',
        },
        // Estados
        'client-success': 'var(--inta-success)',
        'client-warning': 'var(--inta-warning)',
        'client-error': 'var(--inta-error)',
        'client-info': 'var(--inta-info)',
        // Superficies
        'client-surface': 'var(--inta-surface)',
        'client-surface-variant': 'var(--inta-surface-variant)',
        'client-background': 'var(--inta-background)',
        // Botones
        'client-button': 'var(--inta-button)',
        'client-button-hover': 'var(--inta-button-hover)',
        // Variantes de botones
        'client-text-button': 'var(--inta-text-button-color)',
        'client-outlined-button': 'var(--inta-outlined-button-color)',
        'client-filled-button': 'var(--inta-filled-button-bg)',
        'client-tonal-button': 'var(--inta-tonal-button-bg)',
        'client-elevated-button': 'var(--inta-elevated-button-bg)',
        'client-icon-button': 'var(--inta-icon-button-color)',
        'client-fab': 'var(--inta-fab-bg)',
        'client-mini-fab': 'var(--inta-mini-fab-bg)',
        'client-extended-fab': 'var(--inta-extended-fab-bg)',
        // Neutros
        'client-neutral': {
          50: 'var(--inta-neutral-50)',
          100: 'var(--inta-neutral-100)',
          200: 'var(--inta-neutral-200)',
          300: 'var(--inta-neutral-300)',
          400: 'var(--inta-neutral-400)',
          500: 'var(--inta-neutral-500)',
          600: 'var(--inta-neutral-600)',
          700: 'var(--inta-neutral-700)',
          800: 'var(--inta-neutral-800)',
          900: 'var(--inta-neutral-900)',
        },
      },
      fontFamily: {
        primary: 'var(--font-family-primary)',
        secondary: 'var(--font-family-secondary)',
      },
      // =======================================================================
      // TIPOGRAFÍA - Familias de fuentes del cliente
      // =======================================================================
      fontFamily: {
        'client-primary': 'var(--inta-font-primary)',
        'client-secondary': 'var(--inta-font-secondary)',
        'client-mono': 'var(--inta-font-mono)',
      },
      // =======================================================================
      // BORDES - Radios personalizados
      // =======================================================================
      borderRadius: {
        'client-sm': 'var(--inta-radius-sm)',
        'client-md': 'var(--inta-radius-md)',
        'client-lg': 'var(--inta-radius-lg)',
        'client-full': 'var(--inta-radius-full)',
      },
      // =======================================================================
      // SOMBRAS - Sombras personalizadas
      // =======================================================================
      boxShadow: {
        'client-sm': 'var(--inta-shadow-sm)',
        'client-md': 'var(--inta-shadow-md)',
        'client-lg': 'var(--inta-shadow-lg)',
      },
    },
  },
  plugins: [],
};
