#!/usr/bin/env node
/**
 * scripts/qa/check-splash-served.mjs
 *
 * ★スプラッシュ画像が「本番で実際に配られているもの」を検査する。
 *
 * ■ なぜ必要か（2026-08-22 実障害）
 *   2026-08-21 に「濃紺の四角」を角丸化・拡大した（短辺比 0.28→0.62）。
 *   リポジトリの画像は正しく更新されていた。**それでも本番は旧版を配っていた。**
 *
 *   35時間後の実測（20解像度のうち8件を確認）:
 *     ios-1125x2436 / 1170x2532 / 1179x2556 / 1206x2622 / 1242x2208 → 0.279（旧）
 *     ios-1242x2688 / 1260x2736 / 1284x2778                        → 0.619（新）
 *   ＝ ★**新旧が混在していた**。全部古いなら気づけるが、混ざると気づけない。
 *
 *   原因: スプラッシュ画像は名前が固定で、Cloudflare が
 *   `max-age=31536000, immutable` で配る（cf-cache-status: HIT / Age: 126314）。
 *   デプロイの自動パージは `Cloudflare secrets not set` で**一度も動いていない**。
 *
 * ■ ★この検査が無いと何が起きるか
 *   `ls` や `git show --stat` では「更新した」ように見える。
 *   ファイルを開いても正しい。**壊れているのは配信なので、
 *   ローカルを見ている限り永久に気づけない。**
 *   このリポジトリは同じ型で繰り返し刺されている:
 *     - OGP が 200/image/png のまま 0 バイト（size を見るまで不明）
 *     - 地図の丸ピンが一度も出ていなかった（画像を落として目視して発覚）
 *     - チャンクに旧コードが residual（CDN_CACHE_EPOCH で対処）
 *
 * ■ 判定
 *   本番から**実ユーザーと同じURLで**実物を落とし、
 *   解像度あたりのバイト密度(bpp)の**開き**を見る。
 *   同じ意匠なら揃うはずで、旧版が混ざると倍以上ずれる。
 *   ★HTTPステータスは見ない（200のまま中身が古い、が実際に起きた）。
 *
 * 使い方:
 *   node scripts/qa/check-splash-served.mjs [https://surechigai.kimito.link]
 *   ※実ネットワークを叩くので pnpm check には入れない。デプロイ後に回す。
 */
import { computeExitCode, formatProbeReport } from "../lib/instrument-core.mjs";

const BASE = process.argv[2] ?? "https://surechigai.kimito.link";

/** scripts/sync-splash-spec.mjs の SPLASH_ASSET_VERSION と合わせる。 */
const ASSET_VERSION = 2;

/** 全20件は重いので、代表的な解像度を広く拾う（旧版が残っていた5件を必ず含む）。 */
const TARGETS = [
  "ios-1125x2436", // ← 2026-08-22 に旧版だった
  "ios-1170x2532", // ←
  "ios-1179x2556", // ←
  "ios-1206x2622", // ←
  "ios-1242x2208", // ←
  "ios-1242x2688",
  "ios-1290x2796",
  "ios-2048x2732",
  "ios-750x1334",
];

