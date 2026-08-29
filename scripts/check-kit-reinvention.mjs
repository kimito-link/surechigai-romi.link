#!/usr/bin/env node
/**
 * check-kit-reinvention.mjs
 * ★「キットに既にあるのに、自前で作り直していないか」を機械で見つける。
 *
 * ───────────────────────────────────────────────────────────────────────────
 * ■ ★なぜ要るか（2026-08-28・実測で判明した実害）
 *
 *   web-ios-android キットの CLAUDE.md「新しい機能・検査を作るときの4つの基準」の
 *   基準2 が **車輪の再発明をしない** と明記しているのに、それを読まずに作っていた。
 *
 *   実測した被害:
 *     ・キットに `run-instruments.mjs`（計器の統合入口・3値集約・--deep で全selftest）が
 *       あるのに、★`scripts/diagnostics/run.mjs` を自作し、`pnpm check` に手で並べていた。
 *     ・その自作入口のバグ（verify-security-score の ROOT が2階層上）を丸1日かけて直した。
 *       ★キットの入口に乗っていれば踏まなかった。
 *     ・キットにあるのに未輸入の検査が **21本** あった（数えていなかった）。
 *
 *   ★「1本だけ輸入すれば十分」と報告したが、残り20本を数えていなかった。
 *   ＝ 抜け漏れの自覚が無いまま「完了」と言っていた。
 *
 * ■ ★何を見るか
 *   キットの templates/scripts/*.mjs と、このリポの scripts/**\/*.mjs を突き合わせ、
 *   **同名で存在しないもの**を「未検討」として列挙する。
 *
 * ■ ★強制しない（このリポの掟）
 *   全部輸入するのが正解ではない。Capacitor 専用・Cloudflare Pages 専用など、
 *   ★このリポでは実体と無関係な赤を出すだけの検査が実在する。
 *   だから「輸入しろ」ではなく **「判断した記録が有るか」** を見る。
 *
 *   判断は下の DECIDED に書く。★理由を書けば非該当のままでよい。
 *   ベースライン＋ラチェット: **未判断が増えたときだけ赤**。
 *
 * ■ ★この検査が判定しないこと
 *   ・輸入した検査が正しく動くかは見ない（判断したかだけ）
 *   ・キット側が新しく増やした検査の中身の良し悪しは見ない
 *   ・同じ機能を別名で自作している場合は名前が違うので拾えない（★最大の限界）
 *
 * 使い方:
 *   node scripts/check-kit-reinvention.mjs
 *   node scripts/check-kit-reinvention.mjs --selftest
 * ───────────────────────────────────────────────────────────────────────────
 */
