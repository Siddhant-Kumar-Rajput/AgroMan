import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          firebase: ["firebase/app", "firebase/auth", "firebase/app-check"],
          motion: ["gsap", "@gsap/react"],
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      manifest: {
        name: "AgroMan",
        short_name: "AgroMan",
        description: "Grounded guidance for your land",
        theme_color: "#193b2a",
        background_color: "#f7f6ef",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/mark.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,woff2}"],
        navigateFallbackDenylist: [/^\/v1\//],
      },
    }),
  ],
  server: {
    proxy: { "/v1": "http://127.0.0.1:8787" },
  },
});
