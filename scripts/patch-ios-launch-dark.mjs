/**
 * iOS 起動時の白フラッシュ対策（最小・必要十分）。
 * CI の `npx cap copy ios` 後に実行する。
 *
 * 直す白の正体（実機録画で確認）:
 *   アイコンタップ → 起動アニメ → WKWebView が server.url を読みに行く間、
 *   ネイティブの下地が白いまま見える（本番 HTML 到着前なので web 側の
 *   インライン CSS では塗れない領域）。
 *
 * 対策は2点だけ。富士山の最前面 UIWindow / Bridge VC ポーリング等の重装備は、
 * server.url リモート構成では過剰なので入れない（AGENTS.md「作り分けない」方針）。
 *   1. Info.plist  UIUserInterfaceStyle=Light（明色ブランド地に固定。下記の判断参照）
 *   2. LaunchScreen.storyboard の背景を #00427B（ブランド青）に
 * WebView 下地は capacitor.config.json の backgroundColor:#00427BFF が担当。
 *
 * 【surechigai の色判断・2026-07-06】金型(富士山)は暗色地 #0A0A0F + Dark固定だが、
 * surechigai のスプラッシュ地色は「ブランド青 #00427B」。黒画面GOLDEN-RULES 原則3
 * 「背景色はスプラッシュ画像の地色に一致させる（テーマの明暗で決めない）」に従い、
 * storyboard/backgroundColor を #00427B に統一する。Dark 固定は暗色地アプリで白フラッシュを
 * 防ぐための措置なので、青地の当アプリでは Light に固定（Exosome=明色地#FFFAF3 は
 * そもそも UIUserInterfaceStyle を触らない先例あり）。青地に対しては Light の方が
 * ステータスバー等の見えが自然で、下地色不一致による白/黒フラッシュも起きない。
 */
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const iosApp = path.join(root, 'ios', 'App', 'App');
const plist = path.join(iosApp, 'Info.plist');
const launchStoryboard = path.join(iosApp, 'Base.lproj', 'LaunchScreen.storyboard');

// #00427B を sRGB 0..1 で（0/255, 66/255, 123/255）— ブランド青（スプラッシュ地色と一致）
const R = '0';
const G = '0.25882352941176473';
const B = '0.4823529411764706';

// 起動時のシステム下地スタイル。青（明色寄り）地なので Light に固定（金型の暗色地は Dark）。
const UI_STYLE = 'Light';

function hasPlistBuddy() {
  return existsSync('/usr/libexec/PlistBuddy');
}

function plistBuddy(args) {
  execSync(`/usr/libexec/PlistBuddy ${args.map((a) => `"${a}"`).join(' ')}`, {
    stdio: 'inherit',
  });
}

// Windows / Linux 等 PlistBuddy(mac専用) が無い環境では Info.plist を文字列編集する。
// dns-osint(web-health-check-app)で実証済み。CI(mac)でも開発機(Windows)でも黒画面回避2点が適用できる。
function patchPlistByText() {
  let s = readFileSync(plist, 'utf8');
  if (s.includes('UIUserInterfaceStyle')) {
    console.log('patch-ios-launch-dark: UIUserInterfaceStyle 既設(text)');
    return;
  }
  const re = /(<key>UILaunchStoryboardName<\/key>\s*\r?\n\s*<string>LaunchScreen<\/string>)/;
  if (re.test(s)) {
    s = s.replace(re, `$1\n\t<key>UIUserInterfaceStyle</key>\n\t<string>${UI_STYLE}</string>`);
  } else {
    s = s.replace(/<\/dict>/, `\t<key>UIUserInterfaceStyle</key>\n\t<string>${UI_STYLE}</string>\n</dict>`);
  }
  writeFileSync(plist, s, 'utf8');
  console.log(`patch-ios-launch-dark: UIUserInterfaceStyle=${UI_STYLE} (text-insert)`);
}

function patchPlist() {
  if (!existsSync(plist)) {
    console.warn('patch-ios-launch-dark: skip Info.plist (missing)');
    return;
  }
  if (!hasPlistBuddy()) {
    patchPlistByText(); // Windows / Linux
    return;
  }
  try {
    plistBuddy(['-c', 'Print :UIUserInterfaceStyle', plist]);
    plistBuddy(['-c', `Set :UIUserInterfaceStyle ${UI_STYLE}`, plist]);
  } catch {
    plistBuddy(['-c', `Add :UIUserInterfaceStyle string ${UI_STYLE}`, plist]);
  }
  console.log(`patch-ios-launch-dark: UIUserInterfaceStyle=${UI_STYLE}`);
}

async function patchLaunchStoryboard() {
  if (!existsSync(launchStoryboard)) {
    console.warn('patch-ios-launch-dark: skip LaunchScreen.storyboard (missing)');
    return;
  }
  let xml = await readFile(launchStoryboard, 'utf8');
  const colorTag = `<color key="backgroundColor" red="${R}" green="${G}" blue="${B}" alpha="1" colorSpace="custom" customColorSpace="sRGB"/>`;
  if (xml.includes('key="backgroundColor"')) {
    xml = xml.replace(/<color key="backgroundColor"[^/]*\/>/g, colorTag);
  } else if (xml.includes('<view key="view"')) {
    xml = xml.replace(/(<view key="view"[^>]*>)/, `$1\n                        ${colorTag}`);
  } else {
    console.warn('patch-ios-launch-dark: LaunchScreen has no recognizable view/color node');
    return;
  }
  await writeFile(launchStoryboard, xml, 'utf8');
  console.log('patch-ios-launch-dark: LaunchScreen background -> #00427B');
}

async function main() {
  if (!existsSync(path.join(root, 'ios'))) {
    console.warn('patch-ios-launch-dark: ios/ not found — skip (local or non-iOS job)');
    return;
  }
  patchPlist();
  await patchLaunchStoryboard();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
