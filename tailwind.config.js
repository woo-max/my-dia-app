/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // 🚀 테일윈드에게 시스템 설정이 아닌 코드가 주입하는 'dark' 클래스를 감시하라고 명령
  theme: {
    extend: {
      colors: {
        'mint-highlight': 'rgba(168, 230, 207, 0.06)', // 동준님이 원한 6% 민트색
      },
    },
  },
  plugins: [],
}