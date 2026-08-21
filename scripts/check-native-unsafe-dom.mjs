#!/usr/bin/env node
/**
 * ネイティブ（Hermes）で落ちる DOM API の使い方を検出する。
 *
 * なぜ必要か（2026-08-19・iOS build 509/518 の Guideline 2.1(a) 却下）:
 *   `RestoreDeepLinkAfterAuthBoot` が `window.addEventListener` を
 *   `typeof window === "undefined"` だけのガードで呼んでいた。
 *   **React Native の Hermes には `window` は存在する**ので、このガードは
 *   すり抜ける。存在しないのは `addEventListener` の方で、結果
 *   `undefined is not a function` になり ErrorBoundary が
 *   「エラーが発生しました」を全画面に出す。審査官はこれを
 *   "an error displayed upon launch" と書いて却下してくる。
 *
 *   この不具合は tsc・テスト・lint・Web ビルドをすべて素通りする。
 *   ネイティブで実際に起動する以外に気づく方法がないので、ここで止める。
 *
 * 判定:
 *   window.addEventListener / document.* を使う行の手前に
 *   `Platform.OS` か `typeof document` のガードが無ければ NG。
 *
 * 実行: node scripts/check-native-unsafe-dom.mjs
 *
 * ★2026-08-21: スコープ判定を直し、`pnpm check` に組み込んだ。
 *
 *   それまでは「危険な行の 60 行手前までにガードがあれば OK」としていたため、
 *   **別の関数やモジュール定数にあるガードを理由に見逃していた**。
 *   実際 app/_layout.tsx では、24 行上のモジュール定数
 *   `const INITIAL_WEB_PATH = Platform.OS === "web" && ...` を根拠に、
 *   別関数 RestoreDeepLinkAfterAuthBoot 内の未ガードな
 *   `window.addEventListener` が OK と判定されていた。
 *   これは **iOS 518 却下の原因そのもの**であり、この検査が
 *   いちばん捕まえなければならない形だった。
 *
 *   直した内容: スコープを**内側から外側へ**辿り、
 *   「自分より浅いインデントの関数開始」ごとにガードを探す。
 *   これで以下を両立する。
 *     - ガード済み useEffect の中のクリーンアップ（`return () => {...}`）は通す
 *     - 別関数・モジュール定数のガードは根拠にしない
 *
 *   検証: 却下当時の姿（Platform ガードを外した状態）を再現すると
 *   NG 4 件で exit 1、戻すと exit 0 になることを確認済み（変異テスト）。
 *
 * ⚠️ それでも残る限界:
 *   静的解析なので、**呼び出し元の事情までは追えない**。
 *   ガードの無いヘルパー関数は、安全な場所からしか呼ばれていなくても NG になる。
 *   その場合はヘルパー自身に `typeof document === "undefined"` を足すこと
 *   （呼び出し元の事情に安全を委ねない方が、そもそも壊れにくい）。
 *   **これが緑でも「ネイティブで確実に安全」とまでは言えない**。
 *   最終的な確証は ios-crash-probe.yml（実機シミュレータで起動）で得ること。
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

/** ネイティブでも読まれうる場所だけを見る。 */
const SCAN_DIRS = ["app", "components", "hooks", "lib", "modules"];

/** Web 専用と明示されているファイルは対象外。 */
const SKIP_PATTERNS = [
  /\.web\.(t|j)sx?$/,      // *.web.tsx は Web 専用
  /[\/]\+html\.tsx$/,      // Expo Router の HTML シェル（Web のみ）
  /[\/]pwa[\/]/,          // PWA 系は Web 専用
  /[\/]__tests__[\/]/,
  /\.test\.(t|j)sx?$/,
];

/** これらを呼ぶ行が危険。 */
const RISKY = [
  /\bwindow\.addEventListener\b/,
  /\bwindow\.removeEventListener\b/,
  /\bdocument\.(readyState|querySelector|addEventListener|createElement|body|head)\b/,
];

