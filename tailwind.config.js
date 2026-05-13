/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'mint-highlight': 'rgba(168, 230, 207, 0.06)', // 동준님이 원한 6% 민트색
      },
    },
  },
  plugins: [],
}