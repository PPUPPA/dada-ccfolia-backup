import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // 깃허브 레포지토리 이름과 통일
  base: '/dada-ccfolia-backup/',
})
