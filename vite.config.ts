import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Bappa Aarti — आरती संग्रह',
        short_name: 'Bappa Aarti',
        description:
          'Aarti, Gajar and Shlok lyrics for singing along during puja. Works offline.',
        lang: 'mr',
        theme_color: '#1a1110',
        background_color: '#1a1110',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        categories: ['lifestyle', 'music'],
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Lyrics, styles and the app shell are precached so the collection is
        // fully usable offline. Audio is deliberately excluded: it always
        // streams, and never occupies the user's storage.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
      },
    }),
  ],
});