/** 直前にこれがあれば守られているとみなす。 */
const GUARDS = [
  /Platform\.OS\s*!==\s*["']web["']/,
  /Platform\.OS\s*===\s*["']web["']/,
  /typeof\s+document\s*===\s*["']undefined["']/,
  /typeof\s+document\s*!==\s*["']undefined["']/,
  /typeof\s+window\.addEventListener\s*!==\s*["']function["']/,
  /**
   * ★ヘルパー関数によるガード（2026-08-21 追加）。
   *
   * ガードを**その場に書かず、Web判定のヘルパーを呼んで早期 return する**書き方が
   * このリポジトリには実在する。インラインのガードしか見ていなかったため、
   * 安全なコードを2件 NG と報告していた（＝誤検知）。
   *
   *   lib/_core/manus-runtime.ts:107  `if (!isWeb() || !isInIframe()) return;`
   *   components/auth/auto-advance-to-x.tsx  `hasAutoXParam()` が
   *     内部で `Platform.OS !== "web"` を見て false を返し、呼び出し側が早期 return する
   *
   * 誤検知を出す検査は**信用されなくなり、本物を見逃す**ので拾えるようにする。
   * ヘルパー名は「Web/ネイティブの判定」を意味するものだけに限定する
   * （何でも通すと検査の意味が無くなる）。
   */
  /\b(?:!)?isWeb\(\)/,
  /\bhasAutoXParam\(\)/,
];

/** ガードを探す遡り行数。関数の頭で弾く書き方を拾える程度に広く取る。 */
const LOOKBACK = 60;

function walk(dir, acc) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name.startsWith(".")) continue;
      walk(full, acc);
    } else if (/\.(t|j)sx?$/.test(e.name)) {
      acc.push(full);
    }
  }
  return acc;
}

const files = SCAN_DIRS.flatMap((d) => walk(path.join(ROOT, d), []));
const findings = [];

for (const file of files) {
  const rel = path.relative(ROOT, file).split(path.sep).join("/");
  if (SKIP_PATTERNS.some((p) => p.test(rel))) continue;

  const whole = fs.readFileSync(file, "utf8");
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (line.trimStart().startsWith("//") || line.trimStart().startsWith("*")) continue;
    if (!RISKY.some((r) => r.test(line))) continue;

    const from = Math.max(0, i - LOOKBACK);

    /* ★2026-08-21 修正: ここで「LOOKBACK 行以内にガードがあれば OK」と
       していたため、**別の関数やモジュール定数にあるガードで見逃していた**。
       実際 app/_layout.tsx では、24行上のモジュール定数
       `const INITIAL_WEB_PATH = Platform.OS === "web" && ...` を理由に、
       別関数 RestoreDeepLinkAfterAuthBoot 内の未ガードな
       `window.addEventListener` が OK と判定されていた。
       これは **iOS 518 却下の原因そのもの**であり、この検査が
       いちばん捕まえなければならない形だった（変異テストで再現して確認）。

       よって広い LOOKBACK 判定は廃止し、**同じ関数の中だけ**を見る。 */
    /* スコープの開始を探す。**インデントが浅い**行だけを境界とみなす。
       `const mark = () => {` のような**同じ階層の小さなコールバック**を
       境界にすると、その手前にある本物のガードを見落とす（実際に起きた）。
       ここでは「自分より浅いインデントで関数が始まる行」まで遡る。 */
    /* スコープを**外側へ辿りながら**ガードを探す。

       危険な行は、ガード済み useEffect の中の
       `return () => { window.removeEventListener(...) }`（クリーンアップ）や、
       小さなコールバックの中にあることが多い。内側のスコープだけを見ると
       それらを全部 NG にしてしまう（実際 8 件の誤検知が出た）。
       クリーンアップは**早期 return したら登録もされない**ので、
       外側のガードが効いていれば安全である。

       よって「自分より浅いインデントの関数開始」を見つけるたびに
       そこまでを文脈としてガードを探し、見つからなければさらに外側へ広げる。 */
    const indentOf = (s) => (s.match(/^\s*/) || [""])[0].length;
    const isFnStart = (l) =>
      /useEffect\(|^\s*(export\s+)?(async\s+)?function\b|=>\s*\{\s*$|^\s*(export\s+)?const\s+\w+\s*=\s*(async\s*)?\(/.test(l);

    let guarded = false;
    let indentLimit = indentOf(lines[i]);
    for (let j = i - 1; j >= from && !guarded; j -= 1) {
      const l = lines[j];
      if (!l.trim()) continue;
      if (!isFnStart(l) || indentOf(l) >= indentLimit) continue;
      // ここが一段外側のスコープの入口
      indentLimit = indentOf(l);
      const ctx = lines.slice(j, i + 1).join("\n");
      if (GUARDS.some((g) => g.test(ctx))) guarded = true;
    }
    if (guarded) continue;

    findings.push({ file: rel, line: i + 1, code: line.trim().slice(0, 90) });
  }
}

if (findings.length > 0) {
  console.error(`[check-native-unsafe-dom] NG: ${findings.length}件`);
  for (const f of findings) {
    console.error(`  - ${f.file}:${f.line}`);
    console.error(`      ${f.code}`);
  }
  console.error("");
  console.error("Hermes には window はあるが addEventListener / document は無い。");
  console.error("`typeof window === \"undefined\"` だけのガードはすり抜ける。");
  console.error("直し方: 手前に `if (Platform.OS !== \"web\") return;` を置くか、");
  console.error("        実際に触る API の存在(`typeof document === \"undefined\"`)で判定する。");
  process.exit(1);
}

console.log(`[check-native-unsafe-dom] OK: ${files.length}ファイルに未ガードの DOM 参照なし`);
