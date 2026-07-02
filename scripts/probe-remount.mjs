import { chromium } from "playwright";
const b = await chromium.launch();
const p = await b.newPage();
await p.addInitScript(() => {
  window.__lcps = [];
  new PerformanceObserver((l) => {
    for (const e of l.getEntries())
      window.__lcps.push({ t: Math.round(e.startTime), size: e.size });
  }).observe({ type: "largest-contentful-paint", buffered: true });
  window.__markHero = () => {
    const els = [...document.querySelectorAll("*")].filter(
      (n) => n.childNodes.length && n.textContent.includes("移動の足あとを残して"),
    );
    const leaf = els[els.length - 1];
    if (leaf && !leaf.__probe) {
      leaf.__probe = Date.now();
      return true;
    }
    return false;
  };
});
await p.goto("http://localhost:5055/", { waitUntil: "domcontentloaded" });
const marked = await p.evaluate(() => window.__markHero && window.__markHero());
await p.waitForLoadState("load");
await p.waitForTimeout(3000);
const res = await p.evaluate(() => {
  const els = [...document.querySelectorAll("*")].filter(
    (n) => n.childNodes.length && n.textContent.includes("移動の足あとを残して"),
  );
  const leaf = els[els.length - 1];
  return {
    heroStillHasProbe: !!(leaf && leaf.__probe),
    lcpCount: window.__lcps.length,
    lcps: window.__lcps,
  };
});
console.log("marked at domcontentloaded:", marked);
console.log("hero node SAME after load+idle (no remount):", res.heroStillHasProbe);
console.log("LCP entries:", res.lcpCount, JSON.stringify(res.lcps));
await b.close();
