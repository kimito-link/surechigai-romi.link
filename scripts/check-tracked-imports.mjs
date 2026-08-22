#!/usr/bin/env node
// check-tracked-imports.mjs — 「コミットし忘れた新規ファイルを import している」を機械検出する出荷事故ゲート。
//
// 出典(金型の元): tsuioku-no-kirameki.com(2026-07-06 実事故から実装・実証済み)。
//   実事故: 新規ファイルを `git add` し忘れたまま commit → ローカルの verify / pre-push は
//   「作業ツリー基準」(未追跡でもディスクにあれば bundler が resolve できる)のため全部緑のまま、
//   Vercel ビルド(= git clone 直後の状態)だけが `Could not resolve` で全デプロイ失敗した。
//
// 原理: git ls-files(追跡ファイル一覧)だけを真実として、追跡ファイル内の相対 import が
//   すべて追跡ファイルに解決できるかを静的検査する = git clone 直後の状態を模した判定。依存追加なし。
//
// 使い方:
//   node scripts/check-tracked-imports.mjs                # 3値 exit(下記)
//   node scripts/check-tracked-imports.mjs --selftest     # 毒→赤 を機械で確認
//   TRACKED_IMPORT_ROOTS="src,app" node scripts/...       # 検査対象ルートの限定(省略時は全追跡ファイル)
//   CI の build ステップ直後・pre-push に足すのが定位置。
//
// 終了コード(3値・scripts/lib/instrument-core.mjs の共通規約):
//   0 = 合格(★走査件数という根拠つき) / 1 = 測れた上での赤 / 2 = ★測れなかった(緑ではない)
//
// ★なぜ 2 が要るか(2026-08-22 に本リポで実測):
//   TRACKED_IMPORT_ROOTS に存在しないディレクトリを渡すと、走査 0 ファイルのまま
//   「OK(検査対象 0 ファイル・未追跡 import 0 件)」と表示して exit 0 になっていた。
//   ＝ ★何も測っていないのに合格。これは赤より危険(機能して見えるので誰も疑わない)。
//   このリポは同型の事故を既に踏んでいる:
//     - check-native-unsafe-dom が却下原因を見逃したまま緑(2026-08-21)
//     - OGP が 200/image/png のまま 0 バイト(2026-08-21)
//   → 「0件だから緑」は「一度も測っていない」と区別が付かない。走査件数を根拠として要求する。
//
// 対応: 静的 import / export...from / 副作用 import / 動的 import()。
//   JSDoc 型参照 `{import('./x.js').Foo}` は除外。拡張子は .js/.mjs/.ts/.tsx/.jsx と
//   省略時の .js/.ts/index.* 補完を候補にする(いずれか1つでも追跡されていればOK=誤検知ゼロ優先)。

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { EXIT, computeExitCode, formatProbeReport } from './lib/instrument-core.mjs';

const ROOT = resolve(process.cwd());
const SOURCE_EXT = /\.(js|mjs|ts|tsx|jsx)$/;
const EXCLUDE = /(^|\/)(node_modules|dist|build|\.next|out)\//;
const TEST_FILE = /\.(test|spec)\.[a-z]+$/;

// ---- 純ロジック(fs/git 非依存・単体テスト可) ----------------------------------

/**
 * コメント(// 行・/* ブロック *\/)と文字列リテラルの中身を「同じ長さの空白」に潰す。
 * 削除ではなく空白置換なのは、報告に使う行番号をずらさないため。
 *
 * なぜ必要か(surechigai で実際に踏んだ誤検知2件):
 *   - components/atoms/lazy-loading-fallback.tsx の JSDoc は ```tsx コードブロックで
 *     `lazy(() => import('./HeavyComponent'))` という**使い方の例**を示している
 *   - drizzle/schema/index.drizzle-kit.ts のコメントは `export * from "./foo.js"` を
 *     **問題の例として引用**している(drizzle-kit が .js を解決できない経緯の説明)
 * どちらも実行されないので追跡されていなくて当然。ここを除外リストで逃がすと
 * 本物の検出も一緒に殺すので、コメントを構造的に除くのが正しい。
 * (同じ思想が .github/workflows/ios-shell-guardrail.yml にもある:
 *  「コメントには経緯説明で禁止パターン名を引用する。禁止すると教訓が失われる」)
 */
