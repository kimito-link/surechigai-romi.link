#!/usr/bin/env node
/**
 * ホーム画面から開いた(PWA)ときの起動の「画面の移り変わり」を、フレーム単位で測る。
 *
 * ■ なぜ要るか（2026-10-05、実機の画面録画で「スプラッシュがちかちかする」と報告された）
 *   起動の1秒弱に、色の違う画面が連続していた:
 *     ベール(#romi-boot-veil) → 無地 → 灰色の骨組み → 本編
 *   ★目視では何が何ミリ秒続くか分からず、直したかどうかも判定できない。
 *   本番を「PWA で起動した」状態に見立て、フレームごとに状態を記録して並べる。
 *
 * ■ 何を測るか
 *   boot=…    <html data-auth-boot> の値（1=ベール中 / -=解除済み）
 *   veil:…    ベールが実際に見えているか
 *   tabbar:…  タブバーが出ているか
 *   stage=…   HERO（本編） / BRAND-LOADING（ブランドの待機画面） / blank/skeleton（空白か骨組み）
 *   ★見るのは「ベールが外れてから HERO か BRAND-LOADING が出るまで」の空白の長さ。
 *
 * ■ 測っていないもの（過信を防ぐ）
 *   - iOS 固有の起動画像（apple-touch-startup-image）は測れない（iOS は実機か CI の Mac が要る）。
 *   - Android の OS 標準の起動画面（白＋アイコン）は測れない。実機は adb の screenrecord で撮る
 *     （docs/symptoms.md SG-09 の手順）。
 *   - 端末ごとの実際の速さ。CPU とネットワークを絞った「見立て」。
 *
 * ■ 使い方
 *   node scripts/qa/measure-launch-timeline.mjs [url] [cpu遅延倍率]
 *   HINT=1 node scripts/qa/measure-launch-timeline.mjs   ← ログイン済みヒントの Cookie を付ける
 *   既定: url=https://surechigai.kimito.link/ / 倍率=2
 *   これは計測の道具で、`pnpm check` の合否には入れていない（端末と回線で値が揺れるため）。
 */
import { chromium, devices } from "playwright";

const url = process.argv[2] ?? "https://surechigai.kimito.link/";
const slow = Number(process.argv[3] ?? 2);

