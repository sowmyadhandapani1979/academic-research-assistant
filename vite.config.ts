import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    headers: {
      "Permissions-Policy": "microphone=(self), speaker=(self)",
    },
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        configure(proxy) {
          proxy.on("error", (_err, _req, res) => {
            const socket = res as { writeHead?: (code: number, headers: object) => void; end?: (body: string) => void };
            if (typeof socket.writeHead === "function") {
              socket.writeHead(503, { "Content-Type": "application/json" });
              socket.end(
                JSON.stringify({
                  error: "The search API is restarting. Try again in a moment.",
                  code: "api_down",
                }),
              );
            }
          });
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    css: false,
    exclude: ["**/node_modules/**", "**/dist/**", "server/**"],
  },
});