export function stripComments(text) {
  const s = String(text || '');
  let out = '';
  // none | line | block | sq | dq | tpl
  //   文字列リテラルは「中身も含めてそのまま残す」。import の specifier は
  //   クォートの中身そのものなので、潰すと検出できなくなる。文字列を状態として
  //   追うのは、その中に現れる // や /* をコメント開始と誤認しないためだけ。
  //   (例: const re = "http://x" の // をコメント開始と読むと行末まで消えてしまう)
  let mode = 'none';
  const blank = (ch) => (ch === '\n' ? '\n' : ' ');
  for (let i = 0; i < s.length; i += 1) {
    const ch = s[i];
    const next = s[i + 1];
    if (mode === 'none') {
      if (ch === '/' && next === '/') { mode = 'line'; out += '  '; i += 1; continue; }
      if (ch === '/' && next === '*') { mode = 'block'; out += '  '; i += 1; continue; }
      if (ch === "'") { mode = 'sq'; out += ch; continue; }
      if (ch === '"') { mode = 'dq'; out += ch; continue; }
      if (ch === '`') { mode = 'tpl'; out += ch; continue; }
      out += ch;
      continue;
    }
    if (mode === 'line') {
      if (ch === '\n') { mode = 'none'; out += '\n'; continue; }
      out += ' ';
      continue;
    }
    if (mode === 'block') {
      if (ch === '*' && next === '/') { mode = 'none'; out += '  '; i += 1; continue; }
      out += blank(ch);
      continue;
    }
    // 文字列内: 中身はそのまま出す(エスケープは2文字まとめて通す)。
    if (ch === '\\') { out += ch; if (next != null) { out += next; i += 1; } continue; }
    const closer = mode === 'sq' ? "'" : mode === 'dq' ? '"' : '`';
    if (ch === closer) { mode = 'none'; out += ch; continue; }
    out += ch;
  }
  return out;
}

