import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // bind IPv4 explicitly; the default "localhost" resolved to [::1] only,
    // which browsers that try 127.0.0.1 first cannot reach.
    host: "127.0.0.1",
    // ref/ holds design reference images, not app source. Watching them
    // crashes the dev server with EBUSY when the files are locked.
    watch: { ignored: ["**/ref/**"] },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})