/**
 * node_modules 内の @clerk パッケージから `import.meta` を物理的に取り除く postinstall。
 *
 * 背景: @clerk/shared の getEnvVariable(.mjs) が `import.meta.env` を参照しており、
 * Expo Web は classic script でバンドルを読むため、出力に `import.meta` が残ると
 * 「Cannot use 'import.meta' outside a module」SyntaxError → 「Requiring unknown module」で
 * /sign-in が白画面になる。Babel プラグインでの除去は Vercel 環境で安定して効かなかったため、
 * install 直後にソースを `({})` へ置換して根本から無くす（local/Vercel 共通で確実）。
 *
 * `import.meta` → `({})` の置換により `import.meta.env` は undefined となり、Clerk 側の
 * `void 0 !== import.meta && import.meta.env && ...` ガードは安全に false へ倒れ、
 * process.env などへフォールバックする（挙動を壊さない）。
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(process.cwd(), "node_modules");
let scanned = 0;
let patched = 0;

function processClerkSubtree(dir) {
  const stack = [dir];
  while (stack.length) {
    const d = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(d, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entries) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) {
        stack.push(full);
      } else if (/\.(mjs|cjs|js)$/.test(e.name)) {
        scanned++;
        let content;
        try {
          content = fs.readFileSync(full, "utf8");
        } catch {
          continue;
        }
        if (content.includes("import.meta")) {
          try {
            fs.writeFileSync(full, content.replace(/import\.meta/g, "({})"));
            patched++;
          } catch {
            /* noop */
          }
        }
      }
    }
  }
}

function findClerkDirs(dir, depth) {
  if (depth > 8) return;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const full = path.join(dir, e.name);
    if (e.name === "@clerk") {
      processClerkSubtree(full);
    } else {
      findClerkDirs(full, depth + 1);
    }
  }
}

if (fs.existsSync(ROOT)) {
  findClerkDirs(ROOT, 0);
}
console.log(`[strip-import-meta] scanned=${scanned} patched=${patched}`);
