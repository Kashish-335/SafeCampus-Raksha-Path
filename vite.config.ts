import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['maplibre-gl'],
  },
  server: {
    host: true,
    port: 5173,
  },
});
