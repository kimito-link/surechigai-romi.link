/**
 * `import.meta` を空オブジェクト `({})` に置換する Babel プラグイン。
 *
 * 背景: @clerk/shared の env ユーティリティが `import.meta.env` を参照しており、
 * Expo Web のバンドルは classic script として読み込まれるため、出力に `import.meta`
 * が残ると「Cannot use 'import.meta' outside a module」SyntaxError になり、
 * そのモジュールが登録されず「Requiring unknown module」で画面が落ちる。
 *
 * `import.meta` を `({})` に置換すれば `import.meta.env` は `undefined` となり、
 * Clerk 側の `void 0 !== import.meta && import.meta.env && ...` ガードは安全に false
 * となって process.env など他の分岐へフォールバックする（挙動を壊さない）。
 *
 * MetaProperty は `new.target` にもマッチするため、import.meta のみを対象に絞る。
 */
module.exports = function ({ types: t }) {
  return {
    name: "transform-import-meta-to-empty-object",
    visitor: {
      MetaProperty(path) {
        const node = path.node;
        if (
          node.meta &&
          node.meta.name === "import" &&
          node.property &&
          node.property.name === "meta"
        ) {
          path.replaceWith(t.objectExpression([]));
        }
      },
    },
  };
};
