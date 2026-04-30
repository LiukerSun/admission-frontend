import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    sourcemap: false,
    target: 'esnext',
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'react-vendor',
              test: /node_modules[\\/](react|react-dom|react-router-dom|zustand)[\\/]/,
              priority: 30,
            },
            {
              name: 'antd-vendor',
              test: /node_modules[\\/](@ant-design|antd|rc-|@rc-component)[\\/]/,
              maxSize: 450 * 1024,
              priority: 20,
            },
            {
              name: 'echarts-vendor',
              test: /node_modules[\\/](echarts|zrender)[\\/]/,
              maxSize: 450 * 1024,
              priority: 20,
            },
            {
              name: 'vendor',
              test: /node_modules[\\/]/,
              priority: 10,
            },
          ],
        },
      },
    },
  },
})
