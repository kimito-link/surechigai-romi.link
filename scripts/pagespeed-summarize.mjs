#!/usr/bin/env node
/**
 * Lighthouse JSON → スコア要約（CI / ローカル共通）
 * Usage: node scripts/pagespeed-summarize.mjs [report.json]
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const reportPath = resolve(process.argv[2] ?? "pagespeed-report.json");
if (!existsSync(reportPath)) {
  console.error(`Report not found: ${reportPath}`);
  process.exit(1);
}

const report = JSON.parse(readFileSync(reportPath, "utf8"));
const categories = report.categories ?? {};

const scores = {
  performance: Math.round((categories.performance?.score ?? 0) * 100),
  accessibility: Math.round((categories.accessibility?.score ?? 0) * 100),
  "best-practices": Math.round((categories["best-practices"]?.score ?? 0) * 100),
  seo: Math.round((categories.seo?.score ?? 0) * 100),
};

const metrics = report.audits ?? {};
const vitals = {
  fcp: metrics["first-contentful-paint"]?.displayValue,
  lcp: metrics["largest-contentful-paint"]?.displayValue,
  tbt: metrics["total-blocking-time"]?.displayValue,
  cls: metrics["cumulative-layout-shift"]?.displayValue,
  si: metrics["speed-index"]?.displayValue,
};

const failing = Object.values(metrics)
  .filter(
    (a) =>
      a.score !== null &&
      a.score < 1 &&
      a.scoreDisplayMode !== "informative" &&
      a.scoreDisplayMode !== "manual",
  )
  .sort((a, b) => (a.score ?? 0) - (b.score ?? 0))
  .slice(0, 12)
  .map((a) => ({
    id: a.id,
    score: a.score,
    title: a.title,
    value: a.displayValue ?? "",
  }));

console.log("## PageSpeed (Mobile Lighthouse)\n");
console.log("| Category | Score |");
console.log("|----------|------:|");
for (const [k, v] of Object.entries(scores)) {
  console.log(`| ${k} | **${v}** |`);
}
console.log("\n### Core metrics\n");
for (const [k, v] of Object.entries(vitals)) {
  if (v) console.log(`- ${k}: ${v}`);
}
console.log("\n### Top failing audits\n");
for (const f of failing) {
  console.log(`- \`${f.id}\` (${Math.round((f.score ?? 0) * 100)}): ${f.title}${f.value ? ` — ${f.value}` : ""}`);
}

const targets = { performance: 90, accessibility: 95, "best-practices": 95, seo: 100 };
const below = Object.entries(targets).filter(([k, t]) => (scores[k] ?? 0) < t);
if (below.length > 0) {
  console.log("\n### Below target\n");
  for (const [k, t] of below) {
    console.log(`- ${k}: ${scores[k]} / target ${t}`);
  }
  process.exitCode = 1;
}