const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices["iPhone 15 Pro Max"], serviceWorkers: "block" });
await ctx.addInitScript(() => {
  // PWA standalone 起動を模す（app/+html.tsx の判定: matchMedia(display-mode: standalone) || navigator.standalone）
  Object.defineProperty(navigator, "standalone", { get: () => true });
  const orig = window.matchMedia.bind(window);
  window.matchMedia = (q) => (String(q).includes("display-mode: standalone") ? { ...orig("all"), matches: true, media: q } : orig(q));
  window.__tl = [];
  const t0 = performance.now();
  let last = "";
  const tick = () => {
    const de = document.documentElement;
    const veil = document.getElementById("romi-boot-veil");
    const root = document.getElementById("root");
    const vcs = veil ? getComputedStyle(veil) : null;
    const veilShown = !!vcs && vcs.display !== "none" && parseFloat(vcs.opacity) > 0.05;
    const txt = (root && root.innerText) || "";
    const hero = txt.includes("1タップではじめる");
    const hasTabbar = !!document.querySelector('[role="tablist"],[role="tab"]');
    const brand = !!(root && root.querySelector('[role="progressbar"]'));
    const stage = hero ? "HERO" : brand ? "BRAND-LOADING" : txt.length < 30 ? "blank/skeleton" : "other";
    const key = `boot=${de.getAttribute("data-auth-boot") ?? "-"} veil:${veilShown ? 1 : 0} tabbar:${hasTabbar ? 1 : 0} stage=${stage}`;
    if (key !== last) {
      window.__tl.push([Math.round(performance.now() - t0), key]);
      last = key;
    }
    if (performance.now() - t0 < 9000) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
});

if (process.env.HINT === "1") {
  await ctx.addCookies([{ name: "__client_uat", value: "1", domain: ".kimito.link", path: "/" }]);
}
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
await cdp.send("Emulation.setCPUThrottlingRate", { rate: slow });
await cdp.send("Network.enable");
await cdp.send("Network.emulateNetworkConditions", {
  offline: false,
  latency: 150,
  downloadThroughput: (1.6 * 1024 * 1024) / 8,
  uploadThroughput: (750 * 1024) / 8,
});
await page.goto(url, { waitUntil: "commit" });
await page.waitForTimeout(9500);
const tl = await page.evaluate(() => window.__tl);
await browser.close();

console.log(`url=${url} cpu×${slow} hint=${process.env.HINT === "1" ? "あり" : "なし"}`);
for (const [t, k] of tl) console.log(String(t).padStart(5) + "ms  " + k);

// 要約: ベールが外れてから、本編かブランドの待機画面が出るまでの空白
// ★「ベール中(boot=1)を経たあとの解除」だけを数える（ベールが付く前の boot=- は解除ではない）。
const onAt = tl.find(([, k]) => k.startsWith("boot=1 "));
const off = onAt && tl.find(([t, k]) => t > onAt[0] && k.startsWith("boot=- "));
const shown = tl.find(([t, k]) => off && t >= off[0] && (k.includes("stage=HERO") || k.includes("stage=BRAND-LOADING")));
if (off && shown) {
  console.log(`\n▶ ベール解除から ${shown[1].includes("HERO") ? "本編" : "ブランド待機画面"} まで ${shown[0] - off[0]}ms（この間は空白か骨組み）`);
} else {
  console.log("\n▶ 空白区間は検出されませんでした（解除と同時に本編/待機画面が出ている、または9秒内に出なかった）");
}

// ★★ここから下は 2026-10-12 追加。
//
// なぜ要るか（この計器自身の穴で、6秒の待ちを見逃していた）:
//   上の要約は「解除**から**本編まで」しか見ない。だから本番が
//   「ベールが6秒出っぱなし → 保険で外れる → すぐ本編」という状態でも
//   **0ms と表示されて健全に見えた**。利用者が実際に待つのは 6 秒の方。
//   ＝「解除までに何秒かかったか」を測らないと、体感と計器がずれる。
//
// 実測（本番・2026-10-12・3回とも再現）: 解除まで 6.0〜6.2 秒。
//   CPU×1（絞らない）でも 5.1 秒 ＝ 回線でも端末の遅さでもなく、
//   起動時に実行する JS が重いこと（index チャンク 716KB）が律速。
const BOOT_VEIL_FAILSAFE_MS = 6000; // app/+html.tsx の「6秒で自動解除」の保険
const BUDGET_MS = 2000; // 起動から本編/待機画面が出るまでの目標

if (off) {
  const releasedAt = off[0];
  console.log(`▶ ベールが外れるまで ${releasedAt}ms`);
  if (releasedAt >= BOOT_VEIL_FAILSAFE_MS) {
    // ★保険は「起きてはいけない」もの。発火＝正規の解除が間に合っていない。
    console.log(
      `🔴 ${BOOT_VEIL_FAILSAFE_MS}ms の保険で外れた疑い（正規の解除が間に合っていない）。` +
        "利用者はこの間ずっとベールを見ている",
    );
  }
}
if (shown) {
  console.log(`▶ 起動から ${shown[1].includes("HERO") ? "本編" : "待機画面"} まで 合計 ${shown[0]}ms`);
  if (shown[0] > BUDGET_MS) console.log(`🔴 目標 ${BUDGET_MS}ms を超えている`);
} else {
  // ★測れなかったことを緑にしない。
  console.log("🟡 本編/待機画面が9秒内に出なかった（測れていない。緑ではない）");
}
