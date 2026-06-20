import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const chunkGroups = {
  'react-vendor': ['react', 'react-dom', 'react-router-dom', 'react-redux', '@reduxjs/toolkit'],
  firebase: ['firebase/'],
  maps: ['@react-google-maps/api'],
  charts: ['recharts']
};

const manualChunks = (id) => {
  if (!id.includes('node_modules')) return undefined;

  for (const [chunkName, matchers] of Object.entries(chunkGroups)) {
    if (matchers.some((matcher) => id.includes(matcher))) {
      return chunkName;
    }
  }

  return 'vendor';
};

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks
      }
    }
  },
  server: {
    port: 5173
  },
  preview: {
    port: 4173
  }
});
