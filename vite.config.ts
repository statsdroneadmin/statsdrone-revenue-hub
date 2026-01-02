import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { execSync } from "node:child_process";

function generateStaticEpisodes() {
  return {
    name: "generate-static-episodes",
    apply: "build" as const,
    closeBundle() {
      // Generate into the final build output so Cloudflare Pages can serve /ep/:slug/index.html
      execSync("node scripts/generate-episodes.mjs --outDir dist", { stdio: "inherit" });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    generateStaticEpisodes(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
