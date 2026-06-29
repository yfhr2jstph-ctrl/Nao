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
        // カード「画像」だけをオフライン用にキャッシュする。
        // API のJSON（api.tcgdex.net）はキャッシュせず常に最新を取りに行く
        // （CacheFirst にすると検索結果が古いまま固定されてしまうため）。
        runtimeCaching: [
          {
            urlPattern: ({ url, request }) =>
              url.hostname.includes("tcgdex") && request.destination === "image",
            handler: "CacheFirst",
            options: {
              cacheName: "tcgdex-images",
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
});
