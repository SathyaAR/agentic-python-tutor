/** @type {import('tailwindcss').Config} */
// Design tokens from frontend-spec.md §7.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#F5F7FA',
        surface: '#FFFFFF',
        primary: { DEFAULT: '#306998', hover: '#244F76' },
        accent: '#FFD43B',
        text: { DEFAULT: '#1F2933', muted: '#6B7785' },
        border: '#DDE3EA',
        success: '#2E7D32',
        error: '#C0392B',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
