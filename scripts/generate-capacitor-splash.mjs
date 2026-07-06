/**
 * Capacitor 用スプラッシュ画像を生成する。
 * 実行: node scripts/generate-capacitor-splash.mjs
 *
 * 起動時に「君斗りんく」キャラロゴを表示する。金型（リバースハック=鮫ロゴ /
 * 富士山=kimito-link ロゴ）と同じ方式で、透過ロゴをブランド地色に中央合成する。
 *
 * 背景はブランド青 #00427B（capacitor.config の backgroundColor / LaunchScreen /
 * @capacitor/assets の --splashBackgroundColor と一致）。黒画面 GOLDEN-RULES 原則3
 * 「背景色はスプラッシュ画像の地色に一致させる（テーマの明暗で決めない）」に厳密準拠。
 * ロゴ（透過 PNG・キャラ）は青地でも黒髪・肌色・装飾で十分認識できる。
 *
 * 出力: assets/splash.png（青地＋ロゴ）, assets/splash-dark.png（同一）。
 * @capacitor/assets generate がこれを各サイズへ展開し LaunchScreen に焼き込む。
 */
import { mkdir, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const BG = { r: 0, g: 66, b: 123, alpha: 1 }; // #00427B（config/LaunchScreen/assets と一致）
const SIZE = 2732;
// ロゴ幅 = キャンバスの 42%（中央に程よく見える大きさ）。
// 動いている社内アプリ「リバースハック」と同じ値（GOLDEN-RULES「作り分けない」原則）。
const LOGO_RATIO = 0.42;

// 君斗りんく公式キャラロゴ（透過 PNG・1500x1500・正方形）。app.config.json の iconSource と同じ。
// 複数フォールバック（コピー元固有パスのハードコードで詰まる FIRST-SUBMISSION-blockers B3 対策）。
const LOGO_CANDIDATES = [
  path.join(root, 'assets', 'images', 'site-icon-source.png'),
  path.join(root, 'store-assets', 'appstore', 'app-icon-1024.png'),
  path.join(root, 'public', 'pwa-icon-512.png'),
];

const outDir = path.join(root, 'assets');

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function resolveLogo() {
  for (const c of LOGO_CANDIDATES) {
    if (await exists(c)) return c;
  }
  throw new Error(
    `splash logo not found. tried:\n${LOGO_CANDIDATES.join('\n')}`,
  );
}

async function main() {
  await mkdir(outDir, { recursive: true });

  const logoSrc = await resolveLogo();
  const logoW = Math.round(SIZE * LOGO_RATIO);
  const logo = await sharp(logoSrc)
    .resize({ width: logoW, withoutEnlargement: false })
    .png()
    .toBuffer();

  const composed = await sharp({
    create: { width: SIZE, height: SIZE, channels: 4, background: BG },
  })
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toBuffer();

  for (const name of ['splash.png', 'splash-dark.png']) {
    const out = path.join(outDir, name);
    await writeFile(out, composed);
    console.log('wrote', out, `(logo: ${path.relative(root, logoSrc)})`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
