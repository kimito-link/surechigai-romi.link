#!/usr/bin/env node
/**
 * scripts/qa/check-ogp-renders.mjs
 *
 * OGP画像が「本当に描画されているか」を実測する。
 *
 * ★なぜ必要か（2026-08-21 実障害）:
 *   `?pref=長野県` のように県が解決できる共有URLで、OGP画像が
 *   **200 / image/png のまま 0 バイト**になっていた。
 *   夜景の「県の位置に灯をともす」分岐が `border: undefined` を渡しており、
 *   Satori が描画に失敗して空の応答を返していた。
 *   avatar がある場合だけ通っていたため、**Xアイコンを取得できた人は正常・
 *   できない人は真っ白**という分かりにくい壊れ方をしていた。
 *   2026-08-19 から2日間、本番で壊れたまま気づかれなかった。
 *
 * ★HTTPステータスでは絶対に気づけない:
 *   200 を返し、Content-Type も image/png。**サイズと中身を見るしかない**。
 *   このリポジトリは同じ型で何度も刺されている
 *   （OGPの丸ピン未表示 / ライブカメラの302 / 白画面）。
 *
 * 判定:
 *   - HTTP 200 以外               → NG
 *   - Content-Type が image/*でない → NG
 *   - サイズが極端に小さい(<5KB)   → NG（0バイトや壊れた応答）
 *   - PNGヘッダの寸法が 1200x630   → 違えば NG
 *
 * 使い方:
 *   node scripts/qa/check-ogp-renders.mjs [https://surechigai.kimito.link]
 */

const BASE = process.argv[2] ?? "https://surechigai.kimito.link";
const MIN_BYTES = 5000;
const WANT = [1200, 630];

/** 本番で実際に使われる組み合わせを網羅する。分岐ごとに1つ以上。 */
const CASES = [
  { name: "場所なし(夜景・ピンなし)", qs: "" },
  { name: "県のみ(灯・アバターなし)", qs: "pref=長野県" },
  { name: "県+市区町村", qs: "pref=長野県&area=茅野市" },
  { name: "県+市+ハンドル", qs: "pref=長野県&area=茅野市&name=kimito_link" },
  { name: "北の端(北海道)", qs: "pref=北海道" },
  { name: "南の端(沖縄県)", qs: "pref=沖縄県" },
  { name: "市区町村のみ", qs: "area=茅野市" },
  {
    name: "アバターあり",
    qs: `pref=長野県&avatar=${encodeURIComponent(`${BASE}/pwa-icon-192.png`)}`,
  },
];

/** PNG の IHDR から寸法を読む */
function pngSize(buf) {
  if (buf.length < 24) return null;
  const sig = buf.subarray(0, 8).toString("hex");
  if (sig !== "89504e470d0a1a0a") return null;
  return [buf.readUInt32BE(16), buf.readUInt32BE(20)];
}

const failures = [];

for (const c of CASES) {
  const url = `${BASE}/api/og?${c.qs}${c.qs ? "&" : ""}_probe=${Date.now()}`;
  let res;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(30000) });
  } catch (e) {
    failures.push({ ...c, why: `取得できない: ${String(e).slice(0, 60)}` });
    continue;
  }

  const type = res.headers.get("content-type") ?? "";
  const buf = Buffer.from(await res.arrayBuffer());
  const dim = pngSize(buf);

  const why = !res.ok
    ? `HTTP ${res.status}`
    : !type.startsWith("image/")
      ? `Content-Type=${type}`
      : buf.length < MIN_BYTES
        ? `${buf.length}バイトしかない（描画に失敗している）`
        : !dim
          ? "PNGヘッダが読めない"
          : dim[0] !== WANT[0] || dim[1] !== WANT[1]
            ? `寸法 ${dim[0]}x${dim[1]}（期待 ${WANT[0]}x${WANT[1]}）`
            : null;

  if (why) failures.push({ ...c, why });
  console.log(
    `  ${why ? "NG " : "OK "} ${c.name.padEnd(26)} ${buf.length}バイト${dim ? ` ${dim[0]}x${dim[1]}` : ""}`,
  );
}

console.log("");
if (failures.length > 0) {
  console.error(`[check-ogp-renders] NG: ${failures.length}件`);
  for (const f of failures) {
    console.error(`  - ${f.name}  (?${f.qs})`);
    console.error(`      ${f.why}`);
  }
  console.error("");
  console.error("  OGP は 200/image/png を返したまま中身が空になることがある。");
  console.error(
    "  Satori に undefined のスタイル値を渡すと描画に失敗するのが典型" +
      "（2026-08-21 に border: undefined で実際に発生）。",
  );
  process.exit(1);
}

console.log(`[check-ogp-renders] OK: ${CASES.length}件すべて描画されている`);
