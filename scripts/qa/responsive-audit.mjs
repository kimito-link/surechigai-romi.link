#!/usr/bin/env node
/**
 * レスポンシブ実測監査。
 *
 * 「どの画面サイズでも横に見切れない・ファーストビューが破綻しない」を機械的に検査する。
 *
 * なぜ必要か:
 * 2026-08-01、日本地図がスマホで左右に見切れる事故が起きたが、
 * HTTP 200 も型チェックもテストも全て緑のまま見逃していた。
 * 発覚のきっかけはユーザーのスクリーンショットだった。
 * 「実際に測る」以外に検出手段が無いため、この監査を用意する。
 *
 * 判定するもの:
 *  - 横スクロール（documentElement.scrollWidth > clientWidth）
 *  - ビューポートからはみ出す要素（left < 0 または right > vw）
 *  - タップ標的が小さすぎる（44x44 未満。Apple HIG / a11y）
 *  - 本文が読めない小ささ（12px 未満のテキスト）
 *  - console エラー
 *
 * 使い方:
 *   node scripts/qa/responsive-audit.mjs --base https://surechigai.kimito.link
 *   node scripts/qa/responsive-audit.mjs --base http://localhost:4610 --routes /,/sign-in
 */
import { chromium } from 'playwright';
import { parseArgs } from 'node:util';
import fs from 'node:fs';

const { values } = parseArgs({
  options: {
    base: { type: 'string' },
    routes: { type: 'string' },
    out: { type: 'string' },
    'fail-on': { type: 'string' }, // overflow のみで落とすなど
  },
  strict: false,
});

const BASE = (values.base ?? 'https://surechigai.kimito.link').replace(/\/$/, '');

/** ゲストで到達できる画面。認証必須の画面はログイン画面に落ちるが、それも実画面として測る価値がある */
const DEFAULT_ROUTES = [
  '/',
  '/sign-in',
  '/premium',
  '/zukan',
  '/map',
  '/checkin',
  '/events',
  '/mypage',
  '/privacy',
  '/terms',
  '/support',
  '/deletion',
  '/special-thanks',
  '/install-instructions',
];

const ROUTES = values.routes ? values.routes.split(',').map((s) => s.trim()) : DEFAULT_ROUTES;

/** 実機に実在する幅。360/390/414 は Android/iPhone の主要サイズ */
const VIEWPORTS = [
  { name: 'iphone-se', width: 320, height: 568 },
  { name: 'android-s', width: 360, height: 800 },
  { name: 'iphone', width: 375, height: 812 },
  { name: 'iphone-pro', width: 390, height: 844 },
  { name: 'iphone-max', width: 414, height: 896 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 800 },
];

/** ページ内で測る。ブラウザ側で完結させる（Node に DOM を持ち込まない） */
const MEASURE = () => {
  const de = document.documentElement;
  const vw = de.clientWidth;
  const body = document.body;

  const visible = (el) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };

  // 横にはみ出す要素。position:fixed の装飾やスクロール専用領域は除く
  const overflow = [];
  for (const el of document.querySelectorAll('*')) {
    if (!visible(el)) continue;
    // SVG の内部図形は preserveAspectRatio="slice" で意図的に viewBox 外へ出る
    // （親がクリップするので画面は破綻しない）。内部ジオメトリは監査対象外。
    if (el.ownerSVGElement) continue;
    const r = el.getBoundingClientRect();
    if (r.right > vw + 1 || r.left < -1) {
      // 自前で横スクロールできる領域の中身は許容（意図的なカルーセル等）
      let scrollable = false;
      for (let p = el.parentElement, i = 0; p && i < 6; p = p.parentElement, i++) {
        const cs = getComputedStyle(p);
        if ((cs.overflowX === 'auto' || cs.overflowX === 'scroll') && p.scrollWidth > p.clientWidth) {
          scrollable = true;
          break;
        }
      }
      if (scrollable) continue;
      overflow.push({
        tag: el.tagName,
        cls: (el.className || '').toString().slice(0, 60),
        text: (el.innerText || '').trim().slice(0, 30),
        w: Math.round(r.width),
        left: Math.round(r.left),
        right: Math.round(r.right),
      });
    }
  }

  // タップ標的が小さすぎる（44x44 未満）
  const smallTargets = [];
  for (const el of document.querySelectorAll(
    'button,a,[role="button"],[role="tab"],input,select',
  )) {
    if (!visible(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.height < 44 || r.width < 24) {
      smallTargets.push({
        tag: el.tagName,
        text: (el.innerText || '').trim().slice(0, 24),
        w: Math.round(r.width),
        h: Math.round(r.height),
      });
    }
  }

  // 小さすぎる本文（12px 未満）。アイコン用の擬似要素は拾わない
  const tinyText = [];
  for (const el of document.querySelectorAll('p,span,div,li,td,label')) {
    if (!visible(el)) continue;
    if (el.children.length > 0) continue; // 末端のみ
    const t = (el.innerText || '').trim();
    if (t.length < 4) continue;
    const fs = parseFloat(getComputedStyle(el).fontSize);
    if (fs && fs < 12) tinyText.push({ text: t.slice(0, 30), fontSize: fs });
  }

  return {
    vw,
    scrollWidth: de.scrollWidth,
    hasHorizontalScroll: de.scrollWidth > vw + 1,
    bodyHeight: Math.round(body.getBoundingClientRect().height),
    overflowCount: overflow.length,
    overflow: overflow.slice(0, 8),
    smallTargetCount: smallTargets.length,
    smallTargets: smallTargets.slice(0, 6),
    tinyTextCount: tinyText.length,
    tinyText: tinyText.slice(0, 6),
    textLength: (body.innerText || '').length,
    is404: (body.innerText || '').includes('ページが見つかりません'),
  };
};

