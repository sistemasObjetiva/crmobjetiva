import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Establece el límite a un valor mayor (por ejemplo, 1000 kB) para que no se muestre la advertencia
    chunkSizeWarningLimit: 1000,
  },
  server: {
    port: 5173, 
  },

})
