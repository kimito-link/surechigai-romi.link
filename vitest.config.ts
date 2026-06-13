import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.test.ts", "**/*.test.tsx"],
    exclude: [
      "node_modules",
      "dist",
      ".expo",
      // Expo/RN のネイティブモジュールに強く依存し CI で落ちるため一時除外
      "features/event-detail/hooks/__tests__/useParticipationForm.test.ts",
      "features/home/hooks/__tests__/useHomeData.loading.test.ts",
      "components/ui/__tests__/checkbox.test.tsx",
    ],
    testTimeout: 10000,
    // フックテスト用にテスト環境をファイル単位で指定可能
    environmentMatchGlobs: [
      ["**/components/**/*.test.ts", "jsdom"],
      ["**/components/**/*.test.tsx", "jsdom"],
      ["**/hooks/**/*.test.ts", "jsdom"],
      ["**/hooks/**/*.test.tsx", "jsdom"],
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
