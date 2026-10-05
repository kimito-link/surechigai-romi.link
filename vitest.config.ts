import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  // ★JSX は automatic runtime で変換する（2026-10-05）。
  //   tsconfig（expo/tsconfig.base）の "jsx": "react-native" を esbuild が classic 変換と解釈し、
  //   `React` を import していないコンポーネント（Metro では babel-preset-expo が自動注入する）を
  //   vitest で描画すると "ReferenceError: React is not defined" になる。
  //   Metro と同じ automatic に揃えることで、.tsx のコンポーネントをそのまま描画テストできる
  //   （__tests__/kimito-dashboard-link.test.tsx が最初の利用者）。
  esbuild: { jsx: "automatic" },
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.test.ts", "**/*.test.tsx"],
    exclude: [
      "node_modules",
      "dist",
      ".expo",
      // Claude Code のサブエージェント用worktree配下（別ブランチの独立チェックアウト）。
      // 除外しないと、そこにある node_modules 経由の依存や別ブランチのテストまで
      // 拾って本体の結果に混ざり、偽陽性の失敗として報告される（2026-07-05発覚）。
      ".claude/worktrees/**",
      // ★他リポが誤ってこのリポ直下にクローンされたときの巻き添えを防ぐ（2026-09-20 実損）。
      // line-bot/ が入れ子で出現し、その320件のテストを拾って 113→433 ファイルに膨らみ、
      // 依存未インストールのため81ファイルが失敗＝本体が緑でも赤く見える状態になった。
      // tsconfig.json の exclude にも同じ理由で line-bot を入れてある。
      "line-bot/**",
      // Expo/RN のネイティブモジュールに強く依存し CI で落ちるため一時除外
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
