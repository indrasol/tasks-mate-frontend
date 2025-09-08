import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
// import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode`
  // Use '' to load from process.env
  const env = loadEnv(mode, process.cwd(), '');
  
  console.log(`Running in ${mode} mode`);
  
  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      // mode === 'development' &&
      // componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});

// import { defineConfig, loadEnv } from 'vite';
// import react from '@vitejs/plugin-react-swc';
// import { VitePWA } from 'vite-plugin-pwa';
// import path from 'path';

// export default defineConfig(({ mode }) => {
//   const env = loadEnv(mode, process.cwd(), '');

//   return {
//     server: {
//       host: '::',
//       port: 8080,
//     },
//     plugins: [
//       react(),
//       VitePWA({
//         registerType: 'autoUpdate',
//         includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
//         manifest: {
//           name: 'My Awesome PWA',
//           short_name: 'MyPWA',
//           description: 'My Vite + React + TS Progressive Web App',
//           theme_color: '#ffffff',
//           background_color: '#ffffff',
//           display: 'standalone',
//           start_url: '/',
//           icons: [
//             {
//               src: '/icons/icon-192x192.png',
//               sizes: '192x192',
//               type: 'image/png',
//             },
//             {
//               src: '/icons/icon-512x512.png',
//               sizes: '512x512',
//               type: 'image/png',
//             },
//             {
//               src: '/icons/icon-512x512.png',
//               sizes: '512x512',
//               type: 'image/png',
//               purpose: 'any maskable',
//             },
//           ],
//         },
//         workbox: {
//           globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
//           runtimeCaching: [
//             {
//               urlPattern: ({ request }) => request.destination === 'document',
//               handler: 'NetworkFirst',
//               options: {
//                 cacheName: 'html-cache',
//               },
//             },
//             {
//               urlPattern: ({ request }) =>
//                 ['style', 'script', 'worker'].includes(request.destination),
//               handler: 'StaleWhileRevalidate',
//               options: {
//                 cacheName: 'asset-cache',
//               },
//             },
//             {
//               urlPattern: ({ url }) => url.origin === self.location.origin,
//               handler: 'StaleWhileRevalidate',
//               options: {
//                 cacheName: 'local-cache',
//               },
//             },
//           ],
//         },
//         devOptions: {
//           enabled: true,
//         },
//       }),
//     ],
//     resolve: {
//       alias: {
//         '@': path.resolve(__dirname, './src'),
//       },
//     },
//     build: {
//       sourcemap: false,
//     },
//   };
// });
