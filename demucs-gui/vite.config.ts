import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/process': 'http://localhost:5000',
      '/download': 'http://localhost:5000'
    }
  }
});