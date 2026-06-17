import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // In dev the client talks to the standalone socket server on :3001.
    // Production serves both from the same origin, so no proxy is needed.
  },
});
