import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@components": path.resolve(__dirname, "src/components"),
      "@assets": path.resolve(__dirname, "src/attached_assets"),
      "@lib": path.resolve(__dirname, "src/lib"),
    },
  },
  server: {
    port: 5173,
    open: true,
    proxy: {
      "/api": {
        target: "https://vdspbck.sabbpe.com",
        changeOrigin: true,
        secure: false,
      },
      "/auth": {
        target: "https://vdspbck.sabbpe.com",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});