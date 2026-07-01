#!/usr/bin/env node
/**
 * kimitolink-linktree の LP フォント資産を surechigai public/fonts/lp/ へ同期。
 * 用法: node scripts/sync-lp-fonts.mjs
 * 前提: 兄弟リポ ../kimitolink-linktree/public/fonts/lp/ に woff2 が存在すること。
 */
import { cp, mkdir, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const srcRoot = path.resolve(root, "../kimitolink-linktree/public/fonts/lp");
const destRoot = path.resolve(root, "public/fonts/lp");

async function copyDir(rel = "") {
  const src = path.join(srcRoot, rel);
  const dest = path.join(destRoot, rel);
  let entries;
  try {
    entries = await readdir(src, { withFileTypes: true });
  } catch {
    console.warn(`[sync-lp-fonts] skip missing: ${src}`);
    return;
  }
  await mkdir(dest, { recursive: true });
  for (const entry of entries) {
    const nextRel = rel ? `${rel}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      await copyDir(nextRel);
      continue;
    }
    await cp(path.join(src, entry.name), path.join(dest, entry.name));
    console.log(`[sync-lp-fonts] copied ${nextRel}`);
  }
}

const srcStat = await stat(srcRoot).catch(() => null);
if (!srcStat?.isDirectory()) {
  console.error("[sync-lp-fonts] source not found:", srcRoot);
  process.exit(1);
}

await copyDir();
console.log("[sync-lp-fonts] done → public/fonts/lp/");
