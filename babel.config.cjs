module.exports = function (api) {
  api.cache(true);
  let plugins = [];

  // @clerk/shared 等が出力する `import.meta` を Web(classic script) でも安全にするため
  // 空オブジェクトへ置換する（詳細は babel-plugins/transform-import-meta.cjs）。
  plugins.push(require.resolve("./babel-plugins/transform-import-meta.cjs"));

  plugins.push("react-native-worklets/plugin");

  return {
    presets: [["babel-preset-expo", { jsxImportSource: "nativewind" }], "nativewind/babel"],
    plugins,
  };
};
