/**
 * 都道府県ごとの静的OGP（描画・Blobが失敗したときの受け皿）を作る。
 * 実行: pnpm exec tsx scripts/generate-prefecture-og.mts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { renderShareCardImage } from "../lib/ogp/render-share-card-image.js";
import { PREFECTURES } from "../lib/ogp/sanitize-public-place.js";

const outDir = new URL("../public/og/prefectures/", import.meta.url);

async function main(): Promise<void> {
  mkdirSync(outDir, { recursive: true });
  for (const pref of PREFECTURES) {
    const image = await renderShareCardImage({ label: pref.name });
    if (!image) throw new Error(`render failed: ${pref.name}`);
    const file = new URL(`${pref.code}.jpg`, outDir);
    writeFileSync(file, image.body);
    console.log(`${pref.code} ${pref.name} ${image.body.byteLength}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
