/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          400: '#818cf8', // بنفش روشن
          500: '#6366f1', // بنفش
          600: '#4f46e5', // بنفش تیره
          700: '#4338ca',
        },
        accent: {
          400: '#60a5fa', // آبی روشن
          500: '#3b82f6', // آبی
        }
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
};