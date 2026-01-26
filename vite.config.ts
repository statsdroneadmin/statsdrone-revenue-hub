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
      // Move Vite's index.html to _app/index.html so it doesn't override static-index.html routing
      // Using a directory avoids Cloudflare's Pretty URLs redirect behavior
      const distDir = path.resolve(__dirname, "dist");
      const spaSource = path.join(distDir, "index.html");
      const appDir = path.join(distDir, "_app");
      const spaDest = path.join(appDir, "index.html");

      if (fs.existsSync(spaSource)) {
        if (!fs.existsSync(appDir)) {
          fs.mkdirSync(appDir, { recursive: true });
        }
        fs.renameSync(spaSource, spaDest);
        console.log("✅ Moved dist/index.html to dist/_app/index.html");
      }

      // Copy static homepage to dist/index.html (so / works without redirects)
      const staticHomepage = path.join(distDir, "home", "index.html");
      const rootIndex = path.join(distDir, "index.html");
      if (fs.existsSync(staticHomepage)) {
        fs.copyFileSync(staticHomepage, rootIndex);
        console.log("✅ Copied static homepage to dist/index.html");
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
