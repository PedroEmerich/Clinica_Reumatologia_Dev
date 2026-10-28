import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base relativo: o build funciona no GitHub Pages ou em qualquer subpasta
export default defineConfig({
  base: './',
  plugins: [react()],
})
