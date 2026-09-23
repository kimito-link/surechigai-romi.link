#!/usr/bin/env node
// @ts-check
/**
 * 本番が「GitHub の main と同じもの」で動いているかを見張る計器。
 *
 * ■ ★なぜ要るか（2026-09-22 に実際に起きていた）
 *   本番が **GitHub に push されていないコミット**で動いていた。
 *
 *     本番 /api/health → 9f3be58（origin に存在しない）
 *     origin/main      → 35337ec（#341〜#344。本番に出ていない）
 *
 *   CLI から直接 `vercel --prod` された結果、履歴が2本に分かれ、
 *   **3日以上ズレたまま**誰も気づかなかった。
 *
 *   ★実害は双方向:
 *     - X の英語警告への対策（日本語の先出し #343/#344）が本番で効いていない
 *     - Chrome の Lookalike 対策 assetlinks.json が GitHub 側に無い
 *   ＝ **どちらを一方的に出しても何かが壊れる**状態になっていた。
 *
 * ■ ★なぜ既存の緑では気づけないのか
 *   CI は「push された内容」を検査する。**本番に何が出ているかは見ていない。**
 *   Vercel も「デプロイ成功」を返す（その時点では実際に成功している）。
 *   ★あとから別系統で上書きされると、どの緑もそれを示さない。
 *   ＝ このリポの「CIの赤に出ない故障」計器（check-workflow-timeouts /
 *      check-dependabot-queue / check-actions-usage）と同じ系統。
 *
 * ■ ★測っていないもの（過信を防ぐ）
 *   - 本番の**中身**が正しいかは見ない。コミットの同一性だけ。
 *   - 遅れの**原因**（ビルド失敗か・未実行か・意図的な保留か）は区別しない。
 *   - Production だけを見る（プレビュー環境は対象外）。
 *
 * ■ 終了コード（instrument-core の3値）
 *   0 = 一致（★根拠つき） / 1 = ズレている / ★2 = 測れなかった（緑ではない）
 *
 * ■ 使い方
 *   node scripts/check-deploy-freshness.mjs
 *   node scripts/check-deploy-freshness.mjs --url https://example.com/api/health
 *   node scripts/check-deploy-freshness.mjs --selftest   ← ★毒を入れて赤を確認
 */

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { judgeDeployFreshness } from "./lib/deploy-freshness-core.mjs";
import {
  EXIT,
  computeExitCode,
  formatProbeReport,
} from "./lib/instrument-core.mjs";

/**
 * 測定先。★リポ固有の値をコードに埋めない（キット基準#5）。
 *
 * 優先順: `--url` 引数 > 環境変数 `DEPLOY_HEALTH_URL` > `app.config.json` の productionDomain。
 * ★どれも無ければ null のまま＝「測れなかった(2)」に倒す（推測で緑にしない）。
 */
function resolveDefaultHealthUrl() {
  const fromEnv = process.env.DEPLOY_HEALTH_URL?.trim();
  if (fromEnv) return fromEnv;
  // リポジトリ直下の app.config.json（このファイルは templates/scripts/ にある想定）
  for (const rel of ["../../app.config.json", "../app.config.json"]) {
    try {
      const raw = readFileSync(new URL(rel, import.meta.url), "utf8");
      const domain = JSON.parse(raw)?.identity?.productionDomain;
      if (typeof domain === "string" && domain.length > 0) {
        const origin = domain.startsWith("http") ? domain : `https://${domain}`;
        return `${origin.replace(/\/$/, "")}/api/health`;
      }
    } catch {
      // app.config.json が無い／読めないプロジェクトもある。次の候補へ。
    }
  }
  return null;
}

const DEFAULT_HEALTH_URL = resolveDefaultHealthUrl();
const FETCH_TIMEOUT_MS = 15_000;

/** @param {string[]} argv */
function parseArgs(argv) {
  const out = { url: DEFAULT_HEALTH_URL, selftest: false, ref: "origin/main" };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--url" && argv[i + 1]) out.url = argv[i + 1];
    if (argv[i] === "--ref" && argv[i + 1]) out.ref = argv[i + 1];
    if (argv[i] === "--selftest") out.selftest = true;
  }
  return out;
}

