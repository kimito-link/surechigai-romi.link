#!/usr/bin/env node
// @ts-check
/**
 * check-security-local-only-wired.mjs
 * ★「リリース前の検査が、本番の今の状態でブロックされる」配線漏れを機械で見つける。
 *
 * ───────────────────────────────────────────────────────────────────────────
 * ■ ★なぜ要るか（このリポで2回起きている）
 *
 *   `pnpm check` は run-instruments 経由で「公開サイトのセキュリティ満点チェック」
 *   （malwarecheck.site）を呼ぶ。これは★本番URLへ実アクセスする。
 *   つまり「これから出す新しいコード」ではなく「入れ替わる前の今の本番」を測る。
 *   本番の既存状態（CSP の unsafe-inline/unsafe-eval、外部評価 VirusTotal の減点＝
 *   ヘッダ修正では直らない）で、**リリース自体が検査段階で止まる**。
 *
 *   ① 2026-09-29: deploy-vercel.yml が毎回失敗し、本番デプロイが一切通らなくなった。
 *      → RUN_INSTRUMENTS_SECURITY_LOCAL_ONLY=1 を付けて解決（gate1.yml も同様）。
 *   ② 2026-10-19: ★同じ対処が android-play-release.yml / ios-appstore-release.yml に
 *      伝播しておらず、Android 本番リリースが検査段階で失敗した（run 39203030014）。
 *      ★「直した」のは1つのworkflowだけで、同じ形の他のworkflowは気づかれなかった。
 *
 *   ★どちらも「直した場所」だけ直して、**同じ呼び出しがある他の場所を数えなかった**
 *   のが原因。この検査はその数え上げを機械にやらせる。
 *
 * ■ ★何を見るか
 *   .github/workflows/*.yml の各ステップのうち、`pnpm check`（または run-instruments）
 *   を呼ぶものが、そのステップの env に RUN_INSTRUMENTS_SECURITY_LOCAL_ONLY: "1"
 *   （または `--security-local-only` 引数）を持っているか。
 *
 * ■ ★判断の根拠（なぜステップ単位・なぜ厳密か）
 *   job 単位・workflow 単位の env でも動作上は同じだが、★直す人が「このステップに
 *   付ける」と1か所で分かるよう、ステップ単位に固定した。ゆるめると
 *   「どこに書けば緑か」が人によって割れ、また抜ける。
 *
 * ■ ★この検査が判定しないこと
 *   ・本番URLの実測そのもの（それは deploy-vercel.yml の Post-deploy が担う。
 *     `verify-security-score.mjs --url …` を直接呼ぶ行は対象外＝意図した実測）
 *   ・`pnpm check:xxx` のような別スクリプトは対象外（正規表現で除外）
 *   ・YAML を完全には解釈しない（素朴な行ベース。ライブラリ依存を避けるため。
 *     yaml は未宣言で CI で解決できる保証がない＝ここが落ちると緑なのに無検査になる）
 *   ・コメント行は無視する（コメントに書いただけで緑にならないように）
 *
 * 使い方:
 *   node scripts/check-security-local-only-wired.mjs [リポのルート]
 *   node scripts/check-security-local-only-wired.mjs --selftest
 *
 * 終了コード: 0=全ステップOK / 1=付け忘れあり / 2=測れなかった（対象ゼロ・読めない）
 * ───────────────────────────────────────────────────────────────────────────
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { EXIT } from "./lib/instrument-core.mjs";

/** 付けるべき環境変数名。 */
export const ENV_NAME = "RUN_INSTRUMENTS_SECURITY_LOCAL_ONLY";

