import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/nursetech.github.io/',
  plugins: [react()],
})
