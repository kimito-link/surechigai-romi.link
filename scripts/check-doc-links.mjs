#!/usr/bin/env node
/**
 * ドキュメントの Markdown リンク切れを検出する。
 *
 * kimito-link の tools/check-doc-links.js を移植したもの。
 * 移植時に surechigai 向けの改良を2点入れてある:
 *
 *   1. リポジトリルート基準のパスも許容する
 *      docs/ 配下の md は `components/foo.tsx` のようにルートからのパスで
 *      書かれていることが多い。相対のみで判定すると誤検知が30件出て、
 *      本物(21件)より多くなりツールとして使われなくなる。
 *   2. 対象を固定リストではなく docs/ 配下の全 md + ルートの主要 md にする
 *      引き継ぎ資料のように後から増える md を書き漏らさないため。
 *
 * 実行: node scripts/check-doc-links.mjs
 * 終了コード: リンク切れがあれば 1
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

/** 検査対象外。生成物・外部由来など、直しようがないもの。 */
const EXCLUDE_DIRS = new Set(["node_modules", ".git", "dist", "build"]);

/** `[text](target)` の target を拾う。画像 `![]()` も同じ形なので拾える。 */
const LINK_REGEX = /\[[^\]]*\]\(([^)]+)\)/g;

/** `<...>` 囲みを外し、アンカー `#...` とクエリを落とす。 */
function normalizeTarget(raw) {
  let target = raw.trim();
  if (target.startsWith("<") && target.endsWith(">")) {
    target = target.slice(1, -1);
  }
  // タイトル付きリンク `path "title"` の title を落とす
  target = target.replace(/\s+["'].*["']$/, "");
  return target.split("#")[0].split("?")[0].trim();
}

/** ネットワーク越し・アンカーのみ・プロトコル付きは検査しない。 */
function isExternalLink(target) {
  return /^(https?:|mailto:|tel:|#|\/\/)/i.test(target);
}

function collectTargetFiles() {
  const files = [];
  for (const name of ["CLAUDE.md", "README.md"]) {
    if (fs.existsSync(path.join(ROOT, name))) files.push(name);
  }
  const docsDir = path.join(ROOT, "docs");
  if (fs.existsSync(docsDir)) {
    for (const entry of fs.readdirSync(docsDir, { withFileTypes: true })) {
      if (entry.isDirectory() && EXCLUDE_DIRS.has(entry.name)) continue;
      if (entry.isFile() && entry.name.endsWith(".md")) {
        files.push(path.posix.join("docs", entry.name));
      }
    }
  }
  return files;
}

function checkFileLinks(fileRelPath) {
  const filePath = path.join(ROOT, fileRelPath);
  const issues = [];
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  let inFence = false;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];

    // コードブロック内のパスは「例」であって参照ではない
    if (line.trimStart().startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    LINK_REGEX.lastIndex = 0;
    let match = LINK_REGEX.exec(line);
    while (match) {
      const target = normalizeTarget(match[1]);
      if (target && !isExternalLink(target)) {
        // 相対・ルートのどちらかで解決できれば良しとする
        const fromFile = path.resolve(path.dirname(filePath), target);
        const fromRoot = path.resolve(ROOT, target.replace(/^\.\//, ""));
        if (!fs.existsSync(fromFile) && !fs.existsSync(fromRoot)) {
          issues.push({ file: fileRelPath, line: i + 1, link: match[1] });
        }
      }
      match = LINK_REGEX.exec(line);
    }
  }
  return issues;
}

const targets = collectTargetFiles();
const issues = targets.flatMap(checkFileLinks);

if (issues.length > 0) {
  console.error(`[check-doc-links] リンク切れ ${issues.length}件`);
  for (const issue of issues) {
    console.error(`  - ${issue.file}:${issue.line} -> ${issue.link}`);
  }
  console.error("");
  console.error("直し方: 参照先を実在するパスに直すか、記述ごと消す。");
  process.exit(1);
}

console.log(`[check-doc-links] OK: ${targets.length}ファイルにリンク切れなし`);
