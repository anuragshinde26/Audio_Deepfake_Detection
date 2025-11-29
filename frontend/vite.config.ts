import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    // proxy API requests to your FastAPI backend during development
    proxy: {
      // forward any request starting with /predict to backend:8000
      "/predict": {
        target: "http://localhost:8000",
        changeOrigin: true,
        secure: false,
      },
      "/predict-url": {
        target: "http://localhost:8000",
        changeOrigin: true,
        secure: false,
      },
      // static files served by backend (optional)
      "/static": {
        target: "http://localhost:8000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
