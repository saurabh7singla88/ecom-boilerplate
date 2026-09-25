import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  // Served from /admin/ behind the CloudFront Router, so assets must resolve under it.
  base: "/admin/",
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true,
    // Same single-domain setup as production: /api/* goes to the API.
    proxy: { "/api": "http://localhost:9000" },
  },
});
