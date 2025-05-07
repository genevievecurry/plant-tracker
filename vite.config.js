import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "https://genevievecurry.github.io/plant-tracker/",
  build: {
    outDir: "docs", // Change output directory to 'docs'
    emptyOutDir: true, // Clear the output directory before building
  },
});
