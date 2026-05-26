import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        buildingGallery: "building-gallery.html"
      }
    }
  }
});