/** `pnpm check` / `pnpm run check`（`pnpm check:xxx` は含めない）。 */
const CHECK_CALL_RE = /(?:^|[\s&;|(])pnpm\s+(?:run\s+)?check(?![:\w-])/;
/** run-instruments を直接呼ぶ行。 */
const INSTRUMENTS_CALL_RE = /run-instruments\.mjs/;
/** 満たしている証拠。 */
const ENV_OK_RE = new RegExp(`^\\s*${ENV_NAME}\\s*:\\s*["']?1["']?\\s*(?:#.*)?$`);
const FLAG_OK_RE = /--security-local-only\b/;

/**
 * ワークフロー本文から、検査を呼ぶステップとその合否を返す純関数。
 * @param {string} source
 * @returns {{ steps: number, targets: { name: string, line: number, ok: boolean }[] }}
 */
export function findUnwiredSteps(source) {
  const lines = String(source).split(/\r?\n/);
  /** @type {{ name: string, line: number, indent: number, body: string[] }[]} */
  const blocks = [];
  /** @type {typeof blocks[number] | null} */
  let cur = null;

  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i];
    const m = /^(\s*)-\s+(\S.*)$/.exec(raw);
    // ★ステップの開始: リスト記号「- 」で始まり、かつ次のキーが name/run/uses/id/if/env/with 系。
    //   （with: の中の配列要素などを誤ってステップ扱いしないよう、既存ブロックより
    //    浅いインデントのときだけ新ステップとみなす）
    if (m && /^(name|run|uses|id|if|env|with|shell|working-directory)\s*:/.test(m[2])) {
      if (!cur || m[1].length <= cur.indent) {
        if (cur) blocks.push(cur);
        const nameM = /^name\s*:\s*(.*)$/.exec(m[2]);
        cur = { name: nameM ? nameM[1].trim() : "(無名)", line: i + 1, indent: m[1].length, body: [raw] };
        continue;
      }
    }
    if (cur) {
      // ★jobs の次のキー等でブロックが終わる（インデントがステップ以下の非リスト行）
      if (raw.trim() !== "" && !/^\s*#/.test(raw)) {
        const ind = raw.length - raw.trimStart().length;
        if (ind <= cur.indent && !/^\s*-\s/.test(raw)) {
          blocks.push(cur);
          cur = null;
          continue;
        }
      }
      cur.body.push(raw);
      if (cur.name === "(無名)") {
        const nm = /^\s*name\s*:\s*(.*)$/.exec(raw);
        if (nm) cur.name = nm[1].trim();
      }
    }
  }
  if (cur) blocks.push(cur);

  /** @type {{ name: string, line: number, ok: boolean }[]} */
  const targets = [];
  for (const b of blocks) {
    // ★コメント行は無視（コメントに書いただけで緑にしない）
    const code = b.body.filter((l) => !/^\s*#/.test(l));
    const calls = code.some((l) => CHECK_CALL_RE.test(l) || INSTRUMENTS_CALL_RE.test(l));
    if (!calls) continue;
    const ok = code.some((l) => ENV_OK_RE.test(l) || FLAG_OK_RE.test(l));
    targets.push({ name: b.name, line: b.line, ok });
  }
  return { steps: blocks.length, targets };
}

