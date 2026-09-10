import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { host: "0.0.0.0", port: 4173, allowedHosts: ["terminal.local"] },
  build: {
    rollupOptions: {
      output: { manualChunks: { three: ["three", "@react-three/fiber"] } },
    },
  },
});
