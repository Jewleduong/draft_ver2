import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/draft_ver2/',
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
