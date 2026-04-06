import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom', 'react-redux', '@reduxjs/toolkit'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          maps: ['@react-google-maps/api'],
          charts: ['recharts']
        }
      }
    }
  },
  server: {
    port: 5173
  }
});
