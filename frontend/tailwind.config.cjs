/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#174D35',
        secondary: '#26734D',
        accent: '#E98A35',
        background: '#F4F7F4',
        surface: {
          DEFAULT: '#FFFFFF',
          'container-low': '#F9FBF9',
        },
        'primary-text': '#202B24',
        'secondary-text': '#68756C',
        border: '#E2E8E3',
        success: '#22C55E',
        danger: '#EF4444',
        warning: '#F59E0B',
        info: '#3B82F6',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
