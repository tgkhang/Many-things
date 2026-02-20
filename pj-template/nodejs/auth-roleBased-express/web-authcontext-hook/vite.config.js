/* eslint-disable no-undef */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import svgr from 'vite-plugin-svgr'

// https://vite.dev/config/
export default defineConfig({
  // allow access to process.env
  define: {
    'process.env': process.env
  },
  plugins: [react(), svgr()],
  // base: './',
  resolve: {
    alias: [{
      find: '~', replacement: '/src'
    }]
  }
})
