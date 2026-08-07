#!/usr/bin/env node
/**
 * 指定 JS/MJS ファイルから JS のコメント（// ... と /* ... *\/）を除去して stdout に出す。
 * 文字列リテラル内の // は誤検出しないように簡易トークン解析する。
 *
 * 用途: ios-shell-guardrail.yml が「実行コード行だけ」を grep するために使う。
 * コメント内の「FujisanBridgeViewController」等は過去経緯の引用として許容したいが、
 * 実行コード内の同名は禁止したい。
 */
import fs from 'node:fs';

const file = process.argv[2];
if (!file) {
  console.error('usage: node scripts/strip-comments.mjs <file>');
  process.exit(2);
}

let src = fs.readFileSync(file, 'utf8');

// ブロックコメント /* ... */ を空白で置換（複数行対応）
src = src.replace(/\/\*[\s\S]*?\*\//g, ' ');

// 行コメント // ... を行末まで除去
src = src
  .split('\n')
  .map((line) => {
    let inStr = null;
    let out = '';
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (inStr) {
        out += c;
        if (c === inStr && line[i - 1] !== '\\') inStr = null;
      } else if (c === "'" || c === '"' || c === '`') {
        inStr = c;
        out += c;
      } else if (c === '/' && line[i + 1] === '/') {
        break; // 行末まで読み飛ばし
      } else {
        out += c;
      }
    }
    return out;
  })
  .join('\n');

process.stdout.write(src);