/** PNG の IHDR から寸法を読む（依存を増やさない）。 */
function pngSize(buf) {
  if (buf.length < 24) return null;
  if (buf.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") return null;
  return [buf.readUInt32BE(16), buf.readUInt32BE(20)];
}

/**
 * PNG をデコードせずに中央の箱の幅を測るのは難しいので、
 * ここでは **バイト長と寸法** を使った軽い判定に留めたうえで、
 * 実体の差は「同じ解像度の中で極端に小さい／大きい」で見る。
 *
 * ★厳密な画素測定は Python(Pillow) 側に任せる。
 *   この検査の役目は「配信されているものが更新後の実体か」を素早く見ることなので、
 *   ★**サイズの分布が二極化していないか**を見れば旧版の残留を捕まえられる
 *   （旧版は 78KB / 新版は 184KB のように倍以上違った）。
 */
async function fetchAsset(name) {
  // ★キャッシュ避けのパラメータを足してはいけない。
  //   最初この関数は `&_probe=${Date.now()}` を付けていた。すると毎回
  //   **CDN を回避して新しい実体を取ってしまい、旧版が配信されていても緑になる**。
  //   実際そうなっており、障害の最中に実行しても検出できなかった（実測で発覚）。
  //   ＝ ★**実ユーザーが受け取るURLと同じもの**を要求しなければ検査にならない。
  const url = `${BASE}/splash/${name}.png?v=${ASSET_VERSION}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
  const buf = Buffer.from(await res.arrayBuffer());
  return { res, buf, dim: pngSize(buf) };
}

const results = [];
const rows = [];

for (const name of TARGETS) {
  let got;
  try {
    got = await fetchAsset(name);
  } catch (e) {
    results.push({
      probe: `splash ${name}`,
      verdict: "inconclusive",
      evidence: null,
      detail: `取得できない: ${String(e).slice(0, 60)}`,
      howToFix: "ネットワークと本番の稼働を確認する",
    });
    continue;
  }

  const { res, buf, dim } = got;
  const [wantW, wantH] = name.replace("ios-", "").split("x").map(Number);
  const bytesPerPixel = buf.length / (wantW * wantH);

  const why = !res.ok
    ? `HTTP ${res.status}`
    : !dim
      ? "PNGとして読めない（HTMLが返っている可能性）"
      : dim[0] !== wantW || dim[1] !== wantH
        ? `寸法 ${dim[0]}x${dim[1]}（期待 ${wantW}x${wantH}）`
        : null;

  rows.push({ name, bytes: buf.length, bpp: bytesPerPixel, why });

  if (why) {
    results.push({
      probe: `splash ${name}`,
      verdict: "fail",
      evidence: { バイト: buf.length },
      detail: why,
      howToFix: "public/splash/ を作り直して再デプロイする",
    });
  }
}

// ★二極化の検出: 同じ意匠なら bytes/pixel はどの解像度でもだいたい揃うはず。
//   旧版が混ざると倍以上の開きが出る（実測: 旧0.026 / 新0.059）。
//
// ★中央値との比較にしてはいけない（2026-08-22 に実際に外した）。
//   旧版が**多数派**だと中央値そのものが旧版側に来るので、
//   「中央値より極端に小さいもの」は0件になり緑になる。
//   実データ: 旧5件・新4件 → 中央値0.0301 → しきい値0.0181 → 外れ0件。
//   ＝ ★**最も壊れている状況でだけ検出できない**という最悪の性質だった。
//   だから「どちら側が多いか」に依存しない **最大÷最小の開き** で見る。
const bpps = rows.filter((r) => !r.why).map((r) => r.bpp);
if (bpps.length >= 3) {
  const lo = Math.min(...bpps);
  const hi = Math.max(...bpps);
  const spread = hi / lo;

  // 解像度が違えば圧縮効率も多少違う（実測で 0.057〜0.101 の幅がある＝約1.77倍）。
  // 旧版混在時は 0.026 vs 0.101 ＝ 3.9倍になったので、2.5倍を境にする。
  const SPREAD_LIMIT = 2.5;

  if (spread > SPREAD_LIMIT) {
    const light = rows.filter((r) => !r.why && r.bpp < hi / SPREAD_LIMIT);
    results.push({
      probe: "スプラッシュ意匠の一致",
      verdict: "fail",
      evidence: {
        最小bpp: Number(lo.toFixed(4)),
        最大bpp: Number(hi.toFixed(4)),
        開き: `${spread.toFixed(1)}倍`,
      },
      detail:
        `解像度によって中身の重さが ${spread.toFixed(1)}倍 も違う` +
        `（旧版が配信されている疑い）: ${light.map((o) => o.name).join(", ")}`,
      howToFix:
        "scripts/sync-splash-spec.mjs の SPLASH_ASSET_VERSION を +1 して再デプロイ" +
        "（Cloudflare の immutable キャッシュに旧版が残っている）",
      limitation: "画素の意匠までは見ていない。バイト密度の開きで旧版残留を推定している",
    });
  } else {
    results.push({
      probe: "スプラッシュ意匠の一致",
      verdict: "pass",
      evidence: {
        検査した解像度: rows.length,
        開き: `${spread.toFixed(1)}倍`,
      },
      limitation: "画素の意匠までは見ていない",
    });
  }
}

for (const r of rows) {
  console.log(
    `  ${r.why ? "NG " : "OK "} ${r.name.padEnd(18)} ${String(r.bytes).padStart(7)}バイト  bpp=${r.bpp.toFixed(4)}`,
  );
}
console.log("");
console.log(formatProbeReport(results, { label: "check-splash-served" }));

process.exit(computeExitCode(results));
