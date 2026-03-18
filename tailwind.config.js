/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Custom brand palette
        platform: {
          DEFAULT: '#3B82F6', // blue-500
          light: '#EFF6FF',   // blue-50
          dark: '#1D4ED8',    // blue-700
        },
        battery: {
          DEFAULT: '#10B981', // emerald-500
          light: '#ECFDF5',   // emerald-50
          dark: '#065F46',    // emerald-800
        },
        fleet: {
          DEFAULT: '#F59E0B', // amber-500
          light: '#FFFBEB',   // amber-50
          dark: '#92400E',    // amber-800
        },
      },
    },
  },
  plugins: [],
};
