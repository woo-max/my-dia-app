import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './', // "파일을 현재 위치에서 찾아라"라는 아주 중요한 명령입니다.
})
