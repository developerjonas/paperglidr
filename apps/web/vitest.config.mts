import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

export default defineConfig({
  // "@/..." imports, from tsconfig.json paths.
  resolve: { tsconfigPaths: true },
  // Next's tsconfig uses jsx: "preserve"; tests run modules directly on
  // Node, so JSX (e.g. the invoice PDF component) must be compiled here.
  oxc: { jsx: { runtime: "automatic" } },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    setupFiles: ["./src/test/setup.ts"],
    // One file at a time: tests share one throwaway database.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 30_000,
    alias: {
      // Payment modules are "server-only"; tests run them directly on Node.
      "server-only": fileURLToPath(new URL("./src/test/serverOnlyStub.ts", import.meta.url)),
    },
  },
})
