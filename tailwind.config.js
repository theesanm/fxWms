
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'primary': {
          DEFAULT: '#007BFF',
          dark: '#0056B3',
        },
        'secondary': {
          DEFAULT: '#6C757D',
          light: '#F8F9FA',
          medium: '#E9ECEF',
          dark: '#343A40',
        },
        'success': '#28A745',
        'warning': '#FFC107',
        'danger': '#DC3545',
      },
      container: {
        center: true,
        padding: "2rem",
        screens: {
          "2xl": "1400px",
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)'],
        mono: ['var(--font-geist-mono)'],
      },
    },
  },
  plugins: [],
}




