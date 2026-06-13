// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat.js");
const localRules = require("./eslint-local-rules/index.cjs");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*", "scripts/*"],
  },
  {
    files: ["tests/e2e/fixtures.ts"],
    rules: {
      "react-hooks/rules-of-hooks": "off",
    },
  },
  {
    // TypeScriptファイルに対してno-undefを無効化（TypeScriptが型チェックを行うため）
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      // TypeScriptプロジェクトではno-undefは不要（TypeScriptが型チェックを行うため）
      // eslint-config-expoが既に設定している可能性があるが、明示的に無効化
      "no-undef": "off",
    },
  },
  {
    // ローカルルールをプラグインとして登録
    plugins: {
      "local-rules": {
        rules: localRules,
      },
    },
    rules: {
      // 直書き色禁止ルール（theme/tokens を使用してください）
      "no-restricted-syntax": [
        "warn",
        {
          selector: "Literal[value=/^#[0-9A-Fa-f]{6}$/]",
          message: "直書きの16進数カラーコードは禁止です。theme/tokens を使用してください。",
        },
        {
          selector: "Literal[value=/^#[0-9A-Fa-f]{3}$/]",
          message: "直書きの16進数カラーコード（短縮形）は禁止です。theme/tokens を使用してください。",
        },
        {
          selector: "Literal[value=/^rgba?\\(/]",
          message: "直書きのrgba()カラーは禁止です。theme/tokens を使用してください。",
        },
      ],
      // router.push/replace/back の直接使用を禁止
      "local-rules/no-direct-router-push": "error",
    },
  },
]);
