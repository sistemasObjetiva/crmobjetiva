  import { defineConfig } from 'vite'
  import react from '@vitejs/plugin-react'
  import { VitePWA } from 'vite-plugin-pwa'

  // https://vitejs.dev/config/
  export default defineConfig({
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          name: 'CRM Objetiva',
          short_name: 'CRM',
          description: 'Sistema CRM con soporte offline',
          theme_color: '#1976d2',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'supabase-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 // 24 horas
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        },
        devOptions: {
          enabled: true,
          type: 'module'
        }
      })
    ],
    
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
            'mui-core': ['@mui/material', '@emotion/react', '@emotion/styled'],
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
      commonjsOptions: {
        include: [/node_modules/],
        transformMixedEsModules: true,
      },
    },
    
    // Resolver correctamente supabase-js
    resolve: {
      alias: {
        '@supabase/supabase-js': '@supabase/supabase-js/dist/module/index.js',
      },
    },
    
    // Optimizar imports de MUI
    optimizeDeps: {
      include: [
        '@mui/material',
        '@mui/icons-material',
        '@emotion/react',
        '@emotion/styled',
        'dexie',
        'dexie-react-hooks',
        '@supabase/supabase-js',
      ],
      esbuildOptions: {
        target: 'es2020',
      },
    },
  })
