/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#172D45',
          50: '#F0F4F8',
          100: '#D9E2EC',
          200: '#BCCCDC',
          600: '#203A58',
          700: '#1B2D42',
          800: '#172D45',
          900: '#122336',
          950: '#0C1724',
        },
        navy: {
          950: '#0C1724',
          900: '#172D45',
          800: '#1E3550',
          700: '#2A4666',
          600: '#3A5C85',
        },
        accent: {
          DEFAULT: '#5267D8',
          50: '#EEF0FB',
          100: '#DCE1F7',
          500: '#5267D8',
          600: '#4355BE',
          700: '#3543A4',
        },
        indigo: {
          50: '#EEF0FB',
          100: '#DCE1F7',
          500: '#5267D8',
          600: '#4355BE',
          700: '#3543A4',
        },
        surface: '#F7F8FA',
        card: '#FFFFFF',
        brandText: '#202938',
        brandMuted: '#778195',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'premium': '0 4px 20px -2px rgba(23, 45, 69, 0.08), 0 2px 6px -1px rgba(23, 45, 69, 0.04)',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '20px',
      }
    },
  },
  plugins: [],
}