/** 自己検証: 毒を入れたら赤・正常なら緑・コメントだけでは緑にならない。 */
function selftest() {
  /** @type {string[]} */
  const fails = [];
  const HEAD = "jobs:\n  checks:\n    runs-on: ubuntu-latest\n    steps:\n";
  const BAD = `${HEAD}      - name: Type check + gates\n        if: \${{ !inputs.skip_checks }}\n        run: pnpm check\n`;
  const OK = `${HEAD}      - name: Type check + gates\n        env:\n          ${ENV_NAME}: "1"\n        run: pnpm check\n`;
  const COMMENT_ONLY = `${HEAD}      # ${ENV_NAME}: "1"\n      - name: Type check\n        run: pnpm check\n`;
  const OTHER_SCRIPT = `${HEAD}      - name: Deletion\n        run: pnpm check:deletion-coverage\n`;
  const FLAG = `${HEAD}      - name: inst\n        run: node scripts/run-instruments.mjs --security-local-only .\n`;
  const TWO = `${HEAD}      - name: A\n        env:\n          ${ENV_NAME}: "1"\n        run: pnpm check\n      - name: B\n        run: pnpm check\n`;
  const ZERO_VALUE = `${HEAD}      - name: A\n        env:\n          ${ENV_NAME}: "0"\n        run: pnpm check\n`;

  const bad = findUnwiredSteps(BAD);
  if (bad.targets.length !== 1 || bad.targets[0].ok) fails.push("★付け忘れ（毒）を赤にできない");
  const ok = findUnwiredSteps(OK);
  if (ok.targets.length !== 1 || !ok.targets[0].ok) fails.push("★正しく付いているのに誤検知する");
  const cm = findUnwiredSteps(COMMENT_ONLY);
  if (cm.targets.length !== 1 || cm.targets[0].ok) fails.push("★コメントに書いただけで緑にしてしまう");
  if (findUnwiredSteps(OTHER_SCRIPT).targets.length !== 0) fails.push("★pnpm check:xxx を巻き込んでいる");
  const fl = findUnwiredSteps(FLAG);
  if (fl.targets.length !== 1 || !fl.targets[0].ok) fails.push("★--security-local-only 引数を認めない");
  const two = findUnwiredSteps(TWO);
  if (two.targets.length !== 2 || two.targets.filter((t) => !t.ok).length !== 1 || two.targets[1].name !== "B") {
    fails.push("★2ステップのうち付け忘れた方だけを報告できない");
  }
  const zero = findUnwiredSteps(ZERO_VALUE);
  if (zero.targets.length !== 1 || zero.targets[0].ok) fails.push('★値が "0" でも緑にしてしまう');
  if (findUnwiredSteps("").targets.length !== 0) fails.push("★空入力から何かを作り出している");

  if (fails.length) {
    console.error("❌ selftest 失敗（検知器が効いていません）:");
    for (const f of fails) console.error(`   - ${f}`);
    process.exit(EXIT.FAIL);
  }
  console.log("✅ selftest: 付け忘れ・コメントのみ・値0を赤にし、正しい配線と pnpm check:xxx は誤検知しないことを確認した");
  process.exit(EXIT.PASS);
}

function main() {
  if (process.argv.includes("--selftest")) return selftest();

  const argDir = process.argv.slice(2).find((a) => !a.startsWith("--"));
  const root = argDir ? resolve(argDir) : resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const wf = join(root, ".github", "workflows");
  if (!existsSync(wf)) {
    console.error(`check-security-local-only-wired: ${wf} が見つかりません（測れませんでした）`);
    process.exit(EXIT.INCONCLUSIVE);
  }
  const files = readdirSync(wf).filter((f) => /\.ya?ml$/.test(f)).sort();
  if (files.length === 0) {
    console.error("check-security-local-only-wired: ワークフローが1件もありません（検査対象ゼロ＝測れませんでした）");
    process.exit(EXIT.INCONCLUSIVE);
  }

  let total = 0;
  /** @type {{ file: string, name: string, line: number }[]} */
  const violations = [];
  for (const f of files) {
    // ★非UTF-8が混ざっていても壊さないようバイトで読む（check-workflow-timeouts と同じ理由）
    const src = readFileSync(join(wf, f)).toString("utf8");
    const { targets } = findUnwiredSteps(src);
    total += targets.length;
    for (const t of targets) if (!t.ok) violations.push({ file: f, name: t.name, line: t.line });
  }

  // ★件数0で緑にしない。pnpm check を呼ぶworkflowが1本も無い＝パーサ異常か構成変更。
  if (total === 0) {
    console.error("check-security-local-only-wired: `pnpm check` を呼ぶステップを1件も検出できませんでした（測れませんでした）");
    process.exit(EXIT.INCONCLUSIVE);
  }

  if (violations.length > 0) {
    console.error(`❌ ${ENV_NAME}=1 が無いステップが ${violations.length} 件あります:`);
    for (const v of violations) console.error(`   - ${v.file}:${v.line} :: ${v.name}`);
    console.error("");
    console.error("   pnpm check は公開サイトのセキュリティ満点チェックで本番URLへ実アクセスし、");
    console.error("   「入れ替わる前の今の本番」の既存減点（外部評価 VirusTotal 等）でリリースを止めます。");
    console.error(`   該当ステップの env に ${ENV_NAME}: "1" を足してください。`);
    console.error("   （2026-09-29 deploy-vercel、2026-10-19 android-play-release で実際に止まりました）");
    process.exit(EXIT.FAIL);
  }

  console.log(`✅ pnpm check を呼ぶ ${total} ステップすべてに ${ENV_NAME}=1 があります（ワークフロー ${files.length} 本を確認）`);
  process.exit(EXIT.PASS);
}

main();
