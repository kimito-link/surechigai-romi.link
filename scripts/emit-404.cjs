#!/usr/bin/env node
/**
 * dist/404.html を用意する。
 *
 * ★なぜ必要か（2026-09-06 に実機で起きた不具合の根治）
 * これが無いと、Vercel は「どの静的ファイルにも rewrite にも当たらないパス」に対して
 * トップページの HTML を **HTTP 200** で返す。実測:
 *   /_expo/static/js/web/sign-in-DEADBEEF.js → 200 / text/html / index.html と同一バイト
 * 端末に残った古い親チャンクが旧 sign-in-*.js を要求すると、ブラウザは HTML を
 * ES module として実行できず「Loading module ... failed」で固まる。
 * しかも Cache-Control: immutable が付くため、リロードしても1年間直らない。
 *
 * Vercel は出力ディレクトリの 404.html を「どのルートにも一致しないとき」に
 * **404 ステータス**で返す（公式KB: Custom 404 Page）。
 * Expo Router が出す +not-found.html は Expo の命名規約で、Vercel は認識しない。
 * よってここでコピーして 404.html という名前を与える。
 */
const fs = require("node:fs");
const path = require("node:path");

const dist = path.join(__dirname, "..", "dist");
const target = path.join(dist, "404.html");
const source = path.join(dist, "+not-found.html");

if (!fs.existsSync(dist)) {
  console.error("[emit-404] dist が無いのでスキップ");
  process.exit(0);
}

if (fs.existsSync(source)) {
  fs.copyFileSync(source, target);
  console.log(`[emit-404] +not-found.html → 404.html (${fs.statSync(target).size} bytes)`);
} else {
  // Expo が +not-found を出さない構成でも、必ず 404.html は存在させる。
  // ★ここで index.html をコピーしてはいけない（それでは今回の不具合と同じものが
  //   404 ステータスで返るだけになり、巨大な SPA を無駄に配ることになる）。
  fs.writeFileSync(
    target,
    '<!DOCTYPE html><html lang="ja"><head><meta charset="utf-8">' +
      '<title>404 - 見つかりません</title><meta name="robots" content="noindex"></head>' +
      "<body><h1>404</h1><p>お探しのページは見つかりませんでした。</p>" +
      '<p><a href="/">トップへ戻る</a></p></body></html>\n',
  );
  console.log("[emit-404] +not-found.html が無いため最小の 404.html を生成");
}
