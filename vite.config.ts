import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// GitHub Pages のプロジェクトサイトでは "/<repo>/" をベースにする必要がある。
// デプロイ時は BASE_PATH=/nao/ のように渡す（ローカルは "/"）。
const base = process.env.BASE_PATH || "/";

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "ポケカ コレクション",
        short_name: "ポケカ",
        description: "ポケモンカードのコレクション管理・検索アプリ",
        theme_color: "#ffcb05",
        background_color: "#1b1d29",
        display: "standalone",
        lang: "ja",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // カード画像（TCGdex CDN）はオフライン用にキャッシュする
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.hostname.includes("tcgdex"),
            handler: "CacheFirst",
            options: {
              cacheName: "tcgdex-assets",
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
});
