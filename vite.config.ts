import { copyFileSync } from "fs"
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, type Plugin } from "vite"
import { VitePWA } from "vite-plugin-pwa"

// GitHub Pages отдаёт 404 на прямые ссылки SPA — дублируем index.html в 404.html.
function spaFallback(): Plugin {
  return {
    name: "spa-404-fallback",
    closeBundle() {
      const dist = path.resolve(__dirname, "dist")
      copyFileSync(path.join(dist, "index.html"), path.join(dist, "404.html"))
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: "/habit-tracker/",
  plugins: [
    react(),
    tailwindcss(),
    spaFallback(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: ["favicon.svg"],
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,svg,woff2}"],
      },
      devOptions: {
        enabled: true,
        type: "module",
      },
      manifest: {
        name: "Трекер привычек",
        short_name: "Привычки",
        description: "Трекер привычек",
        theme_color: "#000000",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/habit-tracker/",
        scope: "/habit-tracker/",
        icons: [
          {
            src: "favicon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
