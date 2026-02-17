import { defineConfig } from "vitest/config"; // CHANGE
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// No more "No overload matches" - Vitest's defineConfig knows 'test'
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    globals: true,
    environment: 'jsdom',
  },
});