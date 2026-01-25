import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { execSync } from "node:child_process";
import fs from "node:fs";

function generateStaticEpisodes() {
  return {
    name: "generate-static-episodes",
    apply: "build" as const,
    closeBundle() {
      // Rename Vite's index.html to spa.html so it doesn't override static-index.html routing
      const distDir = path.resolve(__dirname, "dist");
      const spaSource = path.join(distDir, "index.html");
      const spaDest = path.join(distDir, "spa.html");
      if (fs.existsSync(spaSource)) {
        fs.renameSync(spaSource, spaDest);
        console.log("✅ Renamed dist/index.html to dist/spa.html");
      }

      // Generate static episode pages
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