/**
 * 本番の /api/health から deployment.commit を読む。
 * ★取れなかったら null を返す（推測で埋めない＝inconclusive に倒すため）。
 *
 * @param {string} url
 * @returns {Promise<string|null>}
 */
async function fetchProductionCommit(url) {
  // ★測定先が決まらなかった（--url も env も app.config.json も無い）。
  //   推測で URL を組み立てず、素直に「測れなかった」に倒す。
  if (!url) return null;
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { "Cache-Control": "no-cache" },
    });
    if (!res.ok) return null;
    const body = await res.json();
    const commit = body?.deployment?.commit;
    return typeof commit === "string" && commit.length > 0 ? commit : null;
  } catch {
    return null;
  }
}

/**
 * 比較対象（既定は origin/main）の HEAD を読む。
 * ★fetch はしない（この計器が勝手にネットワーク操作をしない）。呼ぶ側の責任。
 *
 * @param {string} ref
 * @returns {string|null}
 */
function readExpectedCommit(ref) {
  try {
    return execFileSync("git", ["rev-parse", ref], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
}

/**
 * ★自己テスト: 毒を入れて、本当に赤くなることを確かめる。
 * ★「毒が入ったこと自体」も検証する（毒が効いていないのに緑を見て安心しない）。
 */
function runSelfTest() {
  const good = judgeDeployFreshness({
    productionCommit: "5f519e2abcde",
    expectedCommit: "5f519e2abcde",
  });
  const poisoned = judgeDeployFreshness({
    productionCommit: "5f519e2abcdf", // ★末尾1文字だけ変える
    expectedCommit: "5f519e2abcde",
  });
  const unmeasured = judgeDeployFreshness({
    productionCommit: null,
    expectedCommit: "5f519e2abcde",
  });

  const checks = [
    ["一致 → pass", good.verdict === "pass"],
    ["★毒が実際に入った", poisoned.evidence?.productionCommit !== good.evidence?.productionCommit],
    ["★毒 → fail", poisoned.verdict === "fail"],
    ["★取得不能 → inconclusive（緑にしない）", unmeasured.verdict === "inconclusive"],
    ["★inconclusive は 0 を返さない", computeExitCode([unmeasured]) !== EXIT.PASS],
  ];

  let ok = true;
  for (const [label, passed] of checks) {
    console.log(`${passed ? "✅" : "❌"} ${label}`);
    if (!passed) ok = false;
  }
  console.log(ok ? "\n自己テスト合格（計器は毒に反応する）" : "\n★自己テスト不合格");
  return ok ? EXIT.PASS : EXIT.FAIL;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.selftest) {
    process.exit(runSelfTest());
  }

  const [productionCommit, expectedCommit] = await Promise.all([
    fetchProductionCommit(args.url),
    Promise.resolve(readExpectedCommit(args.ref)),
  ]);

  const result = judgeDeployFreshness({
    productionCommit,
    expectedCommit,
    healthUrl: args.url,
  });

  console.log(formatProbeReport([result], { label: "本番デプロイの鮮度" }));

  // ★ズレているときは、差分の中身も出す（次の一手を決められるように）。
  if (result.verdict === "fail" && productionCommit && expectedCommit) {
    try {
      const log = execFileSync(
        "git",
        ["log", "--oneline", `${productionCommit}..${args.ref}`],
        { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }
      ).trim();
      if (log) {
        console.log(`\n本番に出ていないコミット（${args.ref} 側）:`);
        console.log(log);
      }
    } catch {
      // ★本番のコミットがローカルに無い場合は差分を出せない。
      //   それ自体が「別系統からデプロイされた」証拠なので、そう伝える。
      console.log(
        `\n★本番のコミット(${productionCommit.slice(0, 12)})がローカルに存在しない。` +
          "\n  ＝ GitHub を経由しない経路でデプロイされた可能性が高い。" +
          "\n  git fetch origin してもまだ無ければ、push されていないコミットで本番が動いている。"
      );
    }
  }

  process.exit(computeExitCode([result]));
}

main().catch((err) => {
  console.error("[check-deploy-freshness] 予期しないエラー:", err?.message ?? err);
  // ★落ちたときは緑にしない（測れなかった扱い）。
  process.exit(EXIT.INCONCLUSIVE);
});
