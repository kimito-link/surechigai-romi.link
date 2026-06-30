const fs = require("fs");
const path = process.argv[2];
if (!path) {
  console.error("usage: node parse-lighthouse.cjs <json>");
  process.exit(1);
}
const lr = JSON.parse(fs.readFileSync(path, "utf8"));
const audits = lr.audits;
const perf = lr.categories.performance.score;
console.log(`PERFORMANCE SCORE: ${Math.round(perf * 100)}`);
const metrics = [
  "first-contentful-paint",
  "largest-contentful-paint",
  "total-blocking-time",
  "cumulative-layout-shift",
  "speed-index",
  "interactive",
];
console.log("\n--- Core metrics ---");
for (const m of metrics) {
  const a = audits[m] || {};
  console.log(`${m}: ${a.displayValue || "n/a"} (score=${a.score})`);
}
console.log("\n--- Failed audits ---");
const failed = Object.entries(audits)
  .filter(([, v]) => v.score !== null && v.score < 0.9 && v.scoreDisplayMode !== "informative")
  .sort((a, b) => (a[1].score ?? 1) - (b[1].score ?? 1));
for (const [k, v] of failed.slice(0, 15)) {
  console.log(`[${Math.round((v.score ?? 0) * 100)}] ${v.title}: ${v.displayValue || ""}`);
}
console.log("\n--- Opportunities ---");
const opps = Object.values(audits)
  .filter((v) => v.details?.type === "opportunity" && v.score !== null && v.score < 0.95)
  .sort((a, b) => (b.numericValue || 0) - (a.numericValue || 0));
for (const v of opps.slice(0, 10)) {
  console.log(`${v.title}: ${v.displayValue}`);
}
console.log("\n--- Top resources by transfer size ---");
const items = audits["network-requests"]?.details?.items || [];
const bySize = items
  .filter((i) => i.transferSize > 0)
  .sort((a, b) => b.transferSize - a.transferSize)
  .slice(0, 15);
for (const i of bySize) {
  const url = i.url.replace(/^https:\/\/surechigai\.kimito\.link/, "");
  console.log(`${Math.round(i.transferSize / 1024)}KB ${i.resourceType || "?"} ${url.slice(0, 120)}`);
}
console.log("\n--- Third party ---");
const tp = audits["third-party-summary"]?.details?.items || [];
for (const i of tp.slice(0, 10)) {
  console.log(`${Math.round(i.transferSize / 1024)}KB ${i.entity}`);
}
