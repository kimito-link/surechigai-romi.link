/**
 * 君斗りんくのすれ違ひ通信 — ブランドアート（スプラッシュ / ストアアイコン）生成。
 *
 * デザイン方向（ユーザー確定 2026-07-06）: 「レーダー同心円 + ゆっくりりんく」。
 *   - 既存アプリのトンマナ（濃色地・キャラ中央・円モチーフ）を踏襲
 *   - 位置情報アプリらしさ = すれ違い通信の「電波が広がる」同心円レーダー
 *   - 地色はブランド青 #00427B（capacitor.config / LaunchScreen / splash と統一）
 *   - 中央に「ゆっくりりんく」キャラ（link-yukkuri-smile-mouth-open）
 *   - アクセントはオレンジ #F97316（既存レーダーUIの中央点）
 *
 * 出力:
 *   - assets/splash.png / assets/splash-dark.png  (2732, スプラッシュ。キャラ大きめ中央)
 *   - store-assets/appstore/app-icon-1024.png      (1024, iOS/Play アイコンマスター)
 *
 * これらを @capacitor/assets generate が各サイズへ展開し LaunchScreen/アイコンに焼き込む。
 * 実行: node scripts/generate-brand-radar-art.mjs
 */
import { mkdir, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

// --- ブランド色 ---
const BG = '#00427B'; // ブランド青（地色・全アセット統一）
const BG_DEEP = '#003461'; // わずかに濃い青（外周ビネット用。中央→外周でわずかに沈める）
const RING = '#8FB8DE'; // レーダー円（淡い水色。青地で視認できる明度）
const RING_SOFT = '#5E8FB8'; // 内側の弱い円
const ACCENT = '#F97316'; // オレンジ（中央点・スキャン）

// キャラ候補（透過 PNG・正方形）。複数フォールバック（FIRST-SUBMISSION-blockers B3 対策）。
const CHAR_CANDIDATES = [
  path.join(
    root,
    '..',
    'kimito-link',
    'src',
    'images',
    'yukkuri-charactore-english',
    'link',
    'link-yukkuri-smile-mouth-open.png',
  ),
  path.join(root, 'assets', 'images', 'characters', 'link', 'link-yukkuri-smile-mouth-open.png'),
  path.join(root, 'assets', 'images', 'site-icon-source.png'),
];

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function resolveChar() {
  for (const c of CHAR_CANDIDATES) {
    if (await exists(c)) return c;
  }
  throw new Error(`character art not found. tried:\n${CHAR_CANDIDATES.join('\n')}`);
}

/**
 * レーダー同心円の背景SVGを作る。
 * @param {number} size 正方形の一辺
 * @param {number} maxR 最外周円の半径（size基準の比率で渡す側が調整）
 */
function radarSvg(size, { ringScale = 1 } = {}) {
  const c = size / 2;
  // 同心円の半径（外→内）。size に対する比率。
  const radii = [0.46, 0.36, 0.26, 0.16].map((r) => r * size * ringScale);
  const rings = radii
    .map((r, i) => {
      const stroke = i % 2 === 0 ? RING : RING_SOFT;
      const w = Math.max(2, size * 0.0035) * (i === 0 ? 1.2 : 1);
      const op = 0.55 - i * 0.06;
      return `<circle cx="${c}" cy="${c}" r="${r.toFixed(1)}" fill="none" stroke="${stroke}" stroke-width="${w.toFixed(1)}" opacity="${op.toFixed(2)}"/>`;
    })
    .join('\n    ');

  // 十字スキャンライン（レーダーらしさ）。最外周円の内側まで。
  const cross = radii[0];
  const lineW = Math.max(1.5, size * 0.0022);
  const crossLines = `
    <line x1="${c}" y1="${(c - cross).toFixed(1)}" x2="${c}" y2="${(c + cross).toFixed(1)}" stroke="${RING_SOFT}" stroke-width="${lineW.toFixed(1)}" opacity="0.35"/>
    <line x1="${(c - cross).toFixed(1)}" y1="${c}" x2="${(c + cross).toFixed(1)}" y2="${c}" stroke="${RING_SOFT}" stroke-width="${lineW.toFixed(1)}" opacity="0.35"/>`;

  // 45度のスイープ扇（レーダーが回るイメージの静止フレーム）。淡く。
  const sweepR = radii[0];
  const sweep = `
    <path d="M ${c} ${c} L ${c} ${(c - sweepR).toFixed(1)} A ${sweepR.toFixed(1)} ${sweepR.toFixed(1)} 0 0 1 ${(c + sweepR * 0.71).toFixed(1)} ${(c - sweepR * 0.71).toFixed(1)} Z" fill="${RING}" opacity="0.10"/>`;

  return Buffer.from(`
  <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs>
      <radialGradient id="bggrad" cx="50%" cy="46%" r="62%">
        <stop offset="0%" stop-color="${BG}"/>
        <stop offset="100%" stop-color="${BG_DEEP}"/>
      </radialGradient>
    </defs>
    <rect width="${size}" height="${size}" fill="url(#bggrad)"/>
    ${sweep}
    ${crossLines}
    ${rings}
  </svg>`);
}

async function compose({ size, charRatio, charYOffset, out, ringScale }) {
  const charSrc = await resolveChar();
  const charW = Math.round(size * charRatio);
  const char = await sharp(charSrc)
    .resize({ width: charW, withoutEnlargement: false })
    .png()
    .toBuffer();
  const charMeta = await sharp(char).metadata();

  const bg = await sharp(radarSvg(size, { ringScale })).png().toBuffer();

  // キャラを中央（やや上）に配置。charYOffset は size 比率で下方向。
  const left = Math.round((size - charMeta.width) / 2);
  const top = Math.round((size - charMeta.height) / 2 + size * charYOffset);

  const composed = await sharp(bg)
    .composite([{ input: char, left, top }])
    .png()
    .toBuffer();

  await mkdir(path.dirname(out), { recursive: true });
  await writeFile(out, composed);
  console.log('wrote', path.relative(root, out), `(${size}px, char ${charSrc.split(/[\\/]/).pop()})`);
}

async function main() {
  // スプラッシュ: 2732、キャラは中央やや上・大きめ、レーダーは画面いっぱい
  const splash = path.join(root, 'assets', 'splash.png');
  await compose({ size: 2732, charRatio: 0.42, charYOffset: -0.02, ringScale: 1, out: splash });
  await writeFile(path.join(root, 'assets', 'splash-dark.png'), await sharp(splash).png().toBuffer());
  console.log('wrote', 'assets/splash-dark.png (copy of splash)');

  // アイコン: 1024、キャラを一回り大きく（アイコンは視認性優先）、レーダーは少し詰める
  await compose({
    size: 1024,
    charRatio: 0.52,
    charYOffset: -0.01,
    ringScale: 1.02,
    out: path.join(root, 'store-assets', 'appstore', 'app-icon-1024.png'),
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