/** @param {string} text @returns {{ specifier: string, line: number }[]} */
export function extractRelativeImportSpecifiers(text) {
  // コメント内の import 例示を拾わないよう、先にコメントだけを空白へ潰す(行番号は保つ)。
  const s = stripComments(text);
  const out = [];
  const isRelative = (spec) => spec.startsWith('./') || spec.startsWith('../');
  const lineAt = (index) => s.slice(0, index).split('\n').length;
  let m;
  // import/export ... from '...'(複数行可)
  const staticRe = /\b(?:import|export)\b[^;'"]*?\bfrom\s*(['"])((?:(?!\1).)*)\1/g;
  while ((m = staticRe.exec(s)) != null) {
    if (isRelative(m[2])) out.push({ specifier: m[2], line: lineAt(m.index) });
  }
  // 副作用 import '...';
  const sideEffectRe = /\bimport\s*(['"])((?:(?!\1).)*)\1\s*;/g;
  while ((m = sideEffectRe.exec(s)) != null) {
    if (isRelative(m[2])) out.push({ specifier: m[2], line: lineAt(m.index) });
  }
  // 動的 import('...')。JSDoc 型参照(閉じ括弧直後に `.識別子` が続く)は除外。
  const dynamicRe = /\bimport\s*\(\s*(['"])((?:(?!\1).)*)\1\s*\)(\.[a-zA-Z_$])?/g;
  while ((m = dynamicRe.exec(s)) != null) {
    if (isRelative(m[2]) && !m[3]) out.push({ specifier: m[2], line: lineAt(m.index) });
  }
  return out;
}

/** @param {string} fromRepoPath @param {string} specifier @returns {string[]} */
export function resolveImportCandidates(fromRepoPath, specifier) {
  const stack = String(fromRepoPath || '').split('/').slice(0, -1);
  for (const part of String(specifier || '').split('/')) {
    if (part === '' || part === '.') continue;
    if (part === '..') stack.pop();
    else stack.push(part);
  }
  const base = stack.join('/');
  if (!base) return [];
  const candidates = [];
  const push = (p) => { if (p && !candidates.includes(p)) candidates.push(p); };
  if (/\.[a-zA-Z0-9]+$/.test(base)) {
    push(base);
    // TS プロジェクトで `./x.js` 指定→実体 x.ts の moduleResolution(bundler/nodenext)対応
    push(base.replace(/\.js$/, '.ts'));
    push(base.replace(/\.js$/, '.tsx'));
  } else {
    for (const ext of ['.js', '.mjs', '.ts', '.tsx', '.jsx']) push(`${base}${ext}`);
    for (const ext of ['.js', '.ts', '.tsx']) push(`${base}/index${ext}`);
    push(base);
  }
  return candidates;
}

/** @param {{path:string,text:string}[]} files @param {Set<string>|string[]} trackedFiles */
export function findUntrackedImports(files, trackedFiles) {
  const tracked = trackedFiles instanceof Set ? trackedFiles : new Set(trackedFiles || []);
  const violations = [];
  for (const f of Array.isArray(files) ? files : []) {
    const from = String(f?.path || '');
    if (!from) continue;
    for (const ref of extractRelativeImportSpecifiers(f.text)) {
      const candidates = resolveImportCandidates(from, ref.specifier);
      if (candidates.length === 0) continue;
      if (!candidates.some((c) => tracked.has(c))) {
        violations.push({ from, line: ref.line, specifier: ref.specifier, candidates });
      }
    }
  }
  return violations;
}

// ---- I/O(直接実行時のみ) ------------------------------------------------------

// process.argv[1] を file:// URL に正規化して比較する(node標準の url.pathToFileURL)。
// 手作りのパス文字列比較(resolve + pathname置換)は Windows でスラッシュ方向/ドライブレターの
// 大小差により一致せず isMain=false のまま exit 0 で抜ける偽陽性を生む(2026-07-06実測・ai-hub selftest fixtureで検出)。
const isMain = Boolean(process.argv[1]) && pathToFileURL(process.argv[1]).href === import.meta.url;

/**
 * ★--selftest: 毒を食わせて「本当に赤くなるか」を機械で確かめる。
 *
 * ★なぜ要るか: このリポは 2026-08-21 に check-native-unsafe-dom で
 *   「却下当時の姿を再現したら OK と報告した」＝検知が効いていない検査を実際に見つけている。
 *   手作業の変異テストは忘れるので、検知器が赤くなれること自体を機械で持つ。
 *
 * ★毒はリポの状態に依存させない(キットの警告: 状態に依存した selftest は
 *   その状態が変わった瞬間に壊れる)。ここでは純粋関数へ in-memory の fixture を渡す。
 */
function selfTest() {
  // ★fixture の import 指定子は文字列連結で組み立てる。
  //   このファイル自身が検査対象なので、fixture に import 文をそのまま書くと
  //   「自分が未追跡ファイルを import している」と検出されてしまう(2026-08-22 に実際に踏んだ)。
  //   ★組み立ては素の文字列連結で行う。テンプレートリテラルの ${} 補間で
  //   クォートを混ぜる書き方(`'.${'/'}ghost'`)は stripComments の状態機械を
  //   反転させ、以降の解析を崩した(2026-08-22 に実測)。凝った書き方をしない。
  const Q = String.fromCharCode(39); // シングルクォート
  const G = Q + '.' + '/' + 'ghost' + Q;

  const cases = [
    {
      name: '未追跡ファイルへの相対 import を検出できる',
      run: () =>
        findUntrackedImports(
          [{ path: 'lib/a.ts', text: `import { x } from ${G};` }],
          new Set(['lib/a.ts'])
        ).length === 1
    },
    {
      name: '追跡済みなら緑になる(誤検知しない)',
      run: () =>
        findUntrackedImports(
          [{ path: 'lib/a.ts', text: `import { x } from ${G};` }],
          new Set(['lib/a.ts', 'lib/ghost.ts'])
        ).length === 0
    },
    {
      name: 'コメント内の import 例示を拾わない',
      run: () =>
        findUntrackedImports(
          [{ path: 'lib/a.ts', text: `// import { x } from ${G};\nexport const y = 1;` }],
          new Set(['lib/a.ts'])
        ).length === 0
    },
    {
      name: 'JSDoc の型参照 import(\'./x\').T を拾わない',
      run: () =>
        findUntrackedImports(
          [{ path: 'lib/a.ts', text: `/** @type {import(${G}).T} */\nexport const y = 1;` }],
          new Set(['lib/a.ts'])
        ).length === 0
    },
    {
      name: '★走査 0 件を緑にしない(exit 2 になる)',
      run: () => computeExitCode([]) === EXIT.INCONCLUSIVE
    },
    {
      name: '★根拠なき pass は緑にならない(自動降格)',
      run: () =>
        computeExitCode([{ probe: 'x', verdict: 'pass', evidence: null }]) === EXIT.INCONCLUSIVE
    }
  ];

  const fails = [];
  for (const c of cases) {
    let ok = false;
    try { ok = c.run() === true; } catch (e) { fails.push(`${c.name}: 例外 (${e && e.message})`); continue; }
    if (!ok) fails.push(`${c.name}: ★期待どおりに動かなかった(検知が効いていない)`);
  }

  if (fails.length > 0) {
    console.error('[check-tracked-imports --selftest] 🔴 検査自体が壊れています:');
    for (const f of fails) console.error(`  - ${f}`);
    process.exit(EXIT.FAIL);
  }
  console.log(`[check-tracked-imports --selftest] ✅ ${cases.length}件すべて期待どおり(毒→赤 / 正常→緑)。`);
  process.exit(EXIT.PASS);
}

if (isMain && process.argv.includes('--selftest')) selfTest();

if (isMain) {
  let all;
  try {
    all = execSync('git ls-files', { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
      .split('\n').map((s) => s.trim()).filter(Boolean);
  } catch {
    // ★「git が無いので skip」を緑にしない。この検査の存在意義は
    //   git 追跡状態だけを真実として見ることなので、それが読めない＝測れていない。
    console.log(
      formatProbeReport(
        [{
          probe: '追跡ファイルの相対 import 解決',
          verdict: 'inconclusive',
          evidence: null,
          detail: 'git ls-files が実行できませんでした(gitリポジトリでない/git が無い)',
          howToFix: 'git リポジトリのルートで、git が PATH にある環境で実行する'
        }],
        { label: 'check-tracked-imports' }
      )
    );
    process.exit(EXIT.INCONCLUSIVE);
  }
  const trackedSet = new Set(all);
  const roots = String(process.env.TRACKED_IMPORT_ROOTS || '').split(',').map((s) => s.trim()).filter(Boolean);
  const inRoots = (p) => roots.length === 0 || roots.some((r) => p.startsWith(`${r}/`) || p === r);
  const targets = all.filter((p) => SOURCE_EXT.test(p) && !EXCLUDE.test(p) && !TEST_FILE.test(p) && inRoots(p));
  const files = [];
  for (const p of targets) {
    try { files.push({ path: p, text: readFileSync(join(ROOT, p), 'utf8') }); } catch { /* 索引ズレはスキップ */ }
  }
  const violations = findUntrackedImports(files, trackedSet);

  // ★この検査が判定しないこと(過信を防ぐため出力に添える)。
  const LIMITATION =
    '相対 import のみ。エイリアス(@/…)・パッケージ名・実行時に組み立てるパスは見ていない';

  /** @type {import('./lib/instrument-core.mjs').ProbeResult[]} */
  const results = [];

  if (files.length === 0) {
    // ★走査 0 は「違反なし」ではなく「測れなかった」。ここを緑にすると偽の緑になる。
    results.push({
      probe: '追跡ファイルの相対 import 解決',
      verdict: 'inconclusive',
      evidence: null,
      detail:
        roots.length > 0
          ? `TRACKED_IMPORT_ROOTS="${roots.join(',')}" に一致する追跡ファイルが 0 件でした`
          : '追跡ファイルが 0 件でした(git ls-files が空)',
      howToFix:
        roots.length > 0
          ? 'TRACKED_IMPORT_ROOTS のディレクトリ名が実在するか確認する(リネーム時に置き去りになりやすい)'
          : 'リポジトリのルートで実行しているか確認する',
      limitation: LIMITATION
    });
  } else if (violations.length > 0) {
    results.push({
      probe: '追跡ファイルの相対 import 解決',
      verdict: 'fail',
      evidence: { 走査ファイル: files.length, 違反: violations.length },
      detail: `git 未追跡のファイルへ import している疑い ${violations.length} 件`,
      howToFix: '新規ファイルなら `git add <path>` してから commit',
      limitation: LIMITATION
    });
  } else {
    // ★evidence(走査件数)を伴うので pass を名乗れる。空だと instrument-core が自動降格する。
    results.push({
      probe: '追跡ファイルの相対 import 解決',
      verdict: 'pass',
      evidence: { 走査ファイル: files.length, 違反: 0 },
      limitation: LIMITATION
    });
  }

  console.log(formatProbeReport(results, { label: 'check-tracked-imports' }));

  for (const v of violations) {
    console.error(`  ${v.from}:${v.line} が '${v.specifier}' を import → 追跡に無い: ${v.candidates.join(' / ')}`);
  }
  if (violations.length > 0) {
    console.error('[check-tracked-imports] (ローカル検証は作業ツリー基準のため、この検査だけが git clone 直後=CI/Vercel の実体を再現します)');
  }

  process.exit(computeExitCode(results));
}
