import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Capacitor serves the production bundle from its local WebView origin.
  // Relative URLs keep the same build working in both the browser and APK.
  base: './',
  build: { sourcemap: true }
});
