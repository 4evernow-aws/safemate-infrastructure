import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    host: 'localhost',
    hmr: {
      port: 5173,
      host: 'localhost'
    }
  },
  define: {
    global: 'globalThis',
    'process.env': '{}',
  },
  build: {
    target: 'es2015',
    outDir: 'dist',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      maxParallelFileOps: 5,
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('@mui/icons-material')) {
              return 'mui-icons';
            }
            if (id.includes('@mui')) {
              return 'mui';
            }
            if (id.includes('@aws-amplify') || id.includes('aws-amplify')) {
              return 'aws';
            }
            if (id.includes('@hashgraph')) {
              return 'hedera';
            }
            return 'vendor';
          }
        }
      }
    }
  },
  optimizeDeps: {
    include: [
      '@mui/material',
      '@mui/icons-material',
      '@aws-amplify/ui-react',
      '@hashgraph/sdk'
    ],
    exclude: ['aws-amplify']
  },
  resolve: {
    alias: {
      buffer: 'buffer',
      process: 'process/browser',
      stream: 'stream-browserify',
      crypto: 'crypto-browserify',
      util: 'util',
      assert: 'assert',
      http: 'stream-http',
      https: 'https-browserify',
      os: 'os-browserify/browser',
      path: 'path-browserify',
      fs: false,
      net: false,
      tls: false,
    },
  },
  publicDir: 'public',
  root: '.',
})
