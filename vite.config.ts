import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { componentTagger } from "lovable-tagger";
// VitePWA DISABLED — stale SW was serving outdated chunks after every rebuild → silent crash
// Re-enable only after deployment pipeline is fully stabilised
// import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  build: {
    // Production hardening
    sourcemap: false,        // no source maps in prod — no code leaks
    minify: "esbuild",
    target: "es2020",
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Chunk splitting for optimal loading
        manualChunks: {
          vendor:  ["react", "react-dom", "react-router-dom"],
          supabase: ["@supabase/supabase-js"],
          ui:      ["@radix-ui/react-dialog", "@radix-ui/react-tabs", "@radix-ui/react-dropdown-menu"],
          charts:  ["recharts"],
          motion:  ["framer-motion"],
          sentry:  ["@sentry/react"],
        },
      },
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    // VitePWA removed — see comment above
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
  },
}));
