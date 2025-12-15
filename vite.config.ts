  import { defineConfig } from 'vite'
  import react from '@vitejs/plugin-react'

  // https://vitejs.dev/config/
  export default defineConfig({
    plugins: [react()],
    
    server: {
      port: 3030, 
       watch: {
        usePolling: true,
        interval: 150
      }
    },
    
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // Separar vendors grandes
            'mui-core': ['@mui/material', '@mui/system', '@emotion/react', '@emotion/styled'],
            'mui-icons': ['@mui/icons-material'],
            'mui-data-grid': ['@mui/x-data-grid'],
            'charts': ['recharts'],
            'pdf': ['@react-pdf/renderer'],
            'supabase': ['@supabase/supabase-js'],
          },
        },
      },
      // Aumentar límite de tamaño de chunk (opcional)
      chunkSizeWarningLimit: 1000,
    },
    
    // Optimizar imports de MUI
    optimizeDeps: {
      include: [
        '@mui/material',
        '@mui/icons-material',
        '@emotion/react',
        '@emotion/styled',
      ],
    },
  })
