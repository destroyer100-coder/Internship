/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#145A4A',
          dark: '#0F4639',
          hover: '#0F4639',
          light: '#E7F0EC',
        },
        sidebar: {
          DEFAULT: '#101C2B',
          hover: '#172638',
          active: '#145A4A',
          border: '#1E2D40',
        },
        surface: {
          main: '#F7F5F0',
          card: '#FFFFFF',
          secondary: '#F1EFE9',
        },
        ink: {
          primary: '#17202A',
          secondary: '#5F6872',
          muted: '#89919A',
          border: '#DEDCD5',
        },
        semantic: {
          success: '#4F8068',
          'success-bg': '#EBF3EF',
          warning: '#B78332',
          'warning-bg': '#FAF2E6',
          error: '#B65D52',
          'error-bg': '#F8EBEA',
          info: '#61758A',
          'info-bg': '#EEF3F8',
          plum: '#765C78',
          'plum-bg': '#F3EDF4',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', '"Outfit"', '"Poppins"', 'sans-serif'],
        poppins: ['"Poppins"', 'sans-serif'],
      },
      borderRadius: {
        card: '18px',
        '2xl': '20px',
        '3xl': '28px',
      },
      boxShadow: {
        card: '0 4px 20px -2px rgba(23, 32, 42, 0.04), 0 2px 6px -1px rgba(23, 32, 42, 0.02)',
        'card-hover': '0 10px 25px -3px rgba(23, 32, 42, 0.08), 0 4px 10px -2px rgba(23, 32, 42, 0.04)',
      },
    },
  },
  plugins: [],
}