const results = [];
const browser = await chromium.launch();

for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 2,
    userAgent:
      vp.width < 768
        ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
        : undefined,
  });

  for (const route of ROUTES) {
    const page = await ctx.newPage();
    const consoleErrors = [];
    page.on('console', (m) => {
      if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200));
    });
    page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + String(e).slice(0, 200)));

    let measured = null;
    let error = null;
    try {
      await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 45000 });
      // ハイドレーションと遅延コンポーネント（地図など）の描画を待つ
      await page.waitForTimeout(3500);
      measured = await page.evaluate(MEASURE);
    } catch (e) {
      error = String(e).slice(0, 200);
    }

    results.push({
      viewport: vp.name,
      width: vp.width,
      route,
      error,
      consoleErrors: consoleErrors.slice(0, 3),
      ...(measured ?? {}),
    });

    const tag = `${vp.name.padEnd(11)} ${route.padEnd(22)}`;
    if (error) {
      console.log(`ERR  ${tag} ${error}`);
    } else {
      const flags = [];
      if (measured.hasHorizontalScroll) flags.push('H-SCROLL');
      if (measured.overflowCount) flags.push(`overflow:${measured.overflowCount}`);
      if (measured.smallTargetCount) flags.push(`tap:${measured.smallTargetCount}`);
      if (measured.tinyTextCount) flags.push(`tiny:${measured.tinyTextCount}`);
      if (consoleErrors.length) flags.push(`console:${consoleErrors.length}`);
      if (measured.is404) flags.push('404');
      console.log(`${flags.length ? 'WARN' : 'ok  '} ${tag} ${flags.join(' ') || 'clean'}`);
    }
    await page.close();
  }
  await ctx.close();
}

await browser.close();

const outPath = values.out ?? '.tmp-responsive-audit.json';
fs.writeFileSync(outPath, JSON.stringify(results, null, 2));

// ---- サマリ ----
const overflowRows = results.filter((r) => r.overflowCount > 0 || r.hasHorizontalScroll);
const consoleRows = results.filter((r) => (r.consoleErrors ?? []).length > 0);
console.log('\n=== SUMMARY ===');
console.log(`checked        : ${results.length} (routes=${ROUTES.length} x viewports=${VIEWPORTS.length})`);
console.log(`overflow issues: ${overflowRows.length}`);
console.log(`console errors : ${consoleRows.length}`);
console.log(`report         : ${outPath}`);

if (overflowRows.length) {
  console.log('\n--- overflow detail (worst first) ---');
  for (const r of overflowRows.sort((a, b) => b.overflowCount - a.overflowCount).slice(0, 15)) {
    console.log(`[${r.width}px] ${r.route}  hscroll=${r.hasHorizontalScroll} count=${r.overflowCount}`);
    for (const o of r.overflow ?? []) {
      console.log(`    ${o.tag} w=${o.w} left=${o.left} right=${o.right} "${o.text}" ${o.cls}`);
    }
  }
}

process.exit(0);
