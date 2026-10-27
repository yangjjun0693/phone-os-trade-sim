import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Values are backed by CSS variables in styles/tokens.css so that the
        // dark/light theme can swap without re-rendering Tailwind classes.
        // Per-app colour identity, set by AppWindow from the app registry.
        app: 'rgb(var(--app-accent) / <alpha-value>)',
        ios: {
          bg: 'rgb(var(--ios-bg) / <alpha-value>)',
          surface: 'rgb(var(--ios-surface) / <alpha-value>)',
          elevated: 'rgb(var(--ios-elevated) / <alpha-value>)',
          text: 'rgb(var(--ios-text) / <alpha-value>)',
          muted: 'rgb(var(--ios-muted) / <alpha-value>)',
          separator: 'rgb(var(--ios-separator) / <alpha-value>)',
          accent: 'rgb(var(--ios-accent) / <alpha-value>)',
          green: 'rgb(var(--ios-green) / <alpha-value>)',
          red: 'rgb(var(--ios-red) / <alpha-value>)',
          orange: 'rgb(var(--ios-orange) / <alpha-value>)',
          blue: 'rgb(var(--ios-blue) / <alpha-value>)',
          purple: 'rgb(var(--ios-purple) / <alpha-value>)',
          yellow: 'rgb(var(--ios-yellow) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Inter Variable',
          'Inter',
          'system-ui',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      borderRadius: {
        squircle: '22.37%',
      },
      spacing: {
        safe: 'env(safe-area-inset-bottom)',
      },
      transitionTimingFunction: {
        ios: 'cubic-bezier(0.32, 0.72, 0, 1)',
        'ios-in': 'cubic-bezier(0.4, 0, 0.2, 1)',
        overshoot: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        jiggle: {
          '0%, 100%': { transform: 'rotate(-1.2deg) scale(1)' },
          '50%': { transform: 'rotate(1.2deg) scale(1.01)' },
        },
        riseIn: {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        jiggle: 'jiggle 0.28s ease-in-out infinite',
        'rise-in': 'riseIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
};

export default config;
