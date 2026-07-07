// LPの「幻燈(写し絵)」動画を録画する。ゲスト画面(認証不要)を本番URLで操作録画。
// plan JSON(store-assets/lp-video-plan.json)の steps を実行し webm を出力。
// 使い方: node scripts/record-lp-videos.mjs [videoName]  (省略で全部)
// 認証フロー(第二弾)は plan の auth:true + .auth/auth-state.json で対応(今回はゲストのみ)。
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = path.resolve(fileURLToPath(import.meta.url), "../..");
const URL = process.env.LP_VIDEO_BASE_URL || "https://surechigai.kimito.link";
const OUT_RAW = path.join(ROOT, ".tmp-lp-video-raw");
const PLAN_PATH = path.join(ROOT, "store-assets", "lp-video-plan.json");
const ONBOARDING_KEY = process.env.SCREENSHOT_ONBOARDING_KEY || "surechigai_onboarding_completed";

// 操作中に朱色の波紋を出す(操作していることを伝える・朱印の文法と色を揃える)。
const TAP_RIPPLE = `
  (function(){
    document.addEventListener('pointerdown', function(e){
      var r=document.createElement('div');
      r.style.cssText='position:fixed;left:'+(e.clientX-18)+'px;top:'+(e.clientY-18)+'px;width:36px;height:36px;border-radius:50%;border:2px solid #a8572f;opacity:.9;z-index:2147483647;pointer-events:none;transition:transform .5s ease,opacity .5s ease';
      document.body.appendChild(r);
      requestAnimationFrame(function(){ r.style.transform='scale(2.2)'; r.style.opacity='0'; });
      setTimeout(function(){ r.remove(); }, 520);
    }, true);
  })();
`;

// ゆっくり等速スクロール(1画面≒3秒目安)。requestAnimationFrame的に小刻み。
async function smoothScroll(page, px, durationMs) {
  const steps = Math.max(1, Math.round(durationMs / 16));
  const per = px / steps;
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, per);
    await page.waitForTimeout(16);
  }
}

async function runVideo(browser, v) {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    // recordVideo.size は CSS px 基準。viewport と一致させないと画面が左上に寄り余白が出る。
    recordVideo: { dir: OUT_RAW, size: { width: 390, height: 844 } },
  });
  // オンボーディングoverlay抑止 + タップ波紋
  await ctx.addInitScript(
    ({ onboardingKey, ripple }) => {
      try { window.localStorage.setItem(onboardingKey, "true"); } catch (e) {}
      window.addEventListener("DOMContentLoaded", () => { try { eval(ripple); } catch (e) {} });
    },
    { onboardingKey: ONBOARDING_KEY, ripple: TAP_RIPPLE }
  );
  const page = await ctx.newPage();
  console.log(`[rec] ${v.video}: ${v.steps.length}ステップ`);
  for (const s of v.steps) {
    if (s.goto) { await page.goto(`${URL}${s.goto}`, { waitUntil: "networkidle", timeout: 60000 }).catch(() => {}); }
    if (s.wait) { await page.waitForTimeout(s.wait); }
    if (s.scroll) { await smoothScroll(page, s.scroll.px, s.scroll.durationMs || 3000); }
    if (s.scrollBack) { await smoothScroll(page, -s.scroll.px, s.scroll.durationMs || 3000); }
    if (s.click) { await page.click(s.click, { timeout: 8000 }).catch(() => {}); }
  }
  await page.waitForTimeout(500);
  const videoPath = await page.video().path();
  await ctx.close(); // close で webm 確定
  // 一意名にリネーム
  const dest = path.join(OUT_RAW, `${v.video}.webm`);
  try { fs.renameSync(videoPath, dest); } catch (e) { console.warn("rename fail", e.message); }
  console.log(`[rec] ✅ ${v.video}.webm`);
}

(async () => {
  fs.mkdirSync(OUT_RAW, { recursive: true });
  const plan = JSON.parse(fs.readFileSync(PLAN_PATH, "utf8"));
  const only = process.argv[2];
  const list = only ? plan.videos.filter((v) => v.video === only) : plan.videos.filter((v) => !v.auth);
  console.log(`[rec] URL=${URL} / 録画=${list.map((v) => v.video).join(", ")}`);
  const browser = await chromium.launch({ headless: true });
  try {
    for (const v of list) { await runVideo(browser, v); }
  } finally {
    await browser.close();
  }
  console.log(`[rec] 完了。webm出力先: ${OUT_RAW}`);
})().catch((e) => { console.error(`[rec] ❌ ${e.message}`); process.exit(1); });
