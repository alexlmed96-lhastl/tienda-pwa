import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        // Límite de 5 MB para permitir precaché de ExcelJS y jsPDF
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
      },
    }),
  ],
  build: {
    chunkSizeWarningLimit: 2500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/exceljs')) return 'excel';
          if (id.includes('node_modules/jspdf') || id.includes('node_modules/jspdf-autotable')) return 'pdf';
          if (id.includes('node_modules/html5-qrcode')) return 'scanner';
          if (id.includes('node_modules/@supabase')) return 'supabase';
        },
      },
    },
  },
});