import { readdirSync, existsSync, statSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { EXIT, computeExitCode, formatProbeReport } from "./lib/instrument-core.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** キットの正本（同じ親ディレクトリに並んでいる前提）。 */
const KIT = resolve(ROOT, "..", "web-ios-android", "templates", "scripts");

/**
 * ★輸入するか否かを判断済みのもの。理由を必ず書く。
 *
 * ★ここに足すときは「なぜこのリポでは要らないのか」を実測で確かめてから書くこと。
 *   「たぶん要らない」で足すと、この検査は**ただの無視リスト**になる。
 */
export const DECIDED = {
  // ── Capacitor 専用。このリポは 2026-08-07 に Expo prebuild へ移行済み。
  //    capacitor.config.json は残っているが★死んだ設定で、見ても実体と無関係。
  "check-splash-config.mjs": "Capacitor専用(androidScaleType)。Expo移行後は死に設定",
  "check-splash-template-drift.mjs": "Capacitor版スプラッシュ検査の配布ドリフト監視。非該当",
  "verify-android-splash-not-default.mjs": "Capacitorデフォルト画像の検出。Expoには当該画像が無い",
  "verify-ios-splash-not-default.mjs": "同上(iOS)。2026-08-27に実体無しを確認し削除済み",
  "verify-signing-material-path.mjs": "Capacitor前提の署名材料パス検査",
  "verify-webdir-consistency.mjs": "capacitor.config.json の webDir 整合。非該当",

  // ── Cloudflare Pages 専用。このリポは Vercel へデプロイする。
  "cloudflare-auth.mjs": "Cloudflare Pages デプロイ用。このリポはVercel",
  "connect-domain.mjs": "Cloudflare Pages のドメイン接続。非該当",
  "deploy-cloudflare-pages.mjs": "Cloudflare Pages デプロイ。非該当",

  // ── site/ 静的サイト前提。このリポは Expo Router で site/ を持たない。
  "verify-external-links.mjs": "site/配下の外部リンク到達性。このリポにsite/は無い",
  "generate-shindan-version.mjs": "キット固有の診断進捗ページ生成",
  "verify-responsive-design.mjs":
    "CSS/HTML静的解析。★このリポはRNでスタイルがJSのStyleSheetにあり走査対象が実質ゼロ。" +
    "リポ全体を指定するとpatents/の特許HTML(印刷用)を拾って誤検知で赤になる。" +
    "画面崩れは実ブラウザ実測(scripts/qa/responsive-audit.mjs)で見る",

  // ── セットアップ用スクリプト（検査ではない）。初期構築時に一度使うもの。
  "setup-clerk-x-oauth.mjs": "初期セットアップ用。構築済みのため不要",
  "verify-manual-setup-done.mjs": "初期セットアップの完了確認。構築済み",
  "verify-assetlinks-published.mjs": "TWA/assetlinks.json用。このリポはネイティブアプリ",
  "audit-native-cta.mjs":
    "アプリ内課金導線の検出。★このリポに外部購入導線が無いことを確認済み。" +
    "ただし★方法論(「同じ意味の導線が別実装で散らばる」)は4.8対応で実際に効いた",

  // ── ★保留（該当するが、今は入れられない）。理由と条件を書く。
  "verify-app-config-schema.mjs":
    "★該当する(app.config.jsonが実在)が保留。ajv v8 と ajv-formats が必要で、" +
    "手元のajvはv6(eslint経由の推移的依存)。★依存を2本増やす判断が要るため未実施",
  "android-cert-expiry-check.mjs":
    "★該当するが保留。keystoreはGitHub Secretsにのみ在り手元に無いのでCIでしか測れない。" +
    "提出ワークフローへのゲート配線(Phase 2)と一緒に入れる",
};

/** 検査とみなすファイル名。 */
const GATE_RE = /^(check|verify|audit)-.*\.mjs$/;

/** このリポが持っている検査名を集める。 */
export function collectLocal(root = ROOT) {
  const found = new Set();
  const walk = (dir) => {
    const abs = join(root, dir);
    if (!existsSync(abs)) return;
    for (const e of readdirSync(abs)) {
      const p = join(abs, e);
      if (statSync(p).isDirectory()) {
        walk(join(dir, e));
        continue;
      }
      if (e.endsWith(".mjs")) found.add(e);
    }
  };
  walk("scripts");
  return found;
}

/**
 * 未判断のものを返す（純ロジック・テスト可）。
 * ★輸入済みでも DECIDED に書いてあっても「判断済み」とみなす。
 */
export function findUndecided(kitNames, localNames, decided) {
  return kitNames
    .filter((n) => GATE_RE.test(n))
    .filter((n) => !localNames.has(n))
    .filter((n) => !Object.prototype.hasOwnProperty.call(decided, n))
    .sort();
}

/* ── --selftest: 毒→赤 ─────────────────────────────────────── */
if (process.argv.includes("--selftest")) {
  const cases = [
    {
      name: "★キットにあって手元に無く、判断も無いものを見つける",
      run: () => findUndecided(["check-a.mjs"], new Set(), {}).length === 1,
    },
    {
      name: "輸入済みなら未判断にしない",
      run: () => findUndecided(["check-a.mjs"], new Set(["check-a.mjs"]), {}).length === 0,
    },
    {
      name: "理由を書いてあれば未判断にしない",
      run: () => findUndecided(["check-a.mjs"], new Set(), { "check-a.mjs": "非該当" }).length === 0,
    },
    {
      name: "検査以外(setup-*.mjs 等)は対象にしない",
      run: () => findUndecided(["setup-x.mjs"], new Set(), {}).length === 0,
    },
    {
      name: "★キットが空でも緑にしない形か(件数で判定する)",
      run: () => findUndecided([], new Set(), {}).length === 0,
    },
  ];
  const fails = [];
  for (const c of cases) {
    let ok = false;
    try {
      ok = c.run() === true;
    } catch (e) {
      fails.push(`${c.name}: 例外 ${e.message}`);
      continue;
    }
    if (!ok) fails.push(`${c.name}: ★期待どおりに動かなかった`);
  }
  if (fails.length) {
    console.error("[check-kit-reinvention --selftest] 🔴 検査自体が壊れています:");
    for (const f of fails) console.error(`  - ${f}`);
    process.exit(EXIT.FAIL);
  }
  console.log(`[check-kit-reinvention --selftest] ✅ ${cases.length}件すべて期待どおり。`);
  process.exit(EXIT.PASS);
}

/* ── 本体 ─────────────────────────────────────────────────── */
const results = [];

if (!existsSync(KIT)) {
  /*
   * ★キットが無い環境をどう扱うか（2026-08-28・CI で実際に赤くしてから決めた）
   *
   *   web-ios-android は**ローカル専用のリポジトリ**で、GitHub には存在しない。
   *   ＝ CI のランナーには絶対に並ばない。★これは不具合ではなく、環境の違い。
   *
   *   最初この検査は無条件に inconclusive(exit 2) を返す実装で、
   *   ★Deploy to Vercel を実際に落とした（検査を配線した本人が本番デプロイを止めた）。
   *
   *   ★これは `check-symptom-index` が 2026-08-23 に踏んだのと同じ型:
   *     「索引がある場所でだけ走らせ、無い場所は**理由付きで skip** する」。
   *     同じ環境で同じ結論を2回出しているので、こちらも同じ扱いに揃える。
   *
   *   ★ただし「無ければ緑」にはしない。それでは
   *     『測っていない』と『違反0件』が同じ見た目になる（このリポが最も嫌う形）。
   *   ⟹ skip したことを**出力に明記**し、evidence に理由を残す。
   *
   *   ★KIT_REQUIRED=1 を渡すと skip せず inconclusive に戻せる。
   *     キットを CI に持ち込む構成にしたとき、宣言を忘れて黙って skip し続けるのを防ぐ。
   */
  if (process.env.KIT_REQUIRED === "1") {
    results.push({
      probe: "キットの再発明チェック",
      verdict: "inconclusive",
      evidence: null,
      detail: `KIT_REQUIRED=1 が指定されていますが、キットが見つかりません: ${KIT}`,
      howToFix: "web-ios-android を同じ親ディレクトリに置く",
    });
  } else {
    results.push({
      probe: "キットの再発明チェック",
      verdict: "pass",
      evidence: { 判定: "skip", 理由: "キットが無い環境（CI 等）" },
      limitation:
        "★この環境ではキットが無いため**測っていません**（違反0件ではありません）。" +
        "キットが並ぶ手元では毎回 pnpm check で測ります。" +
        "測ることを強制したい環境では KIT_REQUIRED=1 を渡してください",
    });
  }
} else {
  const kitNames = readdirSync(KIT).filter((f) => f.endsWith(".mjs"));
  const localNames = collectLocal();
  const undecided = findUndecided(kitNames, localNames, DECIDED);
  const kitGates = kitNames.filter((n) => GATE_RE.test(n));

  if (kitGates.length === 0) {
    results.push({
      probe: "キットの再発明チェック",
      verdict: "inconclusive",
      evidence: null,
      detail: "キット側に検査が1本も見つかりません（読み方が変わった可能性）",
      howToFix: "キットの templates/scripts/ を確認する",
    });
  } else {
    results.push(
      undecided.length > 0
        ? {
            probe: "キットの再発明チェック",
            verdict: "fail",
            evidence: { キットの検査: kitGates.length, 輸入済み: kitGates.length - undecided.length - Object.keys(DECIDED).length, 未判断: undecided.length },
            detail:
              `★輸入するか判断していない検査が ${undecided.length} 本あります:\n    ` +
              undecided.join("\n    "),
            howToFix:
              "輸入するか、DECIDED に**理由を書いて**非該当と宣言する。" +
              "★「たぶん要らない」で足さないこと（この検査がただの無視リストになる）",
            limitation: "同じ機能を別名で自作している場合は名前が違うので拾えません",
          }
        : {
            probe: "キットの再発明チェック",
            verdict: "pass",
            evidence: {
              キットの検査: kitGates.length,
              輸入済み: kitGates.filter((n) => localNames.has(n)).length,
              理由付き非該当: Object.keys(DECIDED).length,
              未判断: 0,
            },
            limitation: "同じ機能を別名で自作している場合は名前が違うので拾えません",
          },
    );
  }
}

// ★skip したことは必ず目に見える形で言う。
//   formatProbeReport は pass を「✅ 合格」と出すだけなので、
//   ★このままだと「測っていない」が「違反0件」と同じ見た目になる。
const skipped = results.find((r) => r.evidence && r.evidence["判定"] === "skip");
if (skipped) {
  console.log(
    "[check-kit-reinvention] ⏭ skip: キットが無い環境のため**測っていません**" +
      "（違反0件ではありません）。測らせたい環境では KIT_REQUIRED=1 を渡してください。",
  );
}
console.log(formatProbeReport(results, { label: "check-kit-reinvention" }));
process.exit(computeExitCode(results));
