/**
 * public/ のブランドアセットを dist/ に強制上書きし、HTML 内 favicon に版数クエリを付与。
 */
const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const PUBLIC = path.join(ROOT, "public");
const DIST = path.join(ROOT, "dist");

const BRAND_FILES = [
  "favicon.ico",
  "favicon-16.png",
  "favicon-32.png",
  "favicon-48.png",
  "pwa-icon-180.png",
  "pwa-icon-192.png",
  "pwa-icon-512.png",
  "pwa-icon-512-maskable.png",
  "manifest.json",
];

const version = (
  process.env.EXPO_PUBLIC_BUILD_SHA ||
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.COMMIT_SHA ||
  String(Date.now())
).slice(0, 12);

function listHtml(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, name.name);
    if (name.isDirectory()) listHtml(full, acc);
    else if (name.name.endsWith(".html")) acc.push(full);
  }
  return acc;
}

function copyBrandAssets() {
  if (!fs.existsSync(DIST)) {
    console.error("[sync-brand-to-dist] dist not found");
    process.exit(1);
  }
  let copied = 0;
  for (const file of BRAND_FILES) {
    const src = path.join(PUBLIC, file);
    const dest = path.join(DIST, file);
    if (!fs.existsSync(src)) {
      console.error(`[sync-brand-to-dist] missing source: public/${file}`);
      process.exit(1);
    }
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    copied++;
  }
  // 旧パスは dist に置かない
  for (const stale of ["favicon.png", "icon-tab.png", "brand/icon-tab.png"]) {
    const p = path.join(DIST, stale);
    if (fs.existsSync(p)) {
      fs.unlinkSync(p);
      console.log(`[sync-brand-to-dist] removed stale dist/${stale}`);
    }
  }
  console.log(`[sync-brand-to-dist] copied ${copied} brand files to dist/`);
  return copied;
}

function patchHtmlFavicons() {
  const htmlFiles = listHtml(DIST);
  let patched = 0;
  const faviconRe =
    /(\/(?:icon-tab|favicon(?:-\d+)?|icon-\d+|apple-touch-icon)\.(?:png|ico))(?:\?v=[^"'\s>]*)?/g;

  for (const file of htmlFiles) {
    let html = fs.readFileSync(file, "utf8");
    const next = html.replace(faviconRe, `$1?v=${version}`);
    if (next !== html) {
      fs.writeFileSync(file, next);
      patched++;
    }
  }
  console.log(`[sync-brand-to-dist] patched favicon query in ${patched} html files`);
}

function main() {
  copyBrandAssets();
  patchHtmlFavicons();
}

main();
