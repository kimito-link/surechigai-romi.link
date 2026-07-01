#!/usr/bin/env node
/**
 * 既知のコントラスト FAIL パターンを TSX から静的検出
 * Usage: node scripts/contrast-audit.mjs
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const SKIP = new Set(["node_modules", "dist", ".expo", "council"]);

const PATTERNS = [
  {
    id: "textWhite-on-light-surface",
    regex: /color:\s*color\.textWhite[\s\S]{0,120}backgroundColor:\s*color\.(surface|surfaceAlt|bg)/,
    severity: "high",
    hint: "textWhite on light surface",
  },
  {
    id: "textWhite-surfaceAlt-active",
    regex: /backgroundColor:\s*isActive\s*\?\s*color\.surfaceAlt[\s\S]{0,80}color:\s*isActive\s*\?\s*color\.textWhite/,
    severity: "high",
    hint: "active tab textWhite on white surfaceAlt",
  },
  {
    id: "hardcoded-midnight-bg",
    regex: /backgroundColor:\s*["']#0a0a0a["']/,
    severity: "medium",
    hint: "midnight bg — use palette.kimitoBg",
  },
  {
    id: "low-opacity-hint-text",
    regex: /color:\s*["']rgba\(245,\s*245,\s*245,\s*0\.[0-4]/,
    severity: "medium",
    hint: "faint white hint on any background",
  },
];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(tsx|ts)$/.test(name) && !name.includes(".test.")) out.push(p);
  }
  return out;
}

const files = walk(ROOT).filter(
  (f) =>
    !f.includes("node_modules") &&
    (f.includes("components") ||
      f.includes("features") ||
      f.includes("app") ||
      f.includes("theme")),
);

const findings = [];
for (const file of files) {
  const content = readFileSync(file, "utf8");
  const lines = content.split("\n");
  for (const pat of PATTERNS) {
    if (pat.regex.test(content)) {
      const lineNo = lines.findIndex((l) => pat.regex.test(l) || l.match(/backgroundColor|color:/)) + 1;
      findings.push({
        file: relative(ROOT, file),
        line: lineNo || 1,
        pattern: pat.id,
        severity: pat.severity,
        hint: pat.hint,
      });
    }
  }
}

console.log("file,line,pattern,severity,hint");
for (const f of findings) {
  console.log(`${f.file},${f.line},${f.pattern},${f.severity},${f.hint}`);
}
console.error(`\n${findings.length} finding(s)`);
process.exit(findings.length > 0 ? 0 : 0);
