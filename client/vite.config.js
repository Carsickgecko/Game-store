import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  if (env.VITE_DEPLOY_TARGET === "github-pages") {
    let api;
    try {
      api = new URL(env.VITE_API_URL);
    } catch {
      throw new Error("GitHub Pages requires VITE_API_URL pointing to your public HTTPS backend.");
    }
    if (
      api.protocol !== "https:" ||
      ["localhost", "127.0.0.1", "[::1]"].includes(api.hostname) ||
      api.hostname.endsWith(".azurewebsites.net")
    ) {
      throw new Error("Use a public HTTPS backend outside Azure for this GitHub Pages deployment.");
    }
  }

  return {
    base: env.VITE_BASE_PATH || "/",
    plugins: [react()],
    server: {
      proxy: {
        "/api": "http://localhost:5001",
      },
    },
  };
});